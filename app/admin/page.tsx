import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import { getAdminAnalytics, type InputTypeBreakdownRow, type AngleBreakdownRow } from "@/lib/getAdminAnalytics";
import TrendChart from "@/components/admin/TrendChart";
import { INPUT_TYPE_LABELS, ANGLE_LABELS } from "@/ai/prompts";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">
        {label}
      </p>
      <p
        className={`text-3xl font-bold tracking-tight ${
          accent ? "text-[#4F46E5]" : "text-neutral-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

function InsightRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-neutral-600">
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#4F46E5] shrink-0" />
      {text}
    </li>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const {
    totalUsers,
    usersLast7Days,
    totalPacks,
    packsLast7Days,
    publishedCount,
    lowQualityCount,
    activeUsersLast7Days,
    openTickets,
    resolvedTickets,
    ticketsLast7Days,
    dailyUserSignups,
    dailyPackCreations,
    inputTypeBreakdown,
    angleBreakdown,
    profilesSetCount,
    profilePercentage,
    avgMessagingStrength,
    avgAuthorityConsistency,
  } = await getAdminAnalytics();

  // Deterministic insights
  const insights: string[] = [];
  if (usersLast7Days > 0) {
    insights.push(
      `${usersLast7Days} new user${usersLast7Days !== 1 ? "s" : ""} signed up in the last 7 days.`,
    );
  } else {
    insights.push("No new user signups in the last 7 days.");
  }
  if (packsLast7Days > 0) {
    insights.push(
      `${packsLast7Days} pack${packsLast7Days !== 1 ? "s" : ""} generated in the last 7 days by ${activeUsersLast7Days} active user${activeUsersLast7Days !== 1 ? "s" : ""}.`,
    );
  } else {
    insights.push("No content generation activity in the last 7 days.");
  }
  if (publishedCount > 0) {
    insights.push(
      `${publishedCount} pack${publishedCount !== 1 ? "s" : ""} published across all users.`,
    );
  }
  if (openTickets === 0) {
    insights.push("No open support tickets — inbox is clear.");
  } else {
    insights.push(
      `${openTickets} support ticket${openTickets !== 1 ? "s" : ""} currently open${resolvedTickets > 0 ? `, ${resolvedTickets} resolved all-time` : ""}.`,
    );
  }
  if (ticketsLast7Days > 0) {
    insights.push(
      `${ticketsLast7Days} new support ticket${ticketsLast7Days !== 1 ? "s" : ""} submitted in the last 7 days.`,
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Platform-wide metrics across all users.
        </p>
      </div>

      {/* Low quality alert */}
      {lowQualityCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">
              ⚠ {lowQualityCount} pack{lowQualityCount !== 1 ? "s" : ""} with
              low quality scores (&lt;60).
            </span>{" "}
            Review content health to help users improve.
          </p>
          <Link
            href="/admin/packs"
            className="shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
          >
            Review Packs
          </Link>
        </div>
      )}

      {/* All-time stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          All-time
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard label="Total Packs" value={totalPacks} />
          <StatCard label="Published" value={publishedCount} />
          <StatCard
            label="Avg Messaging"
            value={avgMessagingStrength > 0 ? `${avgMessagingStrength}` : "â€”"}
            sub="/100"
          />
          <StatCard
            label="Avg Consistency"
            value={avgAuthorityConsistency > 0 ? `${avgAuthorityConsistency}` : "â€”"}
            sub="/100"
          />
          <StatCard
            label="Low Quality"
            value={lowQualityCount}
            sub="score < 60"
            accent={lowQualityCount > 0}
          />
          <StatCard
            label="Open Tickets"
            value={openTickets}
            sub={`${resolvedTickets} resolved`}
            accent={openTickets > 0}
          />
          <StatCard
            label="Profiles Set"
            value={`${profilePercentage}%`}
            sub={`${profilesSetCount} of ${totalUsers} users`}
          />
        </div>
      </div>

      {/* 7-day stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Last 7 days
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="New Users"
            value={usersLast7Days}
            sub={`of ${totalUsers} total`}
          />
          <StatCard
            label="New Packs"
            value={packsLast7Days}
            sub={`of ${totalPacks} total`}
          />
          <StatCard
            label="Active Users"
            value={activeUsersLast7Days}
            sub="created at least 1 pack"
          />
          <StatCard
            label="New Tickets"
            value={ticketsLast7Days}
            sub={`${openTickets} open now`}
            accent={ticketsLast7Days > 0}
          />
        </div>
      </div>

      {/* Trend charts */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Trends (7 days)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TrendChart data={dailyUserSignups} label="User Signups" />
          <TrendChart
            data={dailyPackCreations}
            label="Pack Creations"
            color="#10B981"
          />
        </div>
      </div>

      {/* Input Type + Angle Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inputTypeBreakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Packs by Input Type
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium text-right">Packs</th>
                  <th className="pb-2 font-medium text-right">Avg Quality</th>
                </tr>
              </thead>
              <tbody>
                {inputTypeBreakdown.map((row: InputTypeBreakdownRow) => (
                  <tr key={row.type} className="border-b border-neutral-50 last:border-0">
                    <td className="py-2 text-neutral-700">
                      {INPUT_TYPE_LABELS[row.type as keyof typeof INPUT_TYPE_LABELS] ?? row.type}
                    </td>
                    <td className="py-2 text-right text-neutral-900 font-medium">{row.count}</td>
                    <td className="py-2 text-right text-neutral-500">
                      {row.avgQuality > 0 ? `${row.avgQuality}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {angleBreakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Packs by Angle
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                  <th className="pb-2 font-medium">Angle</th>
                  <th className="pb-2 font-medium text-right">Packs</th>
                  <th className="pb-2 font-medium text-right">Avg Quality</th>
                </tr>
              </thead>
              <tbody>
                {angleBreakdown.map((row: AngleBreakdownRow) => (
                  <tr key={row.angle} className="border-b border-neutral-50 last:border-0">
                    <td className="py-2 text-neutral-700">
                      {ANGLE_LABELS[row.angle as keyof typeof ANGLE_LABELS] ?? row.angle}
                    </td>
                    <td className="py-2 text-right text-neutral-900 font-medium">{row.count}</td>
                    <td className="py-2 text-right text-neutral-500">
                      {row.avgQuality > 0 ? `${row.avgQuality}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Activity Insights
        </p>
        <ul className="space-y-2">
          {insights.map((text) => (
            <InsightRow key={text} text={text} />
          ))}
        </ul>
      </div>
    </div>
  );
}
