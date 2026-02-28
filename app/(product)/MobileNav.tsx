"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Folder, LayoutDashboard, LifeBuoy, Settings, Sparkles } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new",       label: "New Pack",   icon: Sparkles },
  { href: "/packs",     label: "All Packs",  icon: Folder },
  { href: "/billing",   label: "Billing",    icon: CreditCard },
  { href: "/support",   label: "Support",    icon: LifeBuoy },
  { href: "/settings",  label: "Settings",   icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        if (item.href === "/new") {
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(`/new?t=${Date.now()}`)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-w-0"
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}
              />
              <span
                className={`text-[9px] font-medium w-full text-center leading-tight ${
                  isActive ? "text-[#4F46E5]" : "text-[#94A3B8]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-w-0"
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}
            />
            <span
              className={`text-[9px] font-medium w-full text-center leading-tight ${
                isActive ? "text-[#4F46E5]" : "text-[#94A3B8]"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
