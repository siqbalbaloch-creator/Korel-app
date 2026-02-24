"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { QualityBreakdown } from "@/lib/calculateQualityScore";
import { QUALITY_MAX_SCORES } from "@/lib/calculateQualityScore";
import PlanLimitNotice from "@/components/PlanLimitNotice";

const SECTION_LABELS: Record<keyof QualityBreakdown, string> = {
  coreThesis: "Core Thesis",
  hooks: "Hooks",
  posts: "Platform Assets",
  insights: "Insights",
  summary: "Summary",
};

type RegenerateSection = "hooks" | "xthread";

const REGENERATE_MAP: Partial<Record<keyof QualityBreakdown, RegenerateSection>> = {
  hooks: "hooks",
  posts: "xthread",
};

const SUGGESTIONS: Record<keyof QualityBreakdown, string> = {
  coreThesis:
    "Strengthen your core thesis with more supporting themes and a clear target persona.",
  hooks: "Your hooks could be strengthened to increase engagement.",
  posts: "Add more platform-ready assets to maximize distribution.",
  insights: "Expand deeper insights to increase authority positioning.",
  summary: "Add a sharper executive summary to clarify your core thesis.",
};

const REGENERATE_REASONS: Partial<Record<keyof QualityBreakdown, string>> = {
  hooks: "Improving hook strength",
  posts: "Sharpening asset quality",
};

function getScoreColor(score: number, max: number): string {
  if (score >= max) return "text-green-600";
  if (score === 0) return "text-red-500";
  return "text-yellow-600";
}

function getBarColor(score: number, max: number): string {
  if (score >= max) return "bg-green-500";
  if (score === 0) return "bg-red-400";
  return "bg-yellow-400";
}

function getTotalColor(total: number): string {
  if (total >= 80) return "text-green-600";
  if (total >= 50) return "text-yellow-600";
  return "text-red-500";
}

type PackHealthPanelProps = {
  packId: string;
  initialBreakdown: QualityBreakdown;
  regenLimitReached?: boolean;
  regenNotice?: string;
  upgradeHref?: string;
};

type RegenerateResponse = {
  qualityScore?: number;
  qualityBreakdown?: QualityBreakdown;
};

const SECTION_ORDER: (keyof QualityBreakdown)[] = [
  "coreThesis",
  "hooks",
  "posts",
  "insights",
  "summary",
];

export default function PackHealthPanel({
  packId,
  initialBreakdown,
  regenLimitReached = false,
  regenNotice,
  upgradeHref,
}: PackHealthPanelProps) {
  const [breakdown, setBreakdown] = useState<QualityBreakdown>(initialBreakdown);
  const [loading, setLoading] = useState<RegenerateSection | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [limitReached, setLimitReached] = useState(regenLimitReached);

  useEffect(() => {
    setLimitReached(regenLimitReached);
  }, [regenLimitReached]);

  const totalScore = SECTION_ORDER.reduce(
    (acc, key) => acc + Math.min(breakdown[key], QUALITY_MAX_SCORES[key]),
    0,
  );

  const handleRegenerate = async (key: keyof QualityBreakdown) => {
    const section = REGENERATE_MAP[key];
    if (!section) return;
    setLoading(section);
    setMessage(null);
    try {
      const res = await fetch(`/api/packs/${packId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      const data = (await res.json()) as RegenerateResponse & {
        code?: string;
        message?: string;
      };
      if (data.code === "PLAN_LIMIT_REGEN_EXCEEDED") {
        setLimitReached(true);
        setMessage({ text: data.message ?? "Regeneration limit reached.", ok: false });
        return;
      }
      if (!res.ok) throw new Error("failed");
      if (data.qualityBreakdown) {
        setBreakdown(data.qualityBreakdown);
        setMessage({ text: "Section improved!", ok: true });
      } else {
        setMessage({ text: "Done â€” refresh to see the latest updates.", ok: true });
      }
    } catch {
      setMessage({ text: "Regeneration failed. Try again.", ok: false });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const weakSections = SECTION_ORDER.filter(
    (key) => breakdown[key] < QUALITY_MAX_SCORES[key],
  );

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Pack Health</h2>
        <span className={`text-sm font-bold ${getTotalColor(totalScore)}`}>
          {totalScore}/100
        </span>
      </div>

      {limitReached && (
        <PlanLimitNotice
          message={
            regenNotice ??
            "Regeneration limit reached. Upgrade to increase capacity."
          }
          upgradeHref={upgradeHref}
        />
      )}

      {/* Section scores */}
      <div className="space-y-3">
        {SECTION_ORDER.map((key) => {
          const score = breakdown[key];
          const max = QUALITY_MAX_SCORES[key];
          const pct = max > 0 ? Math.round((score / max) * 100) : 0;
          const canRegenerate = key in REGENERATE_MAP;
          const sectionKey = REGENERATE_MAP[key];
          const isLoading = loading !== null && loading === sectionKey;
          const isDisabled = limitReached || loading !== null;

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600">{SECTION_LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold tabular-nums ${getScoreColor(score, max)}`}>
                    {score}/{max}
                  </span>
                  {canRegenerate && score < max && (
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => void handleRegenerate(key)}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw
                        className={`h-2.5 w-2.5 ${isLoading ? "animate-spin" : ""}`}
                      />
                      {isLoading
                        ? (REGENERATE_REASONS[key] ?? "Improvingâ€¦")
                        : "Fix"}
                    </button>
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-100">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(score, max)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Improvement suggestions */}
      {weakSections.length > 0 && (
        <div className="rounded-lg bg-[#FAFAFA] border border-neutral-100 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Suggestions
          </p>
          <ul className="space-y-1.5">
            {weakSections.map((key) => (
              <li key={key} className="text-xs text-neutral-600 flex gap-1.5">
                <span className="text-neutral-400 mt-px shrink-0">â€¢</span>
                <span>{SUGGESTIONS[key]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback after regeneration */}
      {message && (
        <p
          className={`text-xs ${
            message.ok ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

