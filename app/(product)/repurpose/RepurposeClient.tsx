"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  CheckSquare,
  Square,
  Copy,
  Check,
  ChevronRight,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";

type RepurposeType = "linkedin_short" | "twitter_hooks" | "blog" | "newsletter";

type PackRow = {
  id: string;
  title: string;
  createdAt: string;
  qualityScore: number | null;
  status: string;
  angle: string;
  inputType: string;
  repurposeCount: number;
};

type ResultRow = {
  packId: string;
  packTitle: string;
  content: string;
  error: string | null;
};

type Props = {
  packs: PackRow[];
  canRepurpose: boolean;
  upgradeHref: string;
};

const FORMAT_OPTIONS: {
  type: RepurposeType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: "linkedin_short",
    label: "LinkedIn Post",
    description: "Single polished LinkedIn post ready to publish",
    icon: "in",
  },
  {
    type: "twitter_hooks",
    label: "Twitter / X Hooks",
    description: "Hook list for X threads and conversation starters",
    icon: "x",
  },
  {
    type: "blog",
    label: "Blog Draft",
    description: "Long-form Markdown blog post",
    icon: "b",
  },
  {
    type: "newsletter",
    label: "Newsletter Blurb",
    description: "Ready-to-send newsletter section",
    icon: "nl",
  },
];

