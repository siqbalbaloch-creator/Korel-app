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

export default function SidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="px-4 py-2 space-y-1 text-sm">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const className = `flex items-center gap-2.5 rounded-md px-3 py-2.5 border text-sm w-full text-left ${
          isActive
            ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
            : "text-[#0F172A] border-transparent hover:bg-[#F1F5F9]"
        }`;

        // "New Pack" always navigates with a fresh timestamp so the page
        // resets its state even when already on /new.
        if (item.href === "/new") {
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(`/new?t=${Date.now()}`)}
              aria-current={isActive ? "page" : undefined}
              className={className}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#4F46E5]" : "text-[#64748B]"}`} />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={className}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-[#4F46E5]" : "text-[#64748B]"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
