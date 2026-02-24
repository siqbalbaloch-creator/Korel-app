import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Mail, BookOpen, MessageSquare, Radio } from "lucide-react";
import SidebarNavigation from "@/app/(product)/SidebarNavigation";
import { prisma } from "@/lib/prisma";
import { SupportForm } from "./SupportForm";

export const metadata = { title: "Contact Support — Korel" };

const quickHelp = [
  { icon: Mail,          label: "Email Support",  sub: "support@korel.app",     badge: null          },
  { icon: BookOpen,      label: "Documentation",  sub: "Browse help articles",  badge: "Coming soon" },
  { icon: MessageSquare, label: "Live Chat",       sub: "Available 9am–5pm EST", badge: "Coming soon" },
];

const commonTopics = [
  "Getting started with Korel",
  "Pack generation issues",
  "Billing & subscription",
  "Account management",
  "Feature requests",
];

type TicketStatus = "open" | "in_progress" | "resolved";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function SupportPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/support");
  }

  const name  = session.user.name;
  const email = session.user.email;
  const image = session.user.image;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const initials = name
    ? name.trim().split(/\s+/).length >= 2
      ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/)[1][0]).toUpperCase()
      : name.trim().slice(0, 2).toUpperCase()
    : email
      ? email[0].toUpperCase()
      : "?";

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">

      {/* ── Sidebar (identical to product layout) ── */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col">
        <div className="px-6 py-5">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%)" }}
            >
              <Radio size={18} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.5px", lineHeight: 1.15 }}>
                <span style={{ background: "linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>K</span>
                <span style={{ color: "#0F172A" }}>OREL</span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#6D5EF3", letterSpacing: "0.01em", lineHeight: 1.2 }}>
                Authority Engine
              </span>
            </div>
          </Link>
        </div>

        <SidebarNavigation />

        <div className="mt-auto px-6 py-6">
          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%)" }}>
                {initials}
              </div>
            )}
            <div className="truncate">{name ?? email ?? "Free Plan"}</div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto px-10 py-8">

        {/* Back */}
        <Link href="/new" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-6">
          <ArrowLeft size={14} strokeWidth={2} />
          Back
        </Link>

        {/* Heading */}
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight leading-tight">
          Contact Support
        </h1>
        <p className="text-sm text-[#6B7280] mt-1 mb-8">
          We typically respond within 24 hours.
        </p>

        {/* Two-column body */}
        <div className="flex gap-10 items-start">

          {/* LEFT — Quick Help + Common Topics */}
          <div className="flex-shrink-0 space-y-7" style={{ width: 264 }}>

            <div>
              <p className="text-[13px] font-medium text-[#6B7280] mb-3">Quick Help</p>
              <div className="space-y-2">
                {quickHelp.map(({ icon: Icon, label, sub, badge }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] px-4 py-3.5">
                    <div className="flex items-center justify-center flex-shrink-0 rounded-lg"
                      style={{ width: 34, height: 34, background: "rgba(79,70,229,0.08)" }}>
                      <Icon size={15} color="#4F46E5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111827]">{label}</span>
                        {badge && (
                          <span className="text-[10px] font-medium text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] rounded px-1.5 py-0.5 leading-none whitespace-nowrap">
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[13px] font-medium text-[#6B7280] mb-3">Common Topics</p>
              <ul className="space-y-2.5">
                {commonTopics.map((topic) => (
                  <li key={topic} className="text-sm text-[#4F46E5] hover:underline cursor-pointer">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* RIGHT — Form + Response Times */}
          <div className="flex-1 min-w-0 space-y-4">
            <SupportForm userEmail={email ?? ""} />

            <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#111827] mb-3">Response Times</p>
              <ul className="space-y-2">
                {[
                  { label: "Critical issues",   time: "Within 4 hours"  },
                  { label: "General inquiries", time: "Within 24 hours" },
                  { label: "Feature requests",  time: "Within 48 hours" },
                ].map(({ label, time }) => (
                  <li key={label} className="text-sm text-[#6B7280]">
                    • {label}: <span className="text-[#4F46E5] font-medium">{time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* ── Your Tickets ── */}
        {tickets.length > 0 && (
          <div className="mt-10">
            <p className="text-base font-semibold text-[#111827] mb-4">Your Tickets</p>
            <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {tickets.map((ticket) => {
                    const st = ticket.status as TicketStatus;
                    return (
                      <tr key={ticket.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-5 py-3 text-[#111827] font-medium max-w-[360px]">
                          <span className="line-clamp-1">{ticket.subject}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[st] ?? "bg-neutral-100 text-neutral-500"}`}>
                            {STATUS_LABELS[st] ?? ticket.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#6B7280] whitespace-nowrap">
                          {formatDate(ticket.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
