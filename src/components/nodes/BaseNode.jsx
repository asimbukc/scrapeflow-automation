import { Handle, Position } from "@xyflow/react";
import { Trash2, Zap } from "lucide-react";
export default function BaseNode({
  id,
  name,
  isLaunch = false,
  isAi = false,
  credits,
  icon: IconComponent,
  onDelete,
  children
}) {
  return <div className="w-[280px] bg-zinc-950 rounded-2xl shadow-xl border border-zinc-800/90 text-left overflow-hidden hover:border-zinc-700 transition-all">
      {
    /* Target incoming handle (Left) */
  }
      {!isLaunch && <Handle
    type="target"
    position={Position.Left}
    className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-zinc-950 hover:!bg-emerald-500 hover:!scale-125 !transition-all"
    style={{ left: "-6px" }}
  />}

      {
    /* Source outgoing handle (Right) */
  }
      <Handle
    type="source"
    position={Position.Right}
    className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-zinc-950 hover:!bg-emerald-500 hover:!scale-125 !transition-all"
    style={{ right: "-6px" }}
  />

      {
    /* Node Header */
  }
      <div className={`p-3 flex items-center justify-between border-b border-zinc-900 ${isLaunch ? "bg-red-500/10" : isAi ? "bg-purple-500/10" : "bg-zinc-900/40"}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isLaunch ? "text-red-400" : isAi ? "text-purple-400" : "text-emerald-400"}`} />
          <span className="text-[10px] font-bold font-mono tracking-wider truncate text-zinc-200">
            {name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[8px] font-bold font-mono text-emerald-400 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400/20" />
            {credits}
          </span>
          {!isLaunch && onDelete && <button
    onClick={(e) => {
      e.stopPropagation();
      onDelete();
    }}
    className="text-zinc-500 hover:text-red-400 hover:bg-zinc-900 p-1 rounded-md transition-all cursor-pointer nodrag"
  >
              <Trash2 className="w-3" />
            </button>}
        </div>
      </div>

      {
    /* Form Fields Container */
  }
      <div className="p-3.5 space-y-3 bg-zinc-950 text-xs nodrag nowheel">
        {children}

        <div className="pt-2 border-t border-zinc-900/60 text-[9px] text-zinc-500 flex items-center justify-between font-mono">
          <span>INPUT: WEBPAGE DATA</span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider text-right">Socket live</span>
        </div>
      </div>
    </div>;
}
