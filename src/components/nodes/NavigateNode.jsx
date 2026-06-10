import { Globe } from "lucide-react";
import BaseNode from "./BaseNode";
export default function NavigateNode({ id, data }) {
  return <BaseNode
    id={id}
    name={data.name}
    credits={2}
    icon={Globe}
    onDelete={() => data.onDelete(id)}
  >
      <div>
        <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
          Redirection Link URL
        </label>
        <input
    type="text"
    value={data.url || ""}
    placeholder="eg: https://news.ycombinator.com/news"
    onChange={(e) => data.onChange(id, "url", e.target.value)}
    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700 font-mono"
  />
      </div>
    </BaseNode>;
}
