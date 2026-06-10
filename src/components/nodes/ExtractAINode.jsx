import { Sparkles } from "lucide-react";
import BaseNode from "./BaseNode";
export default function ExtractAINode({ id, data }) {
  return <BaseNode
    id={id}
    name={data.name}
    isAi
    credits={4}
    icon={Sparkles}
    onDelete={() => data.onDelete(id)}
  >
      <div className="space-y-2">
        <div>
          <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
            AI Prompt Instruction
          </label>
          <input
    type="text"
    value={data.prompt || ""}
    placeholder="eg: Extract title, author and link"
    onChange={(e) => data.onChange(id, "prompt", e.target.value)}
    className="w-full px-2 py-1 text-[10px] rounded-lg border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-purple-500/50 bg-zinc-900 text-white placeholder-zinc-700 font-mono"
  />
        </div>
        <div>
          <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
            Expected JSON Schema
          </label>
          <textarea
    value={data.schema || ""}
    rows={3}
    placeholder='e.g., {"posts": [{"title": "string"}]}'
    onChange={(e) => data.onChange(id, "schema", e.target.value)}
    className="w-full px-2 py-1 text-[9px] rounded-lg border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-purple-500/50 bg-zinc-900 text-zinc-300 font-mono resize-none leading-tight"
  />
        </div>
      </div>
    </BaseNode>;
}
