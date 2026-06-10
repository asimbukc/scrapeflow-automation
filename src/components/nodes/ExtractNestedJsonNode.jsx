import { Code2 } from "lucide-react";
import BaseNode from "./BaseNode";

export default function ExtractNestedJsonNode({ id, data }) {
  return (
    <BaseNode
      id={id}
      name={data.name}
      credits={1}
      icon={Code2}
      onDelete={() => data.onDelete(id)}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
            JSON Path (e.g. data.0.companyName)
          </label>
          <input
            type="text"
            value={data.path || ""}
            placeholder="eg: data.*.designation"
            onChange={(e) => data.onChange(id, "path", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700 font-mono"
          />
          <p className="text-[9px] text-zinc-500 mt-1 font-mono leading-relaxed">
            Use dot-notation. For lists, use <span className="text-amber-500 font-bold">*</span> wildcard (e.g. <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-300 border border-zinc-800">data.*.companyName</code>).
          </p>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
            Output Format
          </label>
          <select
            value={data.outputType || "json"}
            onChange={(e) => data.onChange(id, "outputType", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-zinc-300 font-mono"
          >
            <option value="json">Pretty JSON</option>
            <option value="compact">Compact / Single-line</option>
            <option value="plain">Raw Text (No quotes if string)</option>
          </select>
        </div>
      </div>
    </BaseNode>
  );
}
