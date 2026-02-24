import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getWeaknessRadarForUser } from "@/lib/weaknessRadar";

export default async function RadarPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");

  const { radar, analyzed } = await getWeaknessRadarForUser(userId);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Weakness Radar</h1>
            <p className="text-sm text-neutral-500">
              Recurring structural patterns across your last {radar.windowSize} packs.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-[#4F46E5] hover:underline"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 space-y-4">
          {analyzed < 3 ? (
            <p className="text-sm text-neutral-500">
              Not enough data yet. Generate at least 3 packs to surface recurring patterns.
            </p>
          ) : radar.issues.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No recurring issues detected in the last {radar.windowSize} packs.
            </p>
          ) : (
            <ul className="space-y-4">
              {radar.issues.map((issue) => (
                <li key={issue.id} className="space-y-1 border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900">{issue.title}</p>
                    <span className="text-xs uppercase tracking-wide text-neutral-400">
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {issue.evidence.affectedPacks}/{analyzed} recent packs
                  </p>
                  {issue.evidence.examples?.length ? (
                    <p className="text-xs text-neutral-500">
                      Examples: {issue.evidence.examples.join(" · ")}
                    </p>
                  ) : null}
                  <p className="text-xs text-neutral-600">{issue.recommendation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