const ANGLE_LABELS: Record<string, string> = {
  THOUGHT_LEADERSHIP: "Thought Leadership",
  TACTICAL: "Tactical",
  CONTRARIAN: "Contrarian",
  STORY_DRIVEN: "Story-Driven",
  VISIONARY: "Visionary",
  EXECUTION_FOCUSED: "Execution",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return (content as string[]).join("\n\n");
  return JSON.stringify(content, null, 2);
}

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };
  const base =
    size === "xs"
      ? "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
      : "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium";
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${base} border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function RepurposeClient({ packs, canRepurpose, upgradeHref }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<RepurposeType | null>(null);
  const [step, setStep] = useState<"select" | "generating" | "results">("select");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [progress, setProgress] = useState(0);

  const togglePack = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (selectedIds.size === packs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(packs.map((p) => p.id)));
    }
  };

  const startGeneration = async () => {
    if (!format || selectedIds.size === 0) return;
    const ordered = packs.filter((p) => selectedIds.has(p.id));
    setStep("generating");
    setProgress(0);
    setResults([]);

    const accumulated: ResultRow[] = [];

    for (let i = 0; i < ordered.length; i++) {
      const pack = ordered[i];
      try {
        const res = await fetch(`/api/packs/${pack.id}/repurpose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: format }),
        });
        const data = (await res.json()) as {
          content?: unknown;
          error?: string;
          message?: string;
          code?: string;
        };
        if (!res.ok) {
          const msg =
            data.code === "PLAN_LIMIT_NOT_ALLOWED"
              ? (data.message ?? "Plan limit reached")
              : (data.error ?? "Generation failed");
          accumulated.push({ packId: pack.id, packTitle: pack.title, content: "", error: msg });
        } else {
          accumulated.push({
            packId: pack.id,
            packTitle: pack.title,
            content: contentToString(data.content),
            error: null,
          });
        }
      } catch {
        accumulated.push({
          packId: pack.id,
          packTitle: pack.title,
          content: "",
          error: "Network error",
        });
      }
      setProgress(i + 1);
    }

    setResults(accumulated);
    setStep("results");
  };

  const reset = () => {
    setStep("select");
    setResults([]);
    setProgress(0);
    setSelectedIds(new Set());
    setFormat(null);
  };

  const allContent = results
    .filter((r) => r.content)
    .map((r) => `## ${r.packTitle}\n\n${r.content}`)
    .join("\n\n---\n\n");

  const successCount = results.filter((r) => !r.error).length;
  const failCount = results.filter((r) => r.error).length;
  const selectedCount = selectedIds.size;
  const selectedPacks = packs.filter((p) => selectedIds.has(p.id));

  // ── Results view ──────────────────────────────────────────────────────────
  if (step === "results") {
    return (
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Start over
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <p className="text-sm text-neutral-700">
              <span className="font-semibold text-green-700">{successCount}</span>{" "}
              generated
              {failCount > 0 && (
                <>
                  {", "}
                  <span className="font-semibold text-red-600">{failCount}</span> failed
                </>
              )}
            </p>
          </div>
          {allContent && (
            <CopyButton text={allContent} />
          )}
        </div>

        {/* Result cards */}
        <div className="space-y-4">
          {results.map((r) => (
            <div
              key={r.packId}
              className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-2 min-w-0">
                  {r.error ? (
                    <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-neutral-900 truncate">{r.packTitle}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.content && <CopyButton text={r.content} size="xs" />}
                  <Link
                    href={`/history/${r.packId}`}
                    className="text-xs text-[#4F46E5] hover:underline"
                  >
                    Open pack
                  </Link>
                </div>
              </div>
              <div className="px-5 py-4">
                {r.error ? (
                  <p className="text-sm text-red-500">{r.error}</p>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-neutral-700 leading-relaxed font-sans">
                    {r.content}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Generating view ───────────────────────────────────────────────────────
  if (step === "generating") {
    const total = selectedPacks.length;
    const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-900">
                Generating{" "}
                {FORMAT_OPTIONS.find((f) => f.type === format)?.label ?? format}…
              </span>
              <span className="text-neutral-500">
                {progress} / {total}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-[#4F46E5] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {selectedPacks.map((p, i) => {
              const done = i < progress;
              const active = i === progress;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    done
                      ? "bg-green-50 text-green-800"
                      : active
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "text-neutral-400"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  ) : active ? (
                    <Layers className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                  ) : (
                    <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-neutral-200" />
                  )}
                  <span className="truncate">{p.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Select view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Format picker */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">1. Choose output format</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setFormat(opt.type)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                format === opt.type
                  ? "border-[#4F46E5] bg-[#EEF2FF]"
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center justify-center rounded text-xs font-bold px-1.5 py-0.5 ${
                    format === opt.type
                      ? "bg-[#4F46E5] text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {opt.icon.toUpperCase()}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    format === opt.type ? "text-[#4F46E5]" : "text-neutral-900"
                  }`}
                >
                  {opt.label}
                </span>
                {format === opt.type && (
                  <Check className="h-3.5 w-3.5 text-[#4F46E5] ml-auto" />
                )}
              </div>
              <p className="text-xs text-neutral-500">{opt.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Pack list */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            2. Select packs{" "}
            {selectedCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-[#4F46E5] px-2 py-0.5 text-xs font-semibold text-white">
                {selectedCount}
              </span>
            )}
          </h2>
          {packs.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-[#4F46E5] hover:underline"
            >
              {selectedIds.size === packs.length ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>

        {packs.length === 0 ? (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="text-sm text-neutral-500">No packs yet.</p>
            <Link
              href="/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate your first pack
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 max-h-[420px] overflow-y-auto">
            {packs.map((pack) => {
              const selected = selectedIds.has(pack.id);
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => togglePack(pack.id)}
                  className={`w-full text-left flex items-center gap-4 px-6 py-3.5 transition-colors ${
                    selected ? "bg-[#EEF2FF]" : "hover:bg-neutral-50"
                  }`}
                >
                  <span className="shrink-0 text-neutral-400">
                    {selected ? (
                      <CheckSquare className="h-4 w-4 text-[#4F46E5]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        selected ? "text-[#4F46E5]" : "text-neutral-900"
                      }`}
                    >
                      {pack.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {formatDate(pack.createdAt)}
                      {pack.angle && pack.angle !== "THOUGHT_LEADERSHIP" && (
                        <> &middot; {ANGLE_LABELS[pack.angle] ?? pack.angle}</>
                      )}
                      {pack.repurposeCount > 0 && (
                        <>
                          {" "}
                          &middot;{" "}
                          <span className="text-neutral-400">
                            {pack.repurposeCount} repurpose{pack.repurposeCount !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {pack.qualityScore !== null && (
                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums ${
                        pack.qualityScore >= 70
                          ? "text-green-600"
                          : pack.qualityScore >= 45
                          ? "text-yellow-600"
                          : "text-neutral-400"
                      }`}
                    >
                      {Math.round(pack.qualityScore)}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {selectedCount === 0
            ? "Select at least one pack to continue."
            : !format
            ? "Choose an output format above."
            : `Ready to generate ${selectedCount} ${FORMAT_OPTIONS.find((f) => f.type === format)?.label ?? format} post${selectedCount !== 1 ? "s" : ""}.`}
        </p>

        {!canRepurpose ? (
          <Link
            href={upgradeHref}
            className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Upgrade to repurpose
          </Link>
        ) : (
          <button
            type="button"
            disabled={selectedCount === 0 || !format}
            onClick={startGeneration}
            className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Layers className="h-4 w-4" />
            Generate {selectedCount > 0 ? selectedCount : ""}{" "}
            {selectedCount === 1 ? "asset" : "assets"}
          </button>
        )}
      </div>
    </div>
  );
}
