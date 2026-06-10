import { Clock } from "lucide-react";
import BaseNode from "./BaseNode";
export default function WaitNode({ id, data }) {
  return <BaseNode
    id={id}
    name={data.name}
    credits={1}
    icon={Clock}
    onDelete={() => data.onDelete(id)}
  >
      <div>
        <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
          Timeout Duration (seconds)
        </label>
        <input
    type="number"
    value={data.duration || 3}
    placeholder="3"
    onChange={(e) => data.onChange(id, "duration", Number(e.target.value))}
    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white font-mono"
  />
      </div>
    </BaseNode>;
}
