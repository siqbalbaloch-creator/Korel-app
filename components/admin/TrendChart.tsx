"use client";

import type { DailyBucket } from "@/lib/getAdminAnalytics";

type TrendChartProps = {
  data: DailyBucket[];
  label: string;
  color?: string;
};

const CHART_HEIGHT = 80;
const BAR_GAP = 6;

/** Format "YYYY-MM-DD" → "Mon", "Tue", etc. */
function shortDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

export default function TrendChart({
  data,
  label,
  color = "#4F46E5",
}: TrendChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const n = data.length;
  // SVG viewBox width — we'll make it responsive via preserveAspectRatio
  const W = 420;
  const barW = (W - BAR_GAP * (n + 1)) / n;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <span className="text-sm font-bold text-neutral-900 tabular-nums">
          {total} total
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${CHART_HEIGHT + 20}`}
        className="w-full"
        aria-label={label}
      >
        {data.map((bucket, i) => {
          const barH = Math.max(
            (bucket.count / maxCount) * CHART_HEIGHT,
            bucket.count > 0 ? 4 : 2,
          );
          const x = BAR_GAP + i * (barW + BAR_GAP);
          const y = CHART_HEIGHT - barH;
          const labelX = x + barW / 2;

          return (
            <g key={bucket.date}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill={bucket.count > 0 ? color : "#E5E7EB"}
                opacity={bucket.count > 0 ? 1 : 0.6}
              />
              {/* Count above bar */}
              {bucket.count > 0 && (
                <text
                  x={labelX}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#6B7280"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {bucket.count}
                </text>
              )}
              {/* Day label below */}
              <text
                x={labelX}
                y={CHART_HEIGHT + 14}
                textAnchor="middle"
                fontSize={9}
                fill="#9CA3AF"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {shortDay(bucket.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
