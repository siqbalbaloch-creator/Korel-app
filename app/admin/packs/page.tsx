import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

type AdminPackRow = {
  id: string;
  title: string;
  status: string;
  qualityScore: number | null;
  createdAt: Date;
  user: { email: string | null };
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default async function AdminPacksPage() {
  await requireAdmin();

  const packs = await prisma.authorityPack.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      qualityScore: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          All Packs
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {packs.length} pack{packs.length !== 1 ? "s" : ""} across all users
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {packs.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400">
            No packs yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Title
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Owner
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Quality
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {packs.map((pack: AdminPackRow) => (
                <tr key={pack.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-neutral-800 font-medium max-w-[280px] truncate">
                    {pack.title}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {pack.user.email ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pack.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {pack.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500 tabular-nums">
                    {pack.qualityScore !== null && pack.qualityScore !== undefined
                      ? `${Math.round(pack.qualityScore)}/100`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {formatDate(pack.createdAt)}
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
