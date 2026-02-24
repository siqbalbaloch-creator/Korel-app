"use client";

type InsightGuardWarningProps = {
  showLink?: boolean;
};

export default function InsightGuardWarning({
  showLink = true,
}: InsightGuardWarningProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-3">
      <span>
        Regeneration blocked — new claims were not supported by extracted insights.
      </span>
      {showLink ? (
        <a
          href="#pack-health"
          className="shrink-0 text-[11px] font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          Review Insight Breakdown
        </a>
      ) : null}
    </div>
  );
}
