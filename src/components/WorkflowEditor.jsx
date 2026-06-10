import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Play,
  Save,
  CheckCircle,
  Zap,
  MousePointer,
  CornerDownLeft,
  FileText,
  Sparkles,
  Send,
  Database,
  Compass,
  Globe,
  Clock,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Code2
} from "lucide-react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ScraperNode from "./ScraperNode";
import { credentialsService } from "@/services/credentials.service";
const PALETTE_NODES = [
  {
    category: "User interactions",
    items: [
      { type: "navigate", name: "NAVIGATE URL", cost: 2, icon: Globe, color: "border-l-blue-500", defaultData: { url: "https://example.com" } },
      { type: "fillInput", name: "FILL INPUT", cost: 1, icon: FileText, color: "border-l-indigo-400", defaultData: { selector: "#input", value: "" } },
      { type: "pressEnter", name: "PRESS ENTER", cost: 1, icon: CornerDownLeft, color: "border-l-indigo-500", defaultData: { selector: ".btn" } },
      { type: "scrollToElement", name: "SCROLL TO ELEMENT", cost: 1, icon: Compass, color: "border-l-teal-500", defaultData: { selector: "#footer" } }
    ]
  },
  {
    category: "Data extraction",
    items: [
      { type: "getHtml", name: "GET HTML FROM PAGE", cost: 2, icon: FileText, color: "border-l-emerald-500", defaultData: {} },
      { type: "extractText", name: "EXTRACT TEXT FROM ELEMENT", cost: 2, icon: FileText, color: "border-l-emerald-600", defaultData: { selector: "h1" } },
      { type: "extractAI", name: "EXTRACT DATA WITH AI", cost: 4, icon: Sparkles, color: "border-l-purple-500", defaultData: { prompt: "Extract title, summary, and links", schema: '{\n  "items": [\n    { "title": "string", "url": "string" }\n  ]\n}' } }
    ]
  },
  {
    category: "Data storage",
    items: [
      { type: "readJson", name: "READ PROPERTY FROM JSON", cost: 1, icon: Database, color: "border-l-orange-400", defaultData: { propertyName: "id" } },
      { type: "nestedJson", name: "EXTRACT NESTED JSON", cost: 1, icon: Code2, color: "border-l-indigo-600", defaultData: { path: "data.*.companyName", outputType: "json" } }
    ]
  },
  {
    category: "Timing controls",
    items: [
      { type: "wait", name: "WAIT FOR ELEMENT", cost: 1, icon: Clock, color: "border-l-red-400", defaultData: { duration: 3 } }
    ]
  },
  {
    category: "Result delivery",
    items: [
      { type: "apiDelivery", name: "API REQUEST DELIVERY", cost: 1, icon: Send, color: "border-l-pink-500", defaultData: { url: "https://api.example.com/v1/deliver", method: "POST", headers: '{\n  "Content-Type": "application/json"\n}' } }
    ]
  }
];
const nodeTypes = {
  scraperNode: ScraperNode
};
function WorkflowEditorInner({
  workflow,
  onBack,
  onSave,
  onExecute,
  activeSubTab,
  onSubTabChange,
  children,
  runId
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [toastMessage, setToastMessage] = useState("Visual canvas initialized");
  const [trigger, setTrigger] = useState(workflow.trigger || "Manual");
  const [credentials, setCredentials] = useState([]);
  const { screenToFlowPosition } = useReactFlow();
  const canvasRef = useRef(null);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => curr === msg ? null : curr);
    }, 3000);
  };

  useEffect(() => {
    async function fetchCreds() {
      try {
        const u = localStorage.getItem("flowscrape_user");
        if (!u) return;
        const userObj = JSON.parse(u);
        const data = await credentialsService.getCredentials(userObj.username);
        setCredentials(data);
      } catch (err) {
        console.error("Error loading credentials inside visual canvas:", err);
      }
    }
    fetchCreds();
  }, []);
  const handleNodeDataChange = useCallback((nodeId, key, val) => {
    setNodes(
      (prevNodes) => prevNodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              [key]: val
            }
          };
        }
        return n;
      })
    );
  }, [setNodes]);
  const handleNodeDelete = useCallback((nodeId) => {
    if (nodeId === "node-launch") {
      triggerToast("Launch Browser is the root Entry Point and cannot be removed!");
      return;
    }
    setNodes((prevNodes) => prevNodes.filter((n) => n.id !== nodeId));
    setEdges((prevEdges) => prevEdges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    triggerToast("Node deleted.");
  }, [setNodes, setEdges]);
  useEffect(() => {
    setTrigger(workflow.trigger || "Manual");
    const initialNodes = (workflow.nodes || []).map((n) => ({
      id: n.id,
      type: "scraperNode",
      position: { x: n.x, y: n.y },
      data: {
        type: n.type,
        name: n.name,
        ...n.data,
        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    }));
    const initialEdges = (workflow.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 }
    }));
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [workflow.id, setNodes, setEdges, handleNodeDataChange, handleNodeDelete]);
  const addPaletteNode = (paletteItem) => {
    const newId = `node-${Date.now()}`;
    const newNode = {
      id: newId,
      type: "scraperNode",
      position: {
        x: 350 + Math.random() * 80,
        y: 180 + Math.random() * 80
      },
      data: {
        type: paletteItem.type,
        name: paletteItem.name,
        ...paletteItem.defaultData,
        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    };
    setNodes((prev) => [...prev, newNode]);
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge = {
        id: `e-${Date.now()}`,
        source: lastNode.id,
        target: newId,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 }
      };
      setEdges((prev) => [...prev, newEdge]);
    }
    triggerToast(`Added node: ${paletteItem.name}`);
  };
  const onDragStart = (event, item) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const dataStr = event.dataTransfer.getData("application/reactflow");
    if (!dataStr) return;
    try {
      const item = JSON.parse(dataStr);
      const position = screenToFlowPosition({
        x: event.clientX - 140,
        // Offset half width of card (280 / 2)
        y: event.clientY - 40
      });
      const newId = `node-${Date.now()}`;
      const newNode = {
        id: newId,
        type: "scraperNode",
        position,
        data: {
          type: item.type,
          name: item.name,
          ...item.defaultData,
          onChange: handleNodeDataChange,
          onDelete: handleNodeDelete
        }
      };
      setNodes((prev) => [...prev, newNode]);
      triggerToast(`Successfully placed ${item.name}!`);
    } catch (e) {
      console.error("React Flow Drop mapping failure:", e);
    }
  }, [screenToFlowPosition, handleNodeDataChange, handleNodeDelete, setNodes]);
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      id: `e-${Date.now()}`,
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(newEdge, eds));
    triggerToast("Socket connected successfully!");
  }, [setEdges]);
  const getMappedWorkflowPayload = () => {
    const mappedNodes = nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      name: n.data.name,
      x: n.position.x,
      y: n.position.y,
      data: {
        url: n.data.url,
        selector: n.data.selector,
        value: n.data.value,
        prompt: n.data.prompt,
        schema: n.data.schema,
        duration: n.data.duration,
        propertyName: n.data.propertyName,
        path: n.data.path,
        outputType: n.data.outputType
      }
    }));
    const mappedEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target
    }));
    return { mappedNodes, mappedEdges };
  };
  const handleSaveClick = (newTrigger = trigger) => {
    const { mappedNodes, mappedEdges } = getMappedWorkflowPayload();
    onSave(mappedNodes, mappedEdges, newTrigger);
    triggerToast("Workflow blueprint saved successfully!");
  };
  const handleExecuteClick = async () => {
    const { mappedNodes, mappedEdges } = getMappedWorkflowPayload();
    const savedWf = await onSave(mappedNodes, mappedEdges, trigger);
    onExecute(savedWf || workflow);
  };
  return <div className="flex-1 flex flex-col h-screen overflow-hidden bg-black text-zinc-100">
      {
    /* Top Header Bar */
  }
      <div className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-6 shrink-0 bg-zinc-950/40 backdrop-blur-xl select-none">
        
        {
    /* Left Back Button and workspace tags - conditionalized to replicate picture exactly */
  }
        {activeSubTab === "runs" ? <div className="flex items-center gap-4 text-left">
            <button
    onClick={onBack}
    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
  >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-sm font-bold text-white tracking-tight">Workflow run details</h1>
              <span className="text-[10px] text-zinc-500 font-mono block">Run ID: {runId || "cm2xptm430078glfdu50fkics"}</span>
            </div>
          </div> : <div className="flex items-center gap-4 text-left">
            <button
    onClick={onBack}
    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
  >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wider">Scraper Blueprint</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-tight">Active</span>
              </div>
              <h1 className="text-sm font-bold text-white tracking-tight">{workflow.name}</h1>
            </div>
          </div>}

        {
    /* Central switch view pills - renamed to Runs */
  }
        <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex items-center gap-1 shrink-0">
          <button
    onClick={() => onSubTabChange("editor")}
    className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === "editor" ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"}`}
  >
            Editor
          </button>
          <button
    onClick={() => onSubTabChange("runs")}
    className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === "runs" ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"}`}
  >
            Runs
          </button>
        </div>

        {
    /* Right action control pack */
  }
        {activeSubTab === "runs" ? <div className="w-[180px]" /> : <div className="flex items-center gap-3">
            <div className="flex flex-col items-start gap-0.5 justify-center bg-zinc-950/80 border border-zinc-800/80 rounded-lg px-2 py-1 h-9 select-none">
              <span className="text-[7px] font-black text-zinc-500 font-mono tracking-widest uppercase">AUTOMATION TIMER</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                <select
                  value={trigger}
                  onChange={(e) => {
                    const newTrigger = e.target.value;
                    setTrigger(newTrigger);
                    const { mappedNodes, mappedEdges } = getMappedWorkflowPayload();
                    onSave(mappedNodes, mappedEdges, newTrigger);
                    triggerToast(`Schedule updated to ${newTrigger}!`);
                  }}
                  className="bg-transparent text-[10px] font-bold font-mono text-zinc-300 hover:text-white uppercase focus:outline-none cursor-pointer border-none p-0 tracking-wide"
                >
                  <option value="Manual" className="bg-zinc-950 text-zinc-200">Manual (Off)</option>
                  <option value="15 sec" className="bg-zinc-950 text-zinc-200">Every 15 Sec</option>
                  <option value="30 sec" className="bg-zinc-950 text-zinc-200">Every 30 Sec</option>
                  <option value="5 min" className="bg-zinc-950 text-zinc-200">Every 5 Min</option>
                  <option value="30 min" className="bg-zinc-950 text-zinc-200">Every 30 Min</option>
                  <option value="1 hour" className="bg-zinc-950 text-zinc-200">Every 1 Hour</option>
                  <option value="24 hours" className="bg-zinc-950 text-zinc-200">Every 24 Hours</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExecuteClick}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all cursor-pointer h-9"
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Execute Run</span>
            </button>

            <button
              onClick={() => handleSaveClick()}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all cursor-pointer h-9"
            >
              <Save className="w-3.5 h-3.5 text-zinc-400" />
              <span>Save</span>
            </button>

            <button
              onClick={() => triggerToast("Published live to scraper pool")}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all cursor-pointer h-9"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          </div>}
      </div>

      {
    /* Main Flow Content Dashboard or running details logs */
  }
      {activeSubTab === "runs" ? <div className="flex-1 overflow-hidden relative flex bg-black">
          {children}
        </div> : <div className="flex-1 flex overflow-hidden relative bg-black">
          
          {
    /* Left panel palette list (Draggable node templates) */
  }
          <div className="w-72 border-r border-zinc-800/80 flex flex-col h-full bg-zinc-950 select-none overflow-y-auto shrink-0">
            <div className="p-4 border-b border-zinc-900 bg-zinc-900/10 text-left">
              <h2 className="text-[10px] font-bold text-zinc-400 tracking-wider font-mono uppercase justify-between flex items-center">
                <span>Interactive Nodes</span>
                <span className="text-[8px] bg-zinc-850 text-zinc-500 border border-zinc-800 px-1 rounded">DRAG OR CLICK</span>
              </h2>
              <p className="text-[10px] text-zinc-500 font-light mt-0.5">Drag any custom scraping module directly onto the canvas, or click to inject.</p>
            </div>

            <div className="p-4 space-y-6 text-left">
              {PALETTE_NODES.map((cat, idx) => <div key={idx} className="space-y-2.5">
                  <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                    {cat.category}
                  </h3>
                  <div className="space-y-1.5">
                    {cat.items.map((item, itemIdx) => {
    const Icon = item.icon;
    return <div
      key={itemIdx}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onClick={() => addPaletteNode(item)}
      className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-zinc-300 border border-zinc-900 hover:border-zinc-800 rounded-xl hover:bg-zinc-905 hover:text-white text-left transition-all shrink-0 cursor-grab active:cursor-grabbing bg-zinc-950 ${item.color} border-l-4`}
    >
                          <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="flex-1 truncate font-mono tracking-tight">{item.name}</span>
                          <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400/20" />
                            {item.cost}
                          </span>
                        </div>;
  })}
                  </div>
                </div>)}

              {/* Secure Credentials Injector Section */}
              {credentials && credentials.length > 0 && (
                <div className="space-y-2.5 pt-5 border-t border-zinc-900">
                  <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Inject Secure Key
                  </h3>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Click any saved alias below to copy its template tag, then paste it directly into any target input.
                  </p>
                  <div className="space-y-1.5">
                    {credentials.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const tag = `{{${c.name}}}`;
                          navigator.clipboard.writeText(tag);
                          triggerToast(`Copied "${tag}" reference tag!`);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 hover:bg-zinc-900 text-left transition-all rounded-xl cursor-pointer group"
                      >
                        <span className="text-[10px] font-sans font-medium text-zinc-400 truncate pr-2 group-hover:text-white">
                          {c.name}
                        </span>
                        <span className="text-[8px] font-bold font-mono text-amber-400/80 bg-amber-500/5 group-hover:bg-amber-500/10 border border-amber-500/10 px-1.5 py-0.5 rounded shrink-0 font-mono">
                          {c.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {
    /* Interactive Flow Canvas Area powered by React Flow */
  }
          <div
    ref={canvasRef}
    onDragOver={onDragOver}
    onDrop={onDrop}
    className="flex-1 h-full overflow-hidden relative bg-black select-none"
  >
            {
    /* Guide caption inside top banner */
  }
            <div className="absolute top-4 left-4 bg-zinc-950/80 border border-zinc-850/80 px-3 py-1.5 rounded-xl shadow-lg text-[9px] text-zinc-400 font-bold font-mono tracking-wide uppercase z-10 flex items-center gap-1.5 shrink-0 pointer-events-none backdrop-blur-md select-none">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span>DRAG ITEMS FROM THE SIDEBAR, OR DRAG PORT SPOTS ON CARDS TO DRAW FLOWS.</span>
            </div>

            {
    /* React Flow Component */
  }
            <ReactFlow
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    nodeTypes={nodeTypes}
    fitView
    colorMode="dark"
    maxZoom={1.5}
    minZoom={0.5}
    style={{ background: "#000" }}
  >
              {
    /* Dot Background theme */
  }
              <Background
    variant={BackgroundVariant.Dots}
    gap={24}
    size={1.5}
    className="opacity-60"
    color="#222"
  />
              
              {
    /* Overlay controls */
  }
              <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-400 rounded-xl" />
            </ReactFlow>
          </div>

          {
    /* Floated Toast alert aligned beautifully top-center */
  }
          {toastMessage && <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-zinc-900/95 text-zinc-200 text-xs px-4 py-2 rounded-xl border border-zinc-800 shadow-2xl backdrop-blur-md z-50 flex items-center gap-2 select-none font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold">{toastMessage}</span>
            </div>}

        </div>}
    </div>;
}
export default function WorkflowEditor(props) {
  return <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>;
}
