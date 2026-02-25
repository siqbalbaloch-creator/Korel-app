import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { TicketActions } from "./TicketActions";

type Status = "open" | "in_progress" | "resolved";
type StatusCount = { status: string; _count: number };
type SupportTicketRow = {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
  user: { email: string | null };
};

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_STYLES: Record<Status, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const FILTERS = [
  { label: "All", value: undefined },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
] as const;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const { status: filterStatus } = await searchParams;
  const validFilter =
    filterStatus === "open" ||
    filterStatus === "in_progress" ||
    filterStatus === "resolved"
      ? filterStatus
      : undefined;

  const [tickets, counts] = await Promise.all([
    prisma.supportTicket.findMany({
      where: validFilter ? { status: validFilter } : undefined,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c: StatusCount) => [c.status, c._count]),
  );
  const totalCount = counts.reduce(
    (sum: number, c: StatusCount) => sum + c._count,
    0,
  );

  const displayedCount = validFilter
    ? (countByStatus[validFilter] ?? 0)
    : totalCount;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Support Tickets
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {displayedCount} ticket{displayedCount !== 1 ? "s" : ""}
          {validFilter ? ` · ${STATUS_LABELS[validFilter]}` : " · All"}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const count = f.value ? (countByStatus[f.value] ?? 0) : totalCount;
          const isActive = validFilter === f.value;
          const href = f.value
            ? `/admin/support?status=${f.value}`
            : "/admin/support";

          return (
            <Link
              key={f.label}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#4F46E5] text-white"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {tickets.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400">
            No tickets
            {validFilter
              ? ` with status "${STATUS_LABELS[validFilter]}"`
              : ""}
            .
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Subject
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Created
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tickets.map((ticket: SupportTicketRow) => {
                const st = ticket.status as Status;
                return (
                  <tr
                    key={ticket.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-neutral-800 font-medium max-w-[280px]">
                      <span className="line-clamp-1">{ticket.subject}</span>
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                        {ticket.message}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {ticket.user.email ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[st] ?? "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {STATUS_LABELS[st] ?? ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <TicketActions
                        ticketId={ticket.id}
                        currentStatus={st}
                      />
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
