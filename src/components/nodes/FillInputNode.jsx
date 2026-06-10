import { FileText } from "lucide-react";
import BaseNode from "./BaseNode";
export default function FillInputNode({ id, data }) {
  return <BaseNode
    id={id}
    name={data.name}
    credits={1}
    icon={FileText}
    onDelete={() => data.onDelete(id)}
  >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
            Selector
          </label>
          <input
    type="text"
    value={data.selector || ""}
    placeholder="eg: #input-box"
    onChange={(e) => data.onChange(id, "selector", e.target.value)}
    className="w-full px-2 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700 font-mono"
  />
        </div>
        <div>
          <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
            Value String
          </label>
          <input
    type="text"
    value={data.value || ""}
    placeholder="eg: technology"
    onChange={(e) => data.onChange(id, "value", e.target.value)}
    className="w-full px-2 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700"
  />
        </div>
      </div>
    </BaseNode>;
}
