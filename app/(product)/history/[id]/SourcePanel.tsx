import { ChevronDown, ExternalLink, Youtube } from "lucide-react";
import CopyButton from "./copy-button";

type SourcePanelProps = {
  sourceType: "youtube" | "transcript";
  youtubeHref: string;
  displayYoutubeUrl: string;
  originalInput: string;
};

export default function SourcePanel({
  sourceType,
  youtubeHref,
  displayYoutubeUrl,
  originalInput,
}: SourcePanelProps) {
  if (sourceType === "youtube") {
    return (
      <div className="space-y-2 text-sm text-neutral-600">
        <div className="flex items-center gap-2">
          <Youtube className="h-4 w-4 text-neutral-400" />
          {youtubeHref ? (
            <a
              href={youtubeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-neutral-900 hover:underline break-all"
            >
              {displayYoutubeUrl}
              <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
            </a>
          ) : (
            <span className="text-neutral-500">{displayYoutubeUrl}</span>
          )}
        </div>
        {youtubeHref && <CopyButton value={youtubeHref} />}
      </div>
    );
  }

  return (
    <details className="group rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <summary className="flex items-center justify-between text-sm font-medium text-neutral-900 cursor-pointer list-none">
        <span>Transcript</span>
        <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-3 max-h-[300px] overflow-y-auto text-sm text-neutral-600 whitespace-pre-wrap">
        {originalInput || "No transcript provided."}
      </div>
    </details>
  );
}
