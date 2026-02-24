import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/packs", label: "Packs" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/pricing-intent", label: "Pricing Intent" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-neutral-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Brand mark */}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#4F46E5] text-white text-[10px] font-bold tracking-tight select-none">
                A
              </span>
              <span className="text-sm font-semibold text-neutral-900 tracking-tight">
                Admin Panel
              </span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-neutral-200" />

            <nav className="flex items-center gap-0.5">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-[#4F46E5] transition-colors"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to App
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
