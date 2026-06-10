import { FileText } from "lucide-react";
import BaseNode from "./BaseNode";
export default function GetHtmlNode({ id, data }) {
  return <BaseNode
    id={id}
    name={data.name}
    credits={2}
    icon={FileText}
    onDelete={() => data.onDelete(id)}
  >
      <p className="text-[10px] text-zinc-400 font-light bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/60 leading-relaxed">
        Captures complete structured HTML elements inside active web-page viewport, parsing as DOM response context.
      </p>
    </BaseNode>;
}
