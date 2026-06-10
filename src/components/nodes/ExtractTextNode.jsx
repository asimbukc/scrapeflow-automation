import { FileText } from "lucide-react";
import BaseNode from "./BaseNode";

export default function ExtractTextNode({ id, data }) {
  return (
    <BaseNode
      id={id}
      name={data.name}
      credits={2}
      icon={FileText}
      onDelete={() => data.onDelete(id)}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
            Target Element CSS selector
          </label>
          <input
            type="text"
            value={data.selector || ""}
            placeholder="eg: h1.post-title or a.title"
            onChange={(e) => data.onChange(id, "selector", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700 font-mono"
          />
          <p className="text-[9px] text-zinc-500 mt-1 font-mono leading-relaxed">
            Enter a CSS selector (e.g., <code className="text-zinc-400 font-bold">.title</code> or <code className="text-zinc-400 font-bold">article h1</code>) to manually query DOM element texts.
          </p>
        </div>
      </div>
    </BaseNode>
  );
}
