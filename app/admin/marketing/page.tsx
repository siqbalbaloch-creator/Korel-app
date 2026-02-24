import { requireAdmin } from "@/lib/requireAdmin";
import { getMarketingAnalytics, type UtmRow } from "@/lib/getMarketingAnalytics";

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // 1 decimal
}

function RateCard({
  label,
  rate7d,
  rate30d,
}: {
  label: string;
  rate7d: number;
  rate30d: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">{label}</p>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {rate7d.toFixed(1)}%
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">last 7 days</p>
        </div>
        <div className="pb-1">
          <p className="text-xl font-semibold text-neutral-500 tabular-nums">{rate30d.toFixed(1)}%</p>
          <p className="text-xs text-neutral-400 mt-0.5">last 30 days</p>
        </div>
      </div>
    </div>
  );
}

function CountCard({
  label,
  value7d,
  value30d,
  accent,
}: {
  label: string;
  value7d: number;
  value30d: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">{label}</p>
      <div className="flex items-end gap-4">
        <div>
          <p
            className={`text-3xl font-bold tracking-tight tabular-nums ${
              accent ? "text-[#4F46E5]" : "text-neutral-900"
            }`}
          >
            {value7d}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">last 7 days</p>
        </div>
        <div className="pb-1">
          <p className="text-xl font-semibold text-neutral-500 tabular-nums">{value30d}</p>
          <p className="text-xs text-neutral-400 mt-0.5">last 30 days</p>
        </div>
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  count,
  pctOfLanding,
}: {
  label: string;
  count: number;
  pctOfLanding: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-neutral-700 font-medium">{label}</span>
        <div className="flex items-center gap-3 tabular-nums">
          <span className="text-xs text-neutral-400">{pctOfLanding.toFixed(1)}%</span>
          <span className="text-sm text-neutral-900 font-semibold">{count}</span>
        </div>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4F46E5] rounded-full"
          style={{ width: `${Math.min(pctOfLanding, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default async function AdminMarketingPage() {
  await requireAdmin();

  const {
    pageViews7d,
    pageViews30d,
    landingViews30d,
    ctaClicks7d,
    ctaClicks30d,
    intentOpens7d,
    intentOpens30d,
    intentSubmits7d,
    intentSubmits30d,
    topUtm,
  } = await getMarketingAnalytics();

  // Conversion rates
  const ctaClickRate7d = pct(ctaClicks7d, pageViews7d);
  const ctaClickRate30d = pct(ctaClicks30d, pageViews30d);
  const intentOpenRate30d = pct(intentOpens30d, landingViews30d);
  const intentToSubmitRate30d = pct(intentSubmits30d, intentOpens30d);
  const visitorToSubmitRate30d = pct(intentSubmits30d, landingViews30d);

  // Threshold signal
  const hasData = landingViews30d > 0;
  const belowThreshold = hasData && visitorToSubmitRate30d < 1;
  const aboveThreshold = hasData && visitorToSubmitRate30d >= 3;

  const funnelRows = [
    { label: "Landing page views (/)", count: landingViews30d, pctOfLanding: 100 },
    { label: "Pricing intent opens", count: intentOpens30d, pctOfLanding: intentOpenRate30d },
    { label: "Waitlist submissions", count: intentSubmits30d, pctOfLanding: visitorToSubmitRate30d },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Marketing Analytics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          First-party event data from marketing pages.
        </p>
      </div>

      {/* Validation threshold banner */}
      {belowThreshold && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Conversion below validation threshold.</span>{" "}
            Visitor → submit rate is{" "}
            <span className="font-semibold tabular-nums">{visitorToSubmitRate30d.toFixed(1)}%</span> over the last 30 days (threshold: 1%).
          </p>
        </div>
      )}

      {aboveThreshold && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
          <p className="text-sm text-emerald-800">
            <span className="font-semibold">Early validation signal detected.</span>{" "}
            Visitor → submit rate is{" "}
            <span className="font-semibold tabular-nums">{visitorToSubmitRate30d.toFixed(1)}%</span> over the last 30 days.
          </p>
        </div>
      )}

      {/* Event counts */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Event counts
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CountCard label="Page Views" value7d={pageViews7d} value30d={pageViews30d} />
          <CountCard label="CTA Clicks" value7d={ctaClicks7d} value30d={ctaClicks30d} accent={ctaClicks30d > 0} />
          <CountCard label="Intent Opens" value7d={intentOpens7d} value30d={intentOpens30d} />
          <CountCard label="Waitlist Submits" value7d={intentSubmits7d} value30d={intentSubmits30d} accent={intentSubmits30d > 0} />
        </div>
      </div>

      {/* Conversion rates */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Conversion rates
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <RateCard
            label="CTA Click Rate"
            rate7d={ctaClickRate7d}
            rate30d={ctaClickRate30d}
          />
          <RateCard
            label="Landing → Intent Open"
            rate7d={pct(intentOpens7d, pageViews7d)}
            rate30d={intentOpenRate30d}
          />
          <RateCard
            label="Intent Open → Submit"
            rate7d={pct(intentSubmits7d, intentOpens7d)}
            rate30d={intentToSubmitRate30d}
          />
          <RateCard
            label="Visitor → Submit"
            rate7d={pct(intentSubmits7d, pageViews7d)}
            rate30d={visitorToSubmitRate30d}
          />
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          Conversion Funnel (last 30 days)
        </p>
        {landingViews30d === 0 ? (
          <p className="text-sm text-neutral-400">
            No data yet. Events will appear once visitors reach the marketing site.
          </p>
        ) : (
          <div className="space-y-5">
            {funnelRows.map((row) => (
              <FunnelRow key={row.label} {...row} />
            ))}
          </div>
        )}
      </div>

      {/* UTM table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Top UTM Sources (last 30 days)
        </p>
        {topUtm.length === 0 ? (
          <p className="text-sm text-neutral-400">No UTM-tagged traffic recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Campaign</th>
                <th className="pb-2 font-medium text-right">Events</th>
              </tr>
            </thead>
            <tbody>
              {topUtm.map((row: UtmRow, i) => (
                <tr key={i} className="border-b border-neutral-50 last:border-0">
                  <td className="py-2 text-neutral-700">{row.source ?? "—"}</td>
                  <td className="py-2 text-neutral-500">{row.campaign ?? "—"}</td>
                  <td className="py-2 text-right text-neutral-900 font-medium tabular-nums">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
