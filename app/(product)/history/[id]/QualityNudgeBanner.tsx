"use client";

import { AlertTriangle } from "lucide-react";
import type { QualityBreakdown } from "@/lib/calculateQualityScore";
import { QUALITY_MAX_SCORES } from "@/lib/calculateQualityScore";

type Props = {
  qualityScore: number;
  breakdown: QualityBreakdown;
};

export default function QualityNudgeBanner({ qualityScore, breakdown }: Props) {
  const weakCount = (Object.keys(breakdown) as (keyof QualityBreakdown)[]).filter(
    (key) => breakdown[key] < QUALITY_MAX_SCORES[key] * 0.5,
  ).length;

  const shouldShow = qualityScore < 60 || weakCount >= 2;
  if (!shouldShow) return null;

  const handleFix = () => {
    document.getElementById("pack-health")?.scrollIntoView({ behavior: "smooth" });
  };

  const detail =
    weakCount >= 2
      ? `${weakCount} sections are below half strength.`
      : "Overall quality score is below 60.";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 mb-6">
      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800">This pack has room to improve</p>
        <p className="text-xs text-amber-700 mt-0.5">
          {detail} Use the Pack Health panel to fix individual sections.
        </p>
      </div>
      <button
        type="button"
        onClick={handleFix}
        className="shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 whitespace-nowrap"
      >
        Fix weak sections
      </button>
    </div>
  );
}
