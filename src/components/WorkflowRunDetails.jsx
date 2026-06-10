import { 
  Loader2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Terminal as TermIcon, 
  Workflow, 
  Activity, 
  CircleDashed,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { runsService } from "@/services/runs.service";

const getRelativeTime = (isoStr) => {
  if (!isoStr) return "Just now";
  try {
    const date = new Date(isoStr);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1e3);
    if (diffSec < 15) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return "1 min ago";
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs === 1) return "1 hr ago";
    return `${diffHrs} hrs ago`;
  } catch (e) {
    return "just now";
  }
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0s";
  const totalSecs = Math.round(ms / 1e3);
  if (totalSecs < 60) return `${totalSecs}s`;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs}s`;
};

export default function WorkflowRunDetails({ workflow, activeRunId, onSelectRunId }) {
  const [runsList, setRunsList] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [run, setRun] = useState(null);
  const [errorWord, setErrorWord] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  
  // Interactive console tabs to divide logs vs live variables
  const [activeTab, setActiveTab] = useState("logs"); // "logs" | "output"
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // 1. Fetch user runs periodically to keep run logs and status sidebar synced
  const fetchAllRuns = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("flowscrape_user") || "null");
      const username = userData?.username || "";
      if (!username) {
        setIsInitialLoading(false);
        return;
      }

      const data = await runsService.getRuns(username);
      // Filter runs matching this current workflow
      const relevantRuns = data.filter((r) => r.workflowId === workflow.id);
      setRunsList(relevantRuns);
    } catch (err) {
      console.error("Failed to load user run history:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Sync list of runs on mount and periodically
  useEffect(() => {
    fetchAllRuns();
    const interval = setInterval(fetchAllRuns, 4000);
    return () => clearInterval(interval);
  }, [workflow.id]);

  // 2. Track selected Run ID. If a run triggers externally, follow it.
  useEffect(() => {
    if (activeRunId) {
      setSelectedRunId(activeRunId);
    }
  }, [activeRunId]);

  // If no selected run, default to the latest execution of this workflow from the list
  useEffect(() => {
    if (!selectedRunId && runsList.length > 0) {
      setSelectedRunId(runsList[0].id);
    }
  }, [selectedRunId, runsList]);

  // 3. Keep selected Run data updated. Poll actively if its status is running.
  useEffect(() => {
    if (!selectedRunId) {
      setRun(null);
      return;
    }

    let isMounted = true;
    let timerId;

    const fetchDetails = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("flowscrape_user") || "null");
        const username = userData?.username || "";
        const data = await runsService.getRunById(username, selectedRunId);
        if (!data) throw new Error("Could not find requested execution details");
        
        if (!isMounted) return;
        setRun(data);
        setErrorWord(null);

        // Auto selection of phase id if none has been selected
        if (data && data.phases && data.phases.length > 0) {
          const activeOrRunning = data.phases.find((p) => p.status === "running");
          const firstCompleted = data.phases.find((p) => p.status === "completed");
          if (!selectedPhaseId) {
            setSelectedPhaseId(activeOrRunning?.name || firstCompleted?.name || data.phases[0].name);
          }
        }

        // Keep polling if the active run status is running
        if (data.status === "running") {
          timerId = setTimeout(fetchDetails, 1500);
        }
      } catch (err) {
        if (isMounted) {
          setErrorWord(err.message || "Failed to parse system run streams");
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [selectedRunId, selectedPhaseId]);

  // Helper selectors and runs
  const handleRunChange = (newRunId) => {
    setSelectedRunId(newRunId);
    setSelectedPhaseId(null); // Reset phase choice to auto select correct one
    if (onSelectRunId) {
      onSelectRunId(newRunId);
    }
  };

  // Copy standard run log contents safely
  const copyLogs = () => {
    let allLogsText = "";
    run?.phases?.forEach((phase) => {
      if (phase.log) {
        allLogsText += `--- PHASE: ${phase.name.toUpperCase()} (${phase.status.toUpperCase()}) ---\n${phase.log}\n\n`;
      }
    });
    if (!allLogsText) return;
    navigator.clipboard.writeText(allLogsText);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Download raw execution logs
  const downloadLogs = () => {
    let allLogsText = `FLOWSCRAPE RUN LOGS\n`;
    allLogsText += `Workflow: "${workflow.name}"\n`;
    allLogsText += `Run ID: ${selectedRunId}\n`;
    allLogsText += `Status: ${run?.status?.toUpperCase() || ""}\n`;
    allLogsText += `Started At: ${run?.startedAt || ""}\n`;
    allLogsText += `Credits: ${run?.creditsConsumed || 0}\n`;
    allLogsText += `==========================================\n\n`;

    run?.phases?.forEach((phase) => {
      if (phase.log) {
        allLogsText += `[PHASE: ${phase.name.toUpperCase()}]\n${phase.log}\n`;
        allLogsText += `------------------------------------------\n\n`;
      }
    });

    const blob = new Blob([allLogsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow_run_${selectedRunId}_logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy outputs parameters
  const copyOutput = (val) => {
    if (!val) return;
    const textToCopy = typeof val === "object" ? JSON.stringify(val, null, 2) : val;
    navigator.clipboard.writeText(textToCopy);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  // Download exact structured output
  const downloadOutput = (val, keyName) => {
    if (!val) return;
    const textData = typeof val === "object" ? JSON.stringify(val, null, 2) : val;
    let fileType = typeof val === "object" ? "application/json" : "text/plain";
    let extension = typeof val === "object" ? "json" : "txt";
    if (keyName === "extractedHtml") {
      fileType = "text/html";
      extension = "html";
    } else if (keyName === "webhookPayload" || keyName === "webhookResponse" || keyName === "apiPayload" || keyName === "apiResponse") {
      fileType = "application/json";
      extension = "json";
    }
    const blob = new Blob([textData], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow_run_${selectedRunId}_output_${keyName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render loading skeleton during initial mount & fetch
  if (isInitialLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-4" />
        <h3 className="text-sm font-bold font-mono tracking-widest text-zinc-300 uppercase">Loading history...</h3>
        <p className="text-xs text-zinc-500 mt-2 font-mono">Querying automated execution streams</p>
      </div>
    );
  }

  // Render when there is no history at all
  if (runsList.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-600 mb-4 animate-pulse">
          <Workflow className="w-6 h-6 text-zinc-500" />
        </div>
        <h3 className="text-sm font-bold font-mono tracking-widest text-zinc-300 uppercase">No executions found</h3>
        <p className="text-xs text-zinc-500 max-w-md mt-2 leading-relaxed">
          This workflow has not been executed yet. Click the 
          <span className="text-emerald-400 font-bold mx-1">Execute Run</span> 
          button in the top right to launch an automated browser session and scrape data!
        </p>
      </div>
    );
  }

  const activePhase = run?.phases?.find((p) => p.name === selectedPhaseId) || run?.phases?.[0];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-black text-zinc-100">
      
      {/* Left Column: List of past executions and details */}
      <div className="w-80 border-r border-zinc-900 flex flex-col h-full bg-zinc-950/20 select-none overflow-hidden shrink-0 text-left">
        
        {/* Runs Dropdown Selector */}
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/70">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">
            Execution History
          </label>
          <select
            value={selectedRunId || ""}
            onChange={(e) => handleRunChange(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold font-mono rounded-lg border border-zinc-850 bg-zinc-900 text-zinc-100 outline-none focus:border-zinc-700 transition-colors cursor-pointer"
          >
            {runsList.map((r, idx) => {
              const countNum = runsList.length - idx;
              const timeFormatted = new Date(r.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <option key={r.id} value={r.id}>
                  {`Run #${countNum} - ${r.status.toUpperCase()} (${timeFormatted})`}
                </option>
              );
            })}
          </select>
        </div>

        {/* Selected run overview card */}
        {run ? (
          <div className="p-4 space-y-3.5 text-xs text-zinc-300 border-b border-zinc-900 bg-zinc-950/20">
            {/* Status Info */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Status</span>
              <div className={`flex items-center gap-1.5 font-bold tracking-tight text-[11px] ${run.status === "running" ? "text-amber-500" : "text-emerald-400"}`}>
                {run.status === "running" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>RUNNING</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COMPLETED</span>
                  </>
                )}
              </div>
            </div>

            {/* Time Stamp info */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Triggered</span>
              <span className="font-bold text-zinc-200">
                {getRelativeTime(run.startedAt)}
              </span>
            </div>

            {/* Duration info */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Duration</span>
              <span className="font-bold text-zinc-200">
                {formatDuration(run.durationMs || (Date.now() - new Date(run.startedAt).getTime()))}
              </span>
            </div>

            {/* Credit deduction info */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Operational Cost</span>
              <span className="font-bold text-zinc-200 flex items-center gap-1 font-mono">
                {run.creditsConsumed} credits
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-600 italic font-mono text-xs">
            Loading card summaries...
          </div>
        )}

        {/* Phase Timeline checklist */}
        <div className="flex items-center justify-center gap-2 py-2.5 border-b border-zinc-900 bg-zinc-950/35 text-zinc-400 font-bold text-[9px] uppercase tracking-widest font-mono">
          <Layers className="w-3 h-3 text-zinc-500" />
          <span>Execution Phases</span>
        </div>

        <div className="p-3 flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
          {run?.phases?.map((phase, idx) => {
            const isActive = selectedPhaseId === phase.name;
            return (
              <button
                key={phase.name}
                onClick={() => setSelectedPhaseId(phase.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                  isActive 
                    ? "bg-zinc-900 text-white border-zinc-700 font-bold shadow-md" 
                    : "bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? "text-white" : "text-zinc-600"}`}>
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="text-xs font-bold leading-tight capitalize truncate font-mono tracking-tight">
                    {phase.name}
                  </span>
                </div>

                {phase.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
                {phase.status === "running" && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-amber-500" />}
                {phase.status === "pending" && <Circle className="w-3.5 h-3.5 shrink-0 text-zinc-800" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Beautiful terminal output / data viewport */}
      <div className="flex-1 bg-black p-5 flex flex-col overflow-hidden h-full">
        
        {/* Error Notification banner if any */}
        {errorWord && (
          <div className="p-3 bg-red-950/20 border border-red-500/10 text-red-400 rounded-lg flex items-center gap-2 text-xs mb-4 shrink-0 select-none">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorWord}</span>
          </div>
        )}

        {/* View mode toggle: Logs vs Extracted Data */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-1 select-none">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3.5 py-1.5 rounded-t-lg font-bold text-[10px] tracking-wider uppercase font-mono border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "logs"
                  ? "border-emerald-500 text-emerald-400 bg-zinc-950/10"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <TermIcon className="w-3.5 h-3.5" />
              <span>Full Raw Logs</span>
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-3.5 py-1.5 rounded-t-lg font-bold text-[10px] tracking-wider uppercase font-mono border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "output"
                  ? "border-emerald-500 text-emerald-400 bg-zinc-950/10"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Parsed Products & Variables</span>
            </button>
          </div>

          <div className="flex items-center gap-2 select-none font-mono text-[9px]">
            {activePhase?.status === "running" && (
              <span className="flex items-center gap-1 inline-flex bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-bold tracking-wider leading-none">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                processing
              </span>
            )}
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black hidden sm:inline">
              NODE: {activePhase?.name || "IDLE"}
            </span>
          </div>
        </div>

        {/* Top Control Action Bar for the raw log terminal */}
        {activeTab === "logs" ? (
          <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-900 rounded-xl px-4 py-2 mb-4 shrink-0 select-none">
            <div className="text-[9px] text-[#888] font-mono uppercase tracking-widest font-bold">
              Automated scraper output console stream
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyLogs}
                className="text-[10px] font-mono font-bold text-[#aaa] hover:text-emerald-400 px-2 py-1 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Copy entire logs stream"
              >
                {copiedLogs ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Logs</span>
                  </>
                )}
              </button>
              <button
                onClick={downloadLogs}
                className="text-[10px] font-mono font-bold text-[#aaa] hover:text-emerald-400 px-2 py-1 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Download raw log files"
              >
                <Download className="w-3 h-3" />
                <span>Download (.txt)</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Tab content viewport */}
        {activeTab === "logs" ? (
          <div className="flex-1 overflow-y-auto font-mono text-[11px] text-zinc-300 space-y-1.5 selection:bg-emerald-950/40 selection:text-emerald-300 leading-normal max-w-full text-left scrollbar-thin pr-1">
            {activePhase?.log ? (
              activePhase.log.split("\n").map((line, idx) => {
                if (!line.trim()) return null;
                const isSuccess = line.includes("successfully") || line.includes("OK") || line.includes("Correct") || line.includes("200 OK") || line.includes("finalized") || line.includes("cached") || line.includes("identified:");
                const isInfo = line.includes("Starting") || line.includes("Initializing") || line.includes("Executing") || line.includes("Running Advanced");
                const isAi = line.includes("Gemini") || line.includes("AI") || line.includes("ChatGPT") || line.includes("DeepSeek") || line.includes("Claude") || line.includes("inference");
                return (
                  <div
                    key={idx}
                    className={`border-l-2 pl-3 py-0.5 rounded-r transition-all text-left ${
                      isSuccess ? "border-emerald-500 text-emerald-400 bg-emerald-950/5" : 
                      isInfo ? "border-zinc-800 text-zinc-400 bg-zinc-900/5" : 
                      isAi ? "border-purple-500 text-purple-300 bg-purple-500/5" : 
                      "border-zinc-900 text-zinc-500"
                    }`}
                  >
                    <span className="text-zinc-700 inline-block mr-2 select-none font-bold">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    <pre className="whitespace-pre-wrap inline text-left leading-normal font-mono select-text select-all">{line}</pre>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-650 shrink-0 py-16 select-none bg-zinc-950/20 rounded-xl border border-dashed border-zinc-900">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-800 mb-2" />
                <p className="font-bold tracking-wider text-zinc-500 font-mono text-[10px] uppercase">Awaiting phase dispatcher stream...</p>
                <p className="text-[10px] text-zinc-600 tracking-wide font-mono mt-1">Select an active or completed milestone from the left sidebar timeline</p>
              </div>
            )}
          </div>
        ) : (
          /* "output" tab showing parsed variables, prices, titles, etc. */
          <div className="flex-1 overflow-y-auto space-y-5 text-left pr-1 scrollbar-thin">
            {run?.outputs && Object.keys(run.outputs).length > 0 ? (
              <div className="space-y-5 select-text">
                
                {/* Visual overview message */}
                <div className="p-4 bg-[#0a0f0d] border border-emerald-950/60 rounded-xl flex gap-3.5 font-sans text-left items-start select-none">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/25 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                      Parsed Products Dataset
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      Below is the extracted web scraping parameters and parsed variables. You can instantly export or clone them.
                    </p>
                  </div>
                </div>

                {/* List of outputs */}
                {Object.entries(run.outputs).map(([key, val]) => {
                  if (!val) return null;
                  
                  // Check if it's formatted as JSON or string
                  let isJson = false;
                  let parsedPretty = "";
                  try {
                    if (typeof val === "string") {
                      const cleaned = val.replace(/```json/i, "").replace(/```/, "").trim();
                      const parsed = JSON.parse(cleaned);
                      isJson = true;
                      parsedPretty = JSON.stringify(parsed, null, 2);
                    } else if (typeof val === "object") {
                      isJson = true;
                      parsedPretty = JSON.stringify(val, null, 2);
                    }
                  } catch (e) {
                    isJson = false;
                  }

                  let variableLabel = `Variable (${key})`;
                  let indicatorColor = "bg-zinc-600";
                  if (key === "extractedHtml") {
                    variableLabel = `🌐 RAW HTML SOURCE (${key})`;
                    indicatorColor = "bg-sky-500";
                  } else if (key === "extractedText") {
                    variableLabel = isJson ? `📊 PARSED ECOMMERCE PRODUCTS (${key})` : `📄 EXTRACTED TEXT (${key})`;
                    indicatorColor = isJson ? "bg-emerald-500" : "bg-amber-400";
                  } else if (key === "lastAiExtraction") {
                    variableLabel = `🤖 SMART AI EXTRACTION (${key})`;
                    indicatorColor = "bg-purple-500";
                  } else if (key === "webhookPayload") {
                    variableLabel = `📡 WEBHOOK TRANSMISSION PAYLOAD (${key})`;
                    indicatorColor = "bg-pink-500";
                  } else if (key === "webhookResponse") {
                    variableLabel = `📥 WEBHOOK API RESPONSE RECEIPT (${key})`;
                    indicatorColor = "bg-teal-400";
                  } else if (key === "apiPayload") {
                    variableLabel = `📡 API TRANSMISSION PAYLOAD (${key})`;
                    indicatorColor = "bg-pink-500";
                  } else if (key === "apiResponse") {
                    variableLabel = `📥 API RESPONSE RECEIPT (${key})`;
                    indicatorColor = "bg-teal-400";
                  }

                  return (
                    <div 
                      key={key} 
                      className="bg-zinc-950/80 border border-zinc-900 rounded-xl overflow-hidden shadow-xl"
                    >
                      {/* Sub-header inside each variable card */}
                      <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-900/60 flex items-center justify-between gap-4 select-none">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${indicatorColor}`} />
                          <span className="font-mono text-[10px] font-black text-zinc-300 tracking-wide uppercase truncate">
                            {variableLabel}
                          </span>
                        </div>

                        {/* Copy / Download tools for this specific block */}
                        <div className="flex items-center gap-1.5 font-mono text-[9px]">
                          <button
                            onClick={() => {
                              copyOutput(isJson ? parsedPretty : val);
                            }}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 hover:text-emerald-400 border border-zinc-850 text-zinc-400 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                          <button
                            onClick={() => downloadOutput(isJson ? parsedPretty : val, key)}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 hover:text-emerald-400 border border-zinc-850 text-zinc-400 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download ({key === "extractedHtml" ? "HTML" : (isJson ? "JSON" : "TXT")})</span>
                          </button>
                        </div>
                      </div>

                      {/* Display block */}
                      <div className="p-4 bg-black/40 overflow-x-auto font-mono text-[11px] text-zinc-300 selection:bg-emerald-950/40 select-all max-h-96">
                        {isJson ? (
                          <pre className="whitespace-pre text-emerald-400 leading-normal font-mono select-text select-all selection:bg-emerald-950/30">{parsedPretty}</pre>
                        ) : (
                          <pre className="whitespace-pre-wrap text-zinc-300 leading-normal font-mono select-text select-all selection:bg-zinc-950/30">{val}</pre>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty run output state */
              <div className="h-full flex flex-col items-center justify-center text-center p-12 select-none space-y-3 bg-zinc-950/10 rounded-xl border border-dashed border-zinc-900 my-4">
                <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-650 mx-auto">
                  <Activity className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="max-w-md space-y-1.5 mx-auto">
                  <h4 className="text-[10px] font-bold font-mono tracking-widest text-zinc-400 uppercase">Awaiting Extracted Variables</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
                    Once scraping or AI inference steps execute (like getHtml or Auto-Products extraction), the clean structured data parsed from target websites will appear right here dynamically in real-time.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear bottom-right Direct Result Delivery URLs right below the console tabs */}
        {run && (
          <div className="mt-3 pt-3 border-t border-zinc-900/60 flex flex-wrap justify-end items-center gap-4 shrink-0 select-none bg-black">
            <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest">
              Direct Result Delivery Endpoint:
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`/workflow/result?runId=${run.id}&raw=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-950/45 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg font-bold font-mono text-[10px] uppercase tracking-wider transition-all duration-150"
              >
                <span>RAW JSON</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <a
                href={`/workflow/result?runId=${run.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850/80 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg font-semibold font-mono text-[10px] uppercase tracking-wider transition-all duration-150"
              >
                <span>Standard response</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
