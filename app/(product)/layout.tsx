import Link from "next/link";
import { redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import SidebarNavigation from "./SidebarNavigation";
import UserMenu from "./UserMenu";

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
      <aside className="w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col">
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

      <main className="flex-1 flex">{children}</main>
    </div>
  );
}
