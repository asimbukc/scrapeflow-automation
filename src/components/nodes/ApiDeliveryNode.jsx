import { Send } from "lucide-react";
import BaseNode from "./BaseNode";

export default function ApiDeliveryNode({ id, data }) {
  // Ensure default fallback options are safely set
  const method = data.method || "POST";
  const headers = data.headers || '{"Content-Type": "application/json"}';

  return (
    <BaseNode
      id={id}
      name={data.name || "API DELIVERY"}
      credits={1}
      icon={Send}
      onDelete={() => data.onDelete(id)}
    >
      <div className="space-y-3">
        {/* URL Input */}
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
            API Endpoint URL
          </label>
          <input
            type="text"
            value={data.url || ""}
            placeholder="eg: https://api.service.com/v1/deliver"
            onChange={(e) => data.onChange(id, "url", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700 font-mono"
          />
        </div>

        {/* Method Block & Settings */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
              HTTP Method
            </label>
            <select
              value={method}
              onChange={(e) => data.onChange(id, "method", e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none bg-zinc-900 text-white font-mono cursor-pointer"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
              Request Timeout
            </label>
            <select
              value={data.timeout || "30"}
              onChange={(e) => data.onChange(id, "timeout", e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-800 text-[11px] focus:outline-none bg-zinc-900 text-white font-mono cursor-pointer"
            >
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">60s</option>
            </select>
          </div>
        </div>

        {/* Dynamic Custom Headers configuration */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono font-sans">
              HTTP headers (JSON)
            </label>
          </div>
          <textarea
            value={headers}
            onChange={(e) => data.onChange(id, "headers", e.target.value)}
            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
            rows={2}
            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[10px] focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 text-white placeholder-zinc-700 font-mono resize-none leading-relaxed"
          />
        </div>
      </div>
    </BaseNode>
  );
}