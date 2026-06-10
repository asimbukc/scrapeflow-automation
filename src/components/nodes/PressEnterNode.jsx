import { CornerDownLeft } from "lucide-react";
import BaseNode from "./BaseNode";
export default function PressEnterNode({ id, data }) {
  return <BaseNode
    id={id}
    name={data.name || "PRESS ENTER"}
    credits={1}
    icon={CornerDownLeft}
    onDelete={() => data.onDelete(id)}
  >
      <div>
        <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
          Selector enter target
        </label>
        <input
    type="text"
    value={data.selector || ""}
    placeholder="eg: .btn-submit"
    onChange={(e) => data.onChange(id, "selector", e.target.value)}
    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700 font-mono"
  />
      </div>
    </BaseNode>;
}
