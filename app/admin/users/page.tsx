import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { PLAN_CONFIGS, type PlanTier } from "@/lib/plans";
import { getCurrentUsagePeriod } from "@/lib/usagePeriod";
import MakeAdminButton from "./MakeAdminButton";

type AdminUserRow = {
  id: string;
  email: string | null;
  role: string;
  createdAt: Date;
  _count: { packs: number };
  subscription: { plan: string | null; status: string | null } | null;
  usage: { packsUsed: number }[];
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default async function AdminUsersPage() {
  await requireAdmin();

  const { month, year } = getCurrentUsagePeriod();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { packs: true } },
      subscription: { select: { plan: true, status: true } },
      usage: {
        where: { month, year },
        select: { packsUsed: true },
      },
    },
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Users
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {users.length} user{users.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400">
            No users yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Plan
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  This Month
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Total Packs
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Joined
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user: AdminUserRow) => {
                const isActive =
                  user.subscription?.status === "active" ||
                  user.subscription?.status === "trialing";
                const planTier: PlanTier = isActive
                  ? ((user.subscription?.plan as PlanTier | undefined) ?? "FREE")
                  : "FREE";
                const planConfig = PLAN_CONFIGS[planTier];
                const monthlyUsed = user.usage[0]?.packsUsed ?? 0;
                const monthlyLimit = planConfig.monthlyPackLimit;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-neutral-800 font-medium">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-[#EEF2FF] text-[#4F46E5]"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          planTier !== "FREE"
                            ? "bg-[#EEF2FF] text-[#4F46E5]"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {planConfig.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-500 tabular-nums text-xs">
                      {monthlyUsed}
                      {monthlyLimit !== Infinity && (
                        <span className="text-neutral-300">
                          {" "}/ {monthlyLimit}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-neutral-500 tabular-nums">
                      {user._count.packs}
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {user.role !== "admin" && (
                        <MakeAdminButton userId={user.id} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
