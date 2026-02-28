import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { Radio } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import SidebarNavigation from "./SidebarNavigation";
import UserMenu from "./UserMenu";
import MobileNav from "./MobileNav";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const name = session.user.name;
  const email = session.user.email;
  const image = session.user.image;
  const initials = name
    ? name.trim().split(/\s+/).length >= 2
      ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/)[1][0]).toUpperCase()
      : name.trim().slice(0, 2).toUpperCase()
    : email
      ? email[0].toUpperCase()
      : "?";

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-[240px] bg-white border-r border-[#E2E8F0] flex-col flex-shrink-0">
        <div className="px-6 py-5">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
              }}
            >
              <Radio size={18} color="#ffffff" strokeWidth={2} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <span style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "0.5px", lineHeight: 1.15 }}>
                <span
                  style={{
                    background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  K
                </span>
                <span style={{ color: "#0F172A" }}>OREL</span>
              </span>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#6D5EF3", letterSpacing: "0.01em", lineHeight: 1.2 }}>
                Authority Engine
              </span>
            </div>
          </Link>
        </div>

        <SidebarNavigation />

        <div className="mt-auto px-4 py-5">
          <UserMenu
            name={name ?? null}
            email={email ?? null}
            image={image ?? null}
            initials={initials}
            isAdmin={session.user.role === "admin"}
          />
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header — hidden on desktop */}
        <header className="lg:hidden flex items-center justify-between px-4 bg-white border-b border-[#E2E8F0] flex-shrink-0 sticky top-0 z-40" style={{ height: "56px" }}>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" style={{ textDecoration: "none" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Radio size={16} color="#ffffff" strokeWidth={2} />
            </div>
            <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "0.5px" }}>
              <span
                style={{
                  background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                K
              </span>
              <span style={{ color: "#0F172A" }}>OREL</span>
            </span>
          </Link>

          {/* Avatar links to settings on mobile */}
          <Link href="/settings" style={{ flexShrink: 0 }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {initials}
              </div>
            )}
          </Link>
        </header>

        {/* Main content — bottom padding on mobile for the tab bar */}
        <main className="flex-1 flex pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileNav />
    </div>
  );
}
