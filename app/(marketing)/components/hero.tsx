"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

function WidgetPreview() {
  const [bar1, setBar1] = useState(0);
  const [bar2, setBar2] = useState(0);
  const [card1, setCard1] = useState(false);
  const [card2, setCard2] = useState(false);
  const [card3, setCard3] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setCard1(true), 150);
    const t2 = setTimeout(() => setCard2(true), 400);
    const t3 = setTimeout(() => setBar1(100), 550);
    const t4 = setTimeout(() => setBar2(87), 900);
    const t5 = setTimeout(() => setCard3(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  const cardStyle = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(10px)",
    transition: "opacity 0.45s ease, transform 0.45s ease",
  });

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        padding: "20px",
        width: "100%",
      }}
    >
      {/* Header row with Live badge */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#1E293B",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "5px 10px",
            borderRadius: "20px",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
          Live Processing
        </div>
      </div>

      {/* Card 1 — Source connected */}
      <div style={{ marginBottom: "10px", ...cardStyle(card1) }}>
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "rgba(109,94,243,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D5EF3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94A3B8" }}>
                Source Connected
              </span>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              podcast.example.com/feed/rss
            </p>
            <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>Last sync: 2 minutes ago</p>
          </div>
        </div>
      </div>

      {/* Card 2 — Processing (dark) */}
      <div style={{ marginBottom: "10px", ...cardStyle(card2) }}>
        <div style={{ background: "#0F172A", borderRadius: "12px", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6D5EF3" }} />
            <span style={{ color: "#F1F5F9", fontSize: "13px", fontWeight: 600 }}>Processing Episode #247</span>
          </div>

          {/* Bar 1 */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#64748B", fontSize: "11px" }}>Content Analysis</span>
              <span style={{ color: "#64748B", fontSize: "11px" }}>{bar1}%</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${bar1}%`,
                background: "linear-gradient(90deg, #6D5EF3, #8B7CFF)",
                borderRadius: "2px",
                transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>
          </div>

          {/* Bar 2 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#64748B", fontSize: "11px" }}>Content Generation</span>
              <span style={{ color: "#64748B", fontSize: "11px" }}>{bar2}%</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${bar2}%`,
                background: "linear-gradient(90deg, #6D5EF3, #A78BFA)",
                borderRadius: "2px",
                transition: "width 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3 — Platform outputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", ...cardStyle(card3) }}>
        {[
          { label: "LinkedIn", bg: "#0077B5", icon: <span style={{ color: "#fff", fontWeight: 700, fontSize: "13px" }}>in</span> },
          { label: "X", bg: "#000000", icon: <span style={{ color: "#fff", fontWeight: 700, fontSize: "13px" }}>X</span> },
          { label: "Email", bg: "#1E293B", icon: <Mail size={14} color="#ffffff" /> },
        ].map(({ label, bg, icon }) => (
          <div
            key={label}
            style={{
              background: "#F8FAFC",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "10px",
              padding: "12px 8px",
              textAlign: "center",
            }}
          >
            <div style={{
              width: "32px",
              height: "32px",
              background: bg,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
            }}>
              {icon}
            </div>
            <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "10px", color: "#22C55E", fontWeight: 600 }}>Ready</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLATFORMS = ["LinkedIn Posts", "X Threads", "Newsletters"];

export function Hero() {
  const [platformIndex, setPlatformIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPlatformIndex((i) => (i + 1) % PLATFORMS.length);
        setVisible(true);
      }, 350);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        backgroundColor: "#F6F7FB",
        paddingTop: "120px",
        paddingBottom: "96px",
        paddingLeft: "24px",
        paddingRight: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes korelHeroCta {
          0%, 100% { box-shadow: 0 6px 20px rgba(109, 94, 243, 0.26); }
          50% { box-shadow: 0 8px 32px rgba(109, 94, 243, 0.50), 0 0 0 5px rgba(109, 94, 243, 0.09); }
        }
        .korel-hero-cta {
          box-shadow: 0 6px 20px rgba(109, 94, 243, 0.26);
          animation: korelHeroCta 3s ease-in-out 2s infinite;
        }
      `}</style>

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 800px 500px at 50% 0%, rgba(99, 82, 255, 0.09) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <div
        className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        style={{ maxWidth: "1320px", position: "relative", zIndex: 1 }}
      >
        {/* Left column */}
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6D5EF3",
              marginBottom: "20px",
              margin: "0 0 20px",
            }}
          >
            AI Agent for B2B Founders
          </p>

          <h1
            style={{
              color: "#1F2937",
              fontWeight: 700,
              fontSize: "clamp(32px, 4.2vw, 54px)",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              margin: "0 0 20px",
            }}
          >
            Every interview becomes
            <span
              style={{
                display: "block",
                background: "linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(-8px)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
                minHeight: "1.15em",
              }}
            >
              {PLATFORMS[platformIndex]}
            </span>
            automatically.
          </h1>

          <p
            style={{
              color: "#64748B",
              fontSize: "18px",
              lineHeight: 1.65,
              margin: "0 0 36px",
              maxWidth: "520px",
            }}
          >
            Korel monitors your podcast and interviews, generates LinkedIn posts, X threads, and newsletters automatically — then publishes them while you sleep.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "36px" }}>
            <a
              href="/new"
              className="korel-hero-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #9333EA 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "16px",
                height: "50px",
                padding: "0 28px",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.animationPlayState = "paused";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(109, 94, 243, 0.48)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.animationPlayState = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              Start Free →
            </a>
            <a
              href="#why-korel"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#4F46E5",
                fontWeight: 600,
                fontSize: "16px",
                height: "50px",
                padding: "0 28px",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,1)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.9)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              See how it works ↓
            </a>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {[
              { icon: "🤖", label: "AI-generated" },
              { icon: "⚡", label: "Auto-published" },
              { icon: "📡", label: "Always monitoring" },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ fontSize: "16px" }}>{icon}</span>
                <span style={{ color: "#64748B", fontSize: "14px", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — Widget */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <WidgetPreview />
        </div>
      </div>

    </section>
  );
}
