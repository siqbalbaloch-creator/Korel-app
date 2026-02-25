import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { WaitlistStatusSelect } from "./WaitlistStatusSelect";
import { WaitlistQualitySelect } from "./WaitlistQualitySelect";

export const dynamic = "force-dynamic";

const WAITLIST_PLANS = ["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
type WaitlistPlan = (typeof WAITLIST_PLANS)[number];

const WAITLIST_STATUSES = ["ACTIVE", "CONTACTED", "CONVERTED", "REMOVED"] as const;
type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

const WAITLIST_SOURCES = ["PRICING", "NAVBAR", "UPGRADE", "UNKNOWN"] as const;
type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

const WAITLIST_QUALITIES = ["UNREVIEWED", "LOW", "MEDIUM", "HIGH"] as const;
type WaitlistInterestQuality = (typeof WAITLIST_QUALITIES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanFilter = WaitlistPlan | "ALL";
type StatusFilter = WaitlistStatus | "ALL";

type WaitlistEntryRow = {
  id: string;
  email: string;
  fullName: string | null;
  plan: WaitlistPlan;
  status: WaitlistStatus;
  interestQuality: WaitlistInterestQuality;
  lastSubmittedAt: Date;
  submitCount: number;
};

type WaitlistPlanCountRow = {
  plan: WaitlistPlan;
  _count?: { _all?: number };
};

type WaitlistSourceCountRow = {
  source: WaitlistSource;
  _count?: { _all?: number };
};

const isWaitlistPlan = (value: string): value is WaitlistPlan =>
  WAITLIST_PLANS.includes(value as WaitlistPlan);

const isWaitlistStatus = (value: string): value is WaitlistStatus =>
  WAITLIST_STATUSES.includes(value as WaitlistStatus);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfDayUTC(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<WaitlistPlan, string> = {
  STARTER: "bg-neutral-100 text-neutral-600",
  PROFESSIONAL: "bg-[#EEF2FF] text-[#4F46E5]",
  ENTERPRISE: "bg-violet-100 text-violet-700",
};

const PLAN_LABEL: Record<WaitlistPlan, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Pro",
  ENTERPRISE: "Enterprise",
};

const STATUS_BADGE: Record<WaitlistStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  CONVERTED: "bg-emerald-100 text-emerald-700",
  REMOVED: "bg-neutral-100 text-neutral-400",
};

// ─── Filter config ────────────────────────────────────────────────────────────

const PLAN_FILTERS: { label: string; value: PlanFilter }[] = [
  { label: "All Plans", value: "ALL" },
  { label: "Starter", value: "STARTER" },
  { label: "Professional", value: "PROFESSIONAL" },
  { label: "Enterprise", value: "ENTERPRISE" },
];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Removed", value: "REMOVED" },
];

