import { useState, useEffect } from "react";
import { 
  Zap, 
  Layers, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  BarChart3, 
  ChevronRight, 
  TrendingUp, 
  MousePointer, 
  Terminal,
  Cpu
} from "lucide-react";
import { workflowService } from "@/services/workflow.service";
import { runsService } from "@/services/runs.service";
import { userService } from "@/services/user.service";

export default function HomeDashboard({ onTabChange }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("flowscrape_user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState("credits"); // "credits" | "runs"
  const [activeHoverPoint, setActiveHoverPoint] = useState(null); // { index, dateStr, value, x, y }

  // Fetch all statistics from backend dynamically
  useEffect(() => {
    if (!user) return;
    
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [wData, rData, currentCredits] = await Promise.all([
          workflowService.getWorkflows(user.username),
          runsService.getHistoricalRuns(user.username),
          userService.getCredits(user.username)
        ]);

        setWorkflows(wData);
        setRuns(rData);
        setCredits(currentCredits);
      } catch (err) {
        console.error("Dashboard dynamic load failure:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  // If loading, show an elegant dark loading dashboard placeholder
  if (loading) {
    return (
      <div className="flex-1 bg-black p-6 sm:p-8 text-zinc-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <span className="text-xs font-mono text-zinc-500 tracking-wider">LOADING SECURE WORKSPACE DATA...</span>
      </div>
    );
  }

  // Determine if this is an "Initial / Started New Account" with no workflows executed
  const isStartedNewAccount = false;

  // Render Onboarding/Initial dashboard for starting new accounts
  if (isStartedNewAccount) {
    return (
      <div className="flex-1 bg-black p-6 sm:p-8 text-zinc-100 overflow-y-auto font-sans select-none animate-fade-in relative">
        {/* Ambient deep dark space background details */}
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-zinc-900/20 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-900/5 blur-[130px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                Workspace Base Center
              </h1>
              <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">
                Status: Setup Stage // Free allocation credited
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold tracking-wider font-mono">CREDITS ALLOCATED</span>
                <span className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  {credits}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Onboarding Hero */}
          <div className="bg-gradient-to-r from-zinc-950 to-zinc-900/50 border border-zinc-850/80 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0 select-none shadow-lg">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-3 max-w-2xl">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Let's configure your very first FlowScrape spider workflow
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  Your workspace has been seeded with <span className="text-emerald-400 font-semibold font-mono">100 operational credits</span> automatically. Connect browser launchers, navigation routes, and Gemini extraction nodes visually onto an interactive flowchart canvas.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onTabChange("workflows")}
                    className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    Create Scaffold Flow
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Educational step-by-step layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-500 tracking-wider">STAGE 01</div>
              <h3 className="text-sm font-bold text-white">Visual Blueprinting</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Add launch browser and press enter actions to model complex routes with absolute zero-code overhead.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-500 tracking-wider">STAGE 02</div>
              <h3 className="text-sm font-bold text-white">AI Formatting</h3>
              <p className="text-zinc-505 text-zinc-500 text-xs leading-relaxed">
                Connect the Gemini Extractor block and write prompts like "Get active product lists matching catalog layout" and specify expected schemas.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-500 tracking-wider">STAGE 03</div>
              <h3 className="text-sm font-bold text-white">Instant Data Extraction</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Trigger execution. FlowScrape automatically launches headless Sandboxes to crawl targets and outputs parsed structured JSON.
              </p>
            </div>
          </div>

          {/* Blurred Placeholder Dashboard demonstrating what will activate */}
          <div className="border border-zinc-900 rounded-xl p-5 space-y-4 filter opacity-40 select-nonepointer-events-none relative overflow-hidden select-none">
            {/* Overlay Cover informing they how to unlock */}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 z-10 text-center pointer-events-auto">
              <TrendingUp className="w-8 h-8 text-zinc-400 mb-2" />
              <h4 className="text-xs font-bold text-white tracking-widest uppercase font-mono">Workspace Analytics Inactive</h4>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                This dynamic chart will render real-time credits consumption and scraper execution details once your first workflow run concludes.
              </p>
            </div>

            {/* Dummy Mock Graphs to preserve aesthetic UI proportions */}
            <div className="flex justify-between items-center pb-2">
              <div className="h-4 w-40 bg-zinc-900 rounded" />
              <div className="h-4 w-20 bg-zinc-900 rounded" />
            </div>
            <div className="h-40 w-full bg-zinc-950 border border-zinc-900/60 rounded flex items-end justify-between p-4 px-8">
              {[40, 25, 75, 45, 90, 50, 60].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }} className="w-8 bg-zinc-900/80 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Dynamic Analytics Logic for Seasoned/Active Accounts ---
  
  // 1. Calculate general metric stats
  const totalWorkflows = workflows.length;
  const totalExecutionsCount = runs.length;
  const totalCreditsConsumed = runs.reduce((acc, r) => acc + (r.creditsConsumed || 0), 0);
  
  // Execution success rate percentage
  const successfulRuns = runs.filter((r) => r.status === "completed");
  const successRatePercentage = totalExecutionsCount > 0 
    ? parseFloat(((successfulRuns.length / totalExecutionsCount) * 100).toFixed(1)) 
    : 100.0;

  // Average execution duration in seconds
  const finishedRunsWithDuration = runs.filter((r) => r.status === "completed" && r.durationMs > 0);
  const avgDurationInSeconds = finishedRunsWithDuration.length > 0
    ? parseFloat(((finishedRunsWithDuration.reduce((acc, r) => acc + r.durationMs, 0) / finishedRunsWithDuration.length) / 1000).toFixed(1))
    : 0;

  // 2. Generate Date array for the Last 7 Days (e.g. June 1 to June 7)
  const daysOfAnalytics = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    daysOfAnalytics.push({
      dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      formattedIso: d.toISOString().split("T")[0],
      credits: 0,
      runs: 0
    });
  }

  // Bind active users runs to date slots
  runs.forEach((run) => {
    if (!run.startedAt) return;
    const runDayIso = run.startedAt.split("T")[0];
    const targetSlot = daysOfAnalytics.find((day) => day.formattedIso === runDayIso);
    if (targetSlot) {
      targetSlot.credits += run.creditsConsumed || 0;
      targetSlot.runs += 1;
    }
  });

  // Calculate scaling max configurations for SVG
  const peakCreditsValue = Math.max(...daysOfAnalytics.map((d) => d.credits), 1);
  const peakRunsValue = Math.max(...daysOfAnalytics.map((d) => d.runs), 1);

  // Compile coordinates path for SVG Area View Box (Width=500, Height=180)
  const chartWidth = 500;
  const chartHeight = 180;
  const pointOffset = chartWidth / 6;

  const currentMetricMax = activeMetric === "credits" ? peakCreditsValue : peakRunsValue;

  const chartCoordinates = daysOfAnalytics.map((day, idx) => {
    const dayValue = activeMetric === "credits" ? day.credits : day.runs;
    const x = idx * pointOffset;
    // Limit point padding height within SVG canvas coordinates
    const y = chartHeight - 20 - (dayValue / currentMetricMax) * (chartHeight - 40);
    return { x, y, value: dayValue, dateStr: day.dateStr };
  });

  // Generate string command vectors for SVG path line
  let linePathPoints = "";
  if (chartCoordinates.length > 0) {
    linePathPoints = `M ${chartCoordinates[0].x} ${chartCoordinates[0].y} ` + 
      chartCoordinates.slice(1).map((pt) => `L ${pt.x} ${pt.y}`).join(" ");
  }

  // Close the SVG contour below the stroke line to feed gradient Area shape
  const areaPathPoints = linePathPoints 
    ? `${linePathPoints} L ${chartWidth} ${chartHeight - 15} L 0 ${chartHeight - 15} Z` 
    : "";

  // 3. Setup NodeType / Usage breakdown statistics
  // Let's analyze the compiled nodes across the workflows
  let runTypeCounts = {
    browserSession: 0,
    navigation: 0,
    cheerioSelectors: 0,
    googleGeminiAI: 0,
    apiDeliveries: 0
  };

  workflows.forEach((wf) => {
    (wf.nodes || []).forEach((node) => {
      switch (node.type) {
        case "launchBrowser":
          runTypeCounts.browserSession += 1;
          break;
        case "navigate":
          runTypeCounts.navigation += 1;
          break;
        case "extractText":
        case "clickElement":
        case "pressEnter":
        case "fillInput":
        case "getHtml":
          runTypeCounts.cheerioSelectors += 1;
          break;
        case "extractAI":
          runTypeCounts.googleGeminiAI += 1;
          break;
        case "apiDelivery":
          runTypeCounts.apiDeliveries += 1;
          break;
        default:
          break;
      }
    });
  });

  // Find percentage ratios
  const totalWorkflowNodesObserved = Math.max(
    runTypeCounts.browserSession + 
    runTypeCounts.navigation + 
    runTypeCounts.cheerioSelectors + 
    runTypeCounts.googleGeminiAI + 
    runTypeCounts.apiDeliveries, 
    1
  );

  const formatPercentageOfNodes = (val) => {
    return Math.round((val / totalWorkflowNodesObserved) * 100);
  };

  return (
    <div className="flex-1 bg-black p-4 sm:p-6 md:p-8 text-zinc-100 overflow-y-auto font-sans select-none animate-fade-in relative">
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-zinc-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-950/5 blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Dashboard section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400 stroke-[2.5px]" />
              FlowScrape Command Desk
            </h1>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider mt-0.5">
              Live automated performance system / Connected to sandbox cluster
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-bold font-mono tracking-widest uppercase">NODES ONLINE</span>
          </div>
        </div>

        {/* Dynamic Key Stats panel grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-zinc-950 border border-zinc-900 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
            <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider">AVAILABLE CREDITS</span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">{credits}</span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/20" /> Active
              </span>
            </div>
            <div className="mt-3 text-[10px] text-zinc-650 text-zinc-500 border-t border-zinc-900/60 pt-2 text-left">
              Load and redeem under <button onClick={() => onTabChange("billing")} className="text-white underline hover:text-emerald-400 cursor-pointer font-semibold transition-colors">Billing</button>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
            <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider">WORKSPACES ALIVE</span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">{totalWorkflows}</span>
              <span className="text-[11px] text-amber-400 font-semibold font-mono uppercase">Flows</span>
            </div>
            <div className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-900/60 pt-2 text-left">
              Visual pipeline templates in database
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
            <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider">TOTAL ACTIVE RUNS</span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">{totalExecutionsCount}</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Runs</span>
            </div>
            <div className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-900/60 pt-2 text-left text-zinc-650">
              Total execution triggers fired
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
            <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider">TOTAL CONSUMED</span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">{totalCreditsConsumed}</span>
              <span className="text-[10px] text-zinc-500 font-mono">Credits</span>
            </div>
            <div className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-900/60 pt-2 text-left">
              Used in sandbox automation executions
            </div>
          </div>

        </div>

        {/* Dynamic Graphs display & Node Usage Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Custom SVG Line-Bar Area Graph */}
          <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 p-4 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-zinc-900/60 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Execution Activity Log</h3>
              </div>

              {/* Toggle metric tabs */}
              <div className="flex bg-zinc-900/60 border border-zinc-850 p-0.5 rounded-lg shrink-0">
                <button
                  onClick={() => {
                    setActiveMetric("credits");
                    setActiveHoverPoint(null);
                  }}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold font-mono transition-all cursor-pointer ${activeMetric === "credits" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
                >
                  CREDITS USED
                </button>
                <button
                  onClick={() => {
                    setActiveMetric("runs");
                    setActiveHoverPoint(null);
                  }}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold font-mono transition-all cursor-pointer ${activeMetric === "runs" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"}`}
                >
                  RUN CODES
                </button>
              </div>
            </div>

            {/* Render dynamically populated custom SVG Area Chart with custom coordinates */}
            <div className="relative flex-1 min-h-[180px] mt-2 select-none">
              {/* Dynamic Interactive Overriding Tooltip details on Hover */}
              {activeHoverPoint && (
                <div 
                  className="absolute bg-zinc-900 border border-zinc-800 text-white rounded px-2.5 py-1.5 shadow-xl text-left pointer-events-none z-10 animate-fade-in transition-all duration-100"
                  style={{ 
                    left: `${(activeHoverPoint.x / chartWidth) * 100}%`, 
                    top: `${(activeHoverPoint.y / chartHeight) * 100 - 35}%`,
                    transform: 'translateX(-50%)' 
                  }}
                >
                  <p className="text-[9px] font-bold font-mono text-zinc-500 uppercase">{activeHoverPoint.dateStr}</p>
                  <p className="text-[11px] font-bold font-mono text-emerald-400 mt-0.5">
                    {activeHoverPoint.value} {activeMetric === "credits" ? "Credits Used" : "Executions"}
                  </p>
                </div>
              )}

              {/* SVG Canvas Area */}
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full text-zinc-800"
                preserveAspectRatio="none"
              >
                {/* SVG Definitions for rich ambient color fills */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines aligned to division layers */}
                {[0, 1, 2, 3].map((slot) => {
                  const gridY = 20 + slot * ((chartHeight - 40) / 3);
                  return (
                    <line 
                      key={slot}
                      x1="0" 
                      y1={gridY} 
                      x2={chartWidth} 
                      y2={gridY} 
                      stroke="currentColor" 
                      strokeWidth="0.5" 
                      strokeDasharray="4 6" 
                      className="text-zinc-900/80"
                    />
                  );
                })}

                {/* SVG dynamic background Area Fill representing coordinates scope */}
                {areaPathPoints && (
                  <path 
                    d={areaPathPoints} 
                    fill="url(#chartGradient)" 
                    className="transition-all duration-300"
                  />
                )}

                {/* SVG Stroke line representing coordinates path */}
                {linePathPoints && (
                  <path 
                    d={linePathPoints} 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="1.8" 
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* Highlight Circle Elements placed on path line */}
                {chartCoordinates.map((pt, idx) => (
                  <circle 
                    key={idx}
                    cx={pt.x} 
                    cy={pt.y} 
                    r="3.5" 
                    fill="#10b981" 
                    stroke="#000000" 
                    strokeWidth="1.2"
                    className="hover:r-5 hover:fill-white cursor-pointer transition-all duration-150"
                  />
                ))}

                {/* Interactive wider hover areas on matching vertical columns to anchor tooltip easily */}
                {chartCoordinates.map((pt, idx) => {
                  const xStart = Math.max(0, pt.x - pointOffset / 2);
                  const xWidth = pointOffset;
                  return (
                    <rect 
                      key={idx}
                      x={xStart}
                      y="0"
                      width={xWidth}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        setActiveHoverPoint({
                          index: idx,
                          dateStr: pt.dateStr,
                          value: pt.value,
                          x: pt.x,
                          y: pt.y
                        });
                      }}
                      onMouseLeave={() => {
                        setActiveHoverPoint(null);
                      }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Bottom time labels */}
            <div className="flex justify-between items-center px-1 pt-2 shrink-0 border-t border-zinc-900/40">
              {daysOfAnalytics.map((day, ix) => (
                <span key={ix} className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tight">
                  {day.dateStr}
                </span>
              ))}
            </div>

          </div>

          {/* Usage Type Dashboard metrics */}
          <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 p-4 sm:p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Workspace Node Density</h3>
              </div>

              {/* Progress-style visualizer breakdown bar tracks */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400 font-semibold font-sans">AI Content Extraction</span>
                    <span className="text-emerald-400 font-mono font-bold">{formatPercentageOfNodes(runTypeCounts.googleGeminiAI)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${formatPercentageOfNodes(runTypeCounts.googleGeminiAI)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400 font-semibold font-sans">Cheerio DOM Selections</span>
                    <span className="text-zinc-200 font-mono font-bold">{formatPercentageOfNodes(runTypeCounts.cheerioSelectors)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 transition-all duration-300" style={{ width: `${formatPercentageOfNodes(runTypeCounts.cheerioSelectors)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400 font-semibold font-sans">Navigation Redirection Routes</span>
                    <span className="text-cyan-400 font-mono font-bold">{formatPercentageOfNodes(runTypeCounts.navigation)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${formatPercentageOfNodes(runTypeCounts.navigation)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400 font-semibold font-sans">Virtual Sandbox Handshakes</span>
                    <span className="text-indigo-400 font-mono font-bold">{formatPercentageOfNodes(runTypeCounts.browserSession)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${formatPercentageOfNodes(runTypeCounts.browserSession)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary status list */}
            <div className="grid grid-cols-2 gap-2 border-t border-zinc-900 pt-4 mt-4">
              <div className="p-3 bg-zinc-900/30 rounded-xl flex flex-col gap-0.5 border border-zinc-900/60">
                <span className="text-[9px] font-mono text-zinc-500 font-bold tracking-wider">SUCCESS RATE</span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {successRatePercentage}%
                </span>
              </div>

              <div className="p-3 bg-zinc-900/30 rounded-xl flex flex-col gap-0.5 border border-zinc-900/60">
                <span className="text-[9px] font-mono text-zinc-500 font-bold tracking-wider">AVG RUN DELAY</span>
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {avgDurationInSeconds}s
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Recent Workflows layout with execution hooks */}
        <div className="bg-zinc-950 border border-zinc-900 p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Dynamic Workflow Pipelines</h3>
            </div>

            <button
              onClick={() => onTabChange("workflows")}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono tracking-wider font-bold uppercase transition-colors duration-150 cursor-pointer"
            >
              Configure List
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {workflows.slice(0, 3).map((wf) => (
              <div 
                key={wf.id}
                className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-850 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{wf.name}</span>
                    <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-md px-1.5 py-0.5 uppercase">
                      {wf.trigger || "Manual"}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] font-sans truncate max-w-sm sm:max-w-md">
                    {wf.description || "No custom design specifications details specified."}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-zinc-500">CONSUMPTION VALUE</p>
                    <p className="text-xs font-mono font-bold text-white mt-0.5">{wf.credits} Credits</p>
                  </div>

                  {/* Active status representation flag */}
                  <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-900">
                    <button
                      onClick={() => onTabChange("workflows")}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 active:scale-95 transition-all text-zinc-300 font-bold text-[10px] font-mono border border-zinc-800 tracking-wider uppercase cursor-pointer"
                    >
                      OPEN BLUEPRINT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
