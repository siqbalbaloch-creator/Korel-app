"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Radio } from "lucide-react";
import { logMarketingEvent } from "@/lib/marketingEvents";

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [imgError, setImgError] = useState(false);

  function handleSectionLink(sectionId: string) {
    if (pathname === "/") {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(`/?scroll=${sectionId}`);
    }
  }

  const isAuthed = status === "authenticated";
  const userImage = imgError ? null : session?.user?.image;
  const initials = isAuthed
    ? getInitials(session?.user?.name, session?.user?.email)
    : null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(226, 232, 240, 0.5)",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: "1320px", height: "68px" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center" style={{ gap: "10px", textDecoration: "none" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Radio size={18} color="#ffffff" strokeWidth={2} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <h1 style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "0.5px", lineHeight: 1.15, margin: 0 }}>
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
            </h1>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#6D5EF3", letterSpacing: "0.01em", lineHeight: 1.2 }}>
              Authority Engine
            </span>
          </div>
        </Link>

        {/* Nav links + actions */}
        <div className="flex items-center" style={{ gap: "24px" }}>
          <nav className="hidden md:flex items-center" style={{ gap: "32px" }}>
            <button
              onClick={() => handleSectionLink("how-it-works")}
              style={{
                color: "#64748B",
                fontSize: "15px",
                fontWeight: 500,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              How It Works
            </button>
            <button
              onClick={() => handleSectionLink("pricing")}
              style={{
                color: "#64748B",
                fontSize: "15px",
                fontWeight: 500,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              Pricing
            </button>
            <a
              href="/docs"
              style={{
                color: "#64748B",
                fontSize: "15px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              Docs
            </a>
            <Link
              href="/case-studies"
              style={{
                color: "#64748B",
                fontSize: "15px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              Case Studies
            </Link>

            {!isAuthed && (
              <a
                href="/signin"
                style={{
                  color: "#64748B",
                  fontSize: "15px",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              >
                Sign In
              </a>
            )}
          </nav>

          {isAuthed ? (
            /* Authenticated: Log out + Contact Support + avatar */
            <div className="flex items-center" style={{ gap: "16px" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  color: "#64748B",
                  fontSize: "15px",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              >
                Log out
              </button>

              <button
                onClick={() => router.push("/support")}
                style={{
                  color: "#0F172A",
                  fontSize: "14px",
                  fontWeight: 600,
                  background: "none",
                  border: "1.5px solid #CBD5E1",
                  cursor: "pointer",
                  padding: "0 16px",
                  height: "38px",
                  borderRadius: "10px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6D5EF3";
                  e.currentTarget.style.color = "#6D5EF3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.color = "#0F172A";
                }}
              >
                Contact Support
              </button>

              <button
                onClick={() => router.push("/new")}
                title="Go to dashboard"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  overflow: "hidden",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: userImage
                    ? "transparent"
                    : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                }}
              >
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    style={{
                      width: "38px",
                      height: "38px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>
                    {initials}
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* Unauthenticated: Start Free */
            <button
              onClick={() => {
                void logMarketingEvent("CTA_CLICK", { cta: "navbar_start_free" });
                router.push("/signup");
              }}
              style={{
                background: "#3B82F6",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "14px",
                height: "38px",
                padding: "0 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.12)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2563EB";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#3B82F6";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.12)";
              }}
            >
              Start Free
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
