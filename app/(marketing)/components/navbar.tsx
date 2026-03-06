"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Radio, Menu, X, Plus, User, Settings, LogOut } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    if (avatarDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarDropdownOpen]);

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
          {/* Hamburger button — mobile only */}
          <button
            className="flex lg:hidden items-center justify-center"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#0F172A",
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center" style={{ gap: "32px" }}>
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
            <a
              href="/blog"
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
              Insights
            </a>

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
            /* Authenticated: Create Content + Avatar dropdown */
            <div className="hidden lg:flex items-center" style={{ gap: "12px" }}>
              <button
                onClick={() => router.push("/new")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(79, 70, 229, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.25)";
                }}
              >
                <Plus size={15} strokeWidth={2.5} />
                Create Content
              </button>

              {/* Avatar with dropdown */}
              <div ref={avatarRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setAvatarDropdownOpen((o) => !o)}
                  title="Account menu"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    border: avatarDropdownOpen ? "2px solid #4F46E5" : "2px solid transparent",
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
                    transition: "border-color 0.15s ease",
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

                {/* Dropdown menu */}
                {avatarDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "180px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
                      padding: "6px",
                      zIndex: 100,
                    }}
                  >
                    {session?.user?.name && (
                      <div
                        style={{
                          padding: "8px 12px 10px",
                          borderBottom: "1px solid #F1F5F9",
                          marginBottom: "4px",
                        }}
                      >
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {session.user.name}
                        </p>
                        {session?.user?.email && (
                          <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    )}
                    {[
                      { icon: User, label: "Profile", href: "/settings" },
                      { icon: Settings, label: "Settings", href: "/settings" },
                    ].map(({ icon: Icon, label, href }) => (
                      <button
                        key={label}
                        onClick={() => { router.push(href); setAvatarDropdownOpen(false); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "9px 12px",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#334155",
                          background: "none",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <Icon size={15} color="#64748B" strokeWidth={1.75} />
                        {label}
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid #F1F5F9", margin: "4px 0" }} />
                    <button
                      onClick={() => { void signOut({ callbackUrl: "/" }); setAvatarDropdownOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "9px 12px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#DC2626",
                        background: "none",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <LogOut size={15} color="#DC2626" strokeWidth={1.75} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Unauthenticated: Start Free */
            <button
              className="hidden lg:block"
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

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div
          className="lg:hidden"
          style={{
            borderTop: "1px solid rgba(226, 232, 240, 0.6)",
            backgroundColor: "rgba(255, 255, 255, 0.97)",
            padding: "16px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {[
            { label: "How It Works", action: () => { handleSectionLink("how-it-works"); setMenuOpen(false); } },
            { label: "Pricing", action: () => { handleSectionLink("pricing"); setMenuOpen(false); } },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                padding: "12px 0",
                fontSize: "15px",
                fontWeight: 500,
                color: "#0F172A",
                cursor: "pointer",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              {label}
            </button>
          ))}
          {[
            { label: "Case Studies", href: "/case-studies" },
            { label: "Insights", href: "/blog" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: "15px",
                fontWeight: 500,
                color: "#0F172A",
                textDecoration: "none",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              {label}
            </a>
          ))}
          {isAuthed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px" }}>
              <button
                onClick={() => { router.push("/new"); setMenuOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "15px",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Content
              </button>
              <button
                onClick={() => { router.push("/settings"); setMenuOpen(false); }}
                style={{
                  background: "none",
                  border: "none",
                  padding: "10px 0",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#64748B",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                Settings
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  background: "none",
                  border: "none",
                  padding: "10px 0",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#64748B",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                void logMarketingEvent("CTA_CLICK", { cta: "mobile_nav_start_free" });
                router.push("/signup");
                setMenuOpen(false);
              }}
              style={{
                marginTop: "12px",
                background: "#3B82F6",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "15px",
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Start Free
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
