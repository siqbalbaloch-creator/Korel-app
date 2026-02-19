import PostCopyButton from "./post-copy-button";
import { LinkedInIcon, XIcon } from "./platform-icons";

type PostCardProps = {
  platform: "linkedin" | "x";
  versionLabel?: string;
  content: string;
  lines?: string[];
};

const platformLabel = (platform: PostCardProps["platform"]) =>
  platform === "linkedin" ? "LinkedIn" : "X Threads";

const renderThreadLine = (line: string, index: number) => {
  const trimmed = line.trim();
  const expectedPrefix = `${index + 1}/`;
  if (trimmed.startsWith(expectedPrefix)) {
    return trimmed.slice(expectedPrefix.length).trimStart();
  }
  if (/^\d+[.)]\s+/.test(trimmed)) {
    return trimmed.replace(/^\d+[.)]\s+/, "");
  }
  return trimmed;
};

export default function PostCard({
  platform,
  versionLabel,
  content,
  lines,
}: PostCardProps) {
  const label = platformLabel(platform);
  const normalizedContent = content.replace(/\\n/g, "\n");
  const normalizedLines = lines?.map((line, index) =>
    renderThreadLine(line.replace(/\\n/g, "\n"), index),
  );
  const isThread = platform === "x" && lines?.length;

  return (
    <div className="relative rounded-[14px] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 shadow-sm">
          {platform === "linkedin" ? (
            <LinkedInIcon className="h-3.5 w-3.5 text-[#0A66C2]" />
          ) : (
            <XIcon className="h-3.5 w-3.5 text-black" />
          )}
          {label}
        </span>
        {versionLabel ? (
          <span className="text-xs font-medium text-neutral-500">
            {versionLabel}
          </span>
        ) : null}
      </div>
      {platform === "linkedin" ? (
        <div className="absolute right-4 top-4">
          <PostCopyButton value={normalizedContent} />
        </div>
      ) : null}
      {isThread ? (
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-2 text-sm text-neutral-700 leading-relaxed">
          {normalizedLines?.map((line, index) => (
            <div
              key={`${label}-${index}`}
              className="group/line grid grid-cols-[auto_1fr] items-start gap-3"
            >
              <span className="mt-0.5 text-xs font-medium text-neutral-400">
                {index + 1}/
              </span>
              <div className="min-w-0">
                <span className="whitespace-pre-line">{line}</span>
                <PostCopyButton
                  value={`${index + 1}/ ${line}`}
                  className="ml-2 inline-flex h-7 w-7 align-middle opacity-0 pointer-events-none transition-opacity group-hover/line:opacity-100 group-focus-within/line:opacity-100 group-hover/line:pointer-events-auto group-focus-within/line:pointer-events-auto"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 whitespace-pre-line text-sm text-neutral-700 leading-relaxed">
          {normalizedContent}
        </div>
      )}
    </div>
  );
}
