import { Play, Sliders, Clock, Flame, AlertCircle, Trash2, Calendar } from "lucide-react";
export default function WorkflowsList({
  workflows,
  onCreateClick,
  onEditClick,
  onRunClick,
  onDeleteClick,
  activeCredits
}) {
  const formatTimeDiff = (isoStr) => {
    if (!isoStr) return "Never run";
    const date = new Date(isoStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };
  return <div className="flex-1 overflow-y-auto bg-black p-8 pb-20 animate-fade-in text-zinc-100">
      {
    /* Top Breadcrumb & User indicator row */
  }
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-6 select-none font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-300">WORKFLOWS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800/80 text-emerald-400 font-mono text-[9px] flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            DAEMON STATUS: ACTIVE
          </span>
        </div>
      </div>

      {
    /* Main Row Title and button */
  }
      <div className="flex items-center justify-between mb-8 select-none">
        <div>
          <h1 className="text-3xl font-bold font-sans text-white tracking-tight">Workflows</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage your custom scraping recipes and pipelines</p>
        </div>
        <button
    onClick={onCreateClick}
    className="text-xs font-bold bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-md transition-colors shadow-lg shadow-white/5 cursor-pointer"
  >
          Create workflow
        </button>
      </div>

      {
    /* Grid or Cards List */
  }
      <div className="space-y-4">
        {workflows.length === 0 ? <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-zinc-750 text-zinc-700 mb-4" />
            <h3 className="font-semibold text-zinc-200 text-lg">No Workflows Available</h3>
            <p className="text-zinc-455 text-zinc-500 text-xs max-w-sm mt-1 mb-6 font-light">
              Establish a structured web scraper automation recipe by creating a visual node layout today.
            </p>
            <button
    onClick={onCreateClick}
    className="px-5 py-2.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer"
  >
              Get Started with First Workflow
            </button>
          </div> : workflows.map((wf) => <div
    key={wf.id}
    className="bg-zinc-950/60 rounded-2xl border border-zinc-850/80 p-5 flex flex-col justify-between hover:border-zinc-800 transition-all duration-200 group relative"
  >
              {
    /* Card Meta details split */
  }
              <div className="flex items-start justify-between gap-4">
                {
    /* Left side info block */
  }
                <div className="flex items-start gap-4 flex-1">
                  {
    /* Play circle emblem */
  }
                  <div
    onClick={() => onEditClick(wf)}
    className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center cursor-pointer hover:bg-emerald-500 hover:text-black transition-all duration-300 shrink-0 select-none shadow-sm"
  >
                    <Play className="w-4 h-4 fill-current" />
                  </div>

                  {
    /* Text details */
  }
                  <div className="space-y-1.5 flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h3
    onClick={() => onEditClick(wf)}
    className="font-bold text-white text-base leading-tight hover:text-emerald-400 cursor-pointer truncate"
  >
                        {wf.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-mono font-bold tracking-wider">
                        {wf.nodes.length} {wf.nodes.length === 1 ? "NODE" : "NODES"}
                      </span>
                    </div>

                    {
    /* Scraper Path Cost Row (Arrow -> lightning price) */
  }
                    <div className="flex flex-wrap items-center gap-y-2 text-xs text-zinc-400 gap-x-2 select-none">
                      <span className="text-zinc-700 font-mono">↳</span>
                      <div className="flex items-center gap-1.5 bg-zinc-900/60 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-800">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="font-semibold text-[10px] font-mono uppercase">{wf.trigger || "Manual"}</span>
                      </div>
                      <span className="text-zinc-800">→</span>
                      <div className="flex items-center gap-1.5 bg-zinc-900/60 text-emerald-400 px-2 py-0.5 rounded-md border border-zinc-800">
                        <Flame className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                        <span className="font-bold font-mono text-[10px]">{wf.credits} CREDITS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {
    /* Right side Actions (Run, Edit, Dropdown) */
  }
                <div className="flex items-center gap-2 shrink-0 select-none">
                  <button
    onClick={() => onRunClick(wf)}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
  >
                    <Play className="w-3 h-3 text-emerald-450 text-emerald-450 fill-emerald-400 shrink-0" />
                    <span>Run</span>
                  </button>

                  <button
    onClick={() => onEditClick(wf)}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
  >
                    <Sliders className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>Edit</span>
                  </button>

                  {
    /* Direct Delete Button (Trash Icon) */
  }
                  <button
    onClick={(e) => {
      e.stopPropagation();
      onDeleteClick(wf.id);
    }}
    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
    title="Delete workflow"
  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {
    /* Card Footer status details */
  }
              <div className="mt-4 pt-3 border-t border-zinc-900/80 flex items-center justify-between text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wide">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex animate-ping" />
                  <span className="text-zinc-650">LAST STATUS:</span>
                  <span className="text-emerald-450 text-emerald-400 font-extrabold">{wf.lastRunStatus || "IDLE"}</span>
                  <span className="text-zinc-600 font-semibold lowercase tracking-normal">{formatTimeDiff(wf.lastRunTime)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-600">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>NEXT EXECUTION: PENDING</span>
                </div>
              </div>
            </div>)}
      </div>
    </div>;
}