const PAGE_SIZE = 30;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const planParam = sp.plan as PlanFilter | undefined;
  const statusParam = sp.status as StatusFilter | undefined;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const activePlan: PlanFilter =
    planParam && planParam !== "ALL" && isWaitlistPlan(planParam)
      ? planParam
      : "ALL";

  const activeStatus: StatusFilter =
    statusParam && statusParam !== "ALL" && isWaitlistStatus(statusParam)
      ? statusParam
      : "ALL";

  const where = {
    ...(activePlan !== "ALL" ? { plan: activePlan } : {}),
    ...(activeStatus !== "ALL" ? { status: activeStatus } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q } },
            { fullName: { contains: q } },
          ],
        }
      : {}),
  };

  const sevenDaysAgo = startOfDayUTC(7);
  const fourteenDaysAgo = startOfDayUTC(14);
  const thirtyDaysAgo = startOfDayUTC(30);

  // Parallel fetches
  const [entriesRaw, total, totalActive, byPlanRaw, last7Days, bySourceRaw, activeLast14d, activeOlderThan30d] =
    await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        orderBy: { lastSubmittedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.waitlistEntry.count({ where }),
      prisma.waitlistEntry.count({ where: { status: "ACTIVE" } }),
      prisma.waitlistEntry.groupBy({
        by: ["plan"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),
      prisma.waitlistEntry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.waitlistEntry.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.waitlistEntry.count({
        where: { status: "ACTIVE", createdAt: { gte: fourteenDaysAgo } },
      }),
      prisma.waitlistEntry.count({
        where: { status: "ACTIVE", createdAt: { lt: thirtyDaysAgo } },
      }),
    ]);
  const entries: WaitlistEntryRow[] = entriesRaw;
  const byPlanRows: WaitlistPlanCountRow[] = byPlanRaw;
  const bySourceRows: WaitlistSourceCountRow[] = bySourceRaw;

  // Build plan map
  const byPlan: Record<WaitlistPlan, number> = {
    STARTER: 0,
    PROFESSIONAL: 0,
    ENTERPRISE: 0,
  };
  for (const row of byPlanRows) {
    byPlan[row.plan] = row._count?._all ?? 0;
  }

  // Sort sources by count descending (in JS since groupBy orderBy on _all is unsupported in SQLite adapter)
  bySourceRows.sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0));

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build URL helper preserving other params
  function buildUrl(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    if (activePlan !== "ALL") params.set("plan", activePlan);
    if (activeStatus !== "ALL") params.set("status", activeStatus);
    if (q) params.set("q", q);
    if (page > 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    const str = params.toString();
    return `/admin/waitlist${str ? "?" + str : ""}`;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-neutral-900 tracking-tight mb-1">
          Waitlist
        </h1>
        <p className="text-sm text-neutral-500">
          Interest signups from the marketing site.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Active" value={totalActive} accent />
        <StatCard label="Starter" value={byPlan.STARTER} />
        <StatCard label="Professional" value={byPlan.PROFESSIONAL} />
        <StatCard label="Enterprise" value={byPlan.ENTERPRISE} />
        <StatCard label="Last 7 Days" value={last7Days} />
      </div>

      {/* Fresh Demand Insight */}
      {totalActive > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 rounded-xl border border-neutral-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Fresh (≤14 days)</p>
            <p className="text-2xl font-bold text-[#4F46E5] tabular-nums">
              {activeLast14d}
              <span className="text-sm font-normal text-neutral-400 ml-1">
                ({totalActive > 0 ? ((activeLast14d / totalActive) * 100).toFixed(1) : "0.0"}% of active)
              </span>
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-neutral-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Stale (&gt;30 days)</p>
            <p className="text-2xl font-bold text-neutral-500 tabular-nums">
              {activeOlderThan30d}
              <span className="text-sm font-normal text-neutral-400 ml-1">
                ({totalActive > 0 ? ((activeOlderThan30d / totalActive) * 100).toFixed(1) : "0.0"}% of active)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Sources row */}
      {bySourceRows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {bySourceRows.map((row) => (
            <span
              key={row.source}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-neutral-100 text-neutral-600"
            >
              <span className="text-neutral-400">{sourceLabel(row.source)}</span>
              <span className="font-semibold text-neutral-700">{row._count?._all ?? 0}</span>
            </span>
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Plan filters */}
        <div className="flex flex-wrap gap-1.5">
          {PLAN_FILTERS.map(({ label, value }) => {
            const isActive = activePlan === value;
            return (
              <Link
                key={value}
                href={buildUrl({ plan: value === "ALL" ? undefined : value, page: undefined })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#4F46E5] text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(({ label, value }) => {
            const isActive = activeStatus === value;
            return (
              <Link
                key={value}
                href={buildUrl({ status: value === "ALL" ? undefined : value, page: undefined })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-800 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Search */}
        <form method="GET" action="/admin/waitlist" className="ml-auto flex-shrink-0">
          {activePlan !== "ALL" && <input type="hidden" name="plan" value={activePlan} />}
          {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
          <div className="relative">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search email or name…"
              className="w-56 rounded-lg border border-neutral-200 bg-white pl-3 pr-8 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label="Search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Result count */}
      <p className="text-xs text-neutral-400 mb-3">
        {total === 0 ? "No entries found." : `${total} entr${total === 1 ? "y" : "ies"}`}
        {q && ` matching "${q}"`}
      </p>

      {/* Table */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 py-16 text-center text-sm text-neutral-400">
          No waitlist entries yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Plan</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Quality</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Last Submit</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-neutral-900 font-medium max-w-[200px] truncate">
                    {entry.email}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 max-w-[140px] truncate">
                    {entry.fullName ?? <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_BADGE[entry.plan]}`}
                    >
                      {PLAN_LABEL[entry.plan]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <WaitlistStatusSelect
                      entryId={entry.id}
                      currentStatus={entry.status}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <WaitlistQualitySelect
                      entryId={entry.id}
                      currentQuality={entry.interestQuality as WaitlistInterestQuality}
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-400 whitespace-nowrap text-xs">
                    {fmtDate(entry.lastSubmittedAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500 font-medium">
                    {entry.submitCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${accent ? "text-[#4F46E5]" : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}

function sourceLabel(source: WaitlistSource): string {
  const MAP: Record<WaitlistSource, string> = {
    PRICING: "Pricing page",
    NAVBAR: "Navbar",
    UPGRADE: "Upgrade modal",
    UNKNOWN: "Unknown",
  };
  return MAP[source];
}
