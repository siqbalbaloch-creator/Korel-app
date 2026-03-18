"use client";

import { useEffect, useRef } from "react";
import { Rss, Eye, Sparkles, Zap, CheckCircle } from "lucide-react";

const STEPS = [
  {
    number: "01",
    role: "YOU" as const,
    Icon: Rss,
    title: "You connect once",
    body: "Paste your YouTube channel URL or podcast RSS. That is your only job. The agent handles everything from here.",
  },
  {
    number: "02",
    role: "AGENT" as const,
    Icon: Eye,
    title: "Agent monitors 24/7",
    body: "Korel watches your feed around the clock. The moment a new episode drops, the pipeline fires automatically.",
  },
  {
    number: "03",
    role: "AGENT" as const,
    Icon: Sparkles,
    title: "Agent reads & extracts",
    body: "The episode is transcribed and analyzed. Your sharpest insights, core arguments, and quotable moments are pulled out.",
  },
  {
    number: "04",
    role: "AGENT" as const,
    Icon: Zap,
    title: "Agent writes your content",
    body: "A LinkedIn post, X thread, and newsletter section — written in your voice, from your real ideas. Not templates.",
  },
  {
    number: "05",
    role: "YOU" as const,
    Icon: CheckCircle,
    title: "You approve (or skip it)",
    body: "Get notified. Review in 60 seconds and tap Approve — or enable auto-publish and never lift a finger.",
  },
] as const;

const ROLE_COLORS = {
  YOU: { bg: "rgba(15, 23, 42, 0.07)", text: "#475569", label: "YOU" },
  AGENT: { bg: "rgba(109, 94, 243, 0.12)", text: "#6D5EF3", label: "AGENT" },
};

export function HowKorelWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll("[data-step]");
    if (!cards) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const index = parseInt(card.getAttribute("data-step") ?? "0");
            setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            }, index * 100);
            observer.unobserve(card);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="why-korel"
      className="px-6"
      style={{
        paddingTop: "112px",
        paddingBottom: "120px",
        background: "linear-gradient(180deg, #ECEEFF 0%, #F0EFFF 60%, #EDEEFF 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        /* Sequential card pulse — 5s loop, staggered 1s apart */
        @keyframes cardPulse {
          0%, 18%, 100% {
            box-shadow: 0 2px 12px rgba(109, 94, 243, 0.06), 0 1px 3px rgba(0,0,0,0.04);
          }
          4%, 14% {
            box-shadow: 0 8px 32px rgba(109, 94, 243, 0.22), 0 2px 8px rgba(0,0,0,0.06);
          }
        }
        @keyframes cardBorder {
          0%, 18%, 100% { border-color: rgba(109, 94, 243, 0.10); }
          4%, 14%       { border-color: rgba(109, 94, 243, 0.40); }
        }
        .step-card-0 { animation: cardPulse 5s ease-in-out 0.5s infinite, cardBorder 5s ease-in-out 0.5s infinite; }
        .step-card-1 { animation: cardPulse 5s ease-in-out 1.5s infinite, cardBorder 5s ease-in-out 1.5s infinite; }
        .step-card-2 { animation: cardPulse 5s ease-in-out 2.5s infinite, cardBorder 5s ease-in-out 2.5s infinite; }
        .step-card-3 { animation: cardPulse 5s ease-in-out 3.5s infinite, cardBorder 5s ease-in-out 3.5s infinite; }
        .step-card-4 { animation: cardPulse 5s ease-in-out 4.5s infinite, cardBorder 5s ease-in-out 4.5s infinite; }

        /* Travelling pipeline dot */
        @keyframes pipelineDot {
          0%   { left: 0%;    opacity: 0; }
          3%   { opacity: 1; }
          94%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .korel-flow-dot {
          position: absolute;
          top: -4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, #A78BFA 0%, #6D5EF3 100%);
          box-shadow: 0 0 10px 3px rgba(109, 94, 243, 0.55);
          animation: pipelineDot 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Icon ring pulse on active card */
        @keyframes iconRing {
          0%, 18%, 100% { box-shadow: none; }
          4%, 14%       { box-shadow: 0 0 0 3px rgba(109, 94, 243, 0.18); }
        }
        .step-icon-0 { animation: iconRing 5s ease-in-out 0.5s infinite; }
        .step-icon-1 { animation: iconRing 5s ease-in-out 1.5s infinite; }
        .step-icon-2 { animation: iconRing 5s ease-in-out 2.5s infinite; }
        .step-icon-3 { animation: iconRing 5s ease-in-out 3.5s infinite; }
        .step-icon-4 { animation: iconRing 5s ease-in-out 4.5s infinite; }
      `}</style>

      {/* Ambient radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 900px 400px at 50% 110%, rgba(109, 94, 243, 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto" style={{ maxWidth: "1100px", position: "relative" }}>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: "60px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "#6D5EF3",
              marginBottom: "18px",
              background: "rgba(109, 94, 243, 0.10)",
              padding: "5px 14px",
              borderRadius: "20px",
              border: "1px solid rgba(109, 94, 243, 0.18)",
            }}
          >
            The agent loop
          </span>
          <h2
            style={{
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "clamp(28px, 3.2vw, 44px)",
              marginBottom: "14px",
              letterSpacing: "-0.02em",
              lineHeight: "1.15",
            }}
          >
            You connect once. The agent does the rest.
          </h2>
          <p
            style={{
              color: "#64748B",
              fontSize: "17px",
              lineHeight: "1.65",
              margin: "0 auto",
              maxWidth: "480px",
            }}
          >
            A fully autonomous pipeline that runs 24/7 — without you touching a thing.
          </p>
        </div>

        {/* Pipeline flow bar — desktop only */}
        <div
          className="hidden sm:block"
          style={{
            position: "relative",
            height: "2px",
            background: "linear-gradient(90deg, rgba(109,94,243,0.08) 0%, rgba(109,94,243,0.30) 50%, rgba(109,94,243,0.08) 100%)",
            borderRadius: "2px",
            marginBottom: "20px",
          }}
        >
          <div className="korel-flow-dot" />
        </div>

        {/* Steps grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-5"
          style={{ gap: "12px", alignItems: "stretch" }}
        >
          {STEPS.map((step, i) => {
            const { Icon } = step;
            const roleStyle = ROLE_COLORS[step.role];
            const isAgent = step.role === "AGENT";

            return (
              <div
                key={step.number}
                data-step={i}
                className={`step-card-${i}`}
                style={{
                  opacity: 0,
                  transform: "translateY(22px)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(109, 94, 243, 0.10)",
                  borderRadius: "18px",
                  padding: "24px 20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Top accent bar — stronger for agent cards */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "20px",
                    right: "20px",
                    height: "2px",
                    background: isAgent
                      ? "linear-gradient(90deg, rgba(109,94,243,0.35), rgba(124,58,237,0.75), rgba(109,94,243,0.35))"
                      : "linear-gradient(90deg, rgba(71,85,105,0.2), rgba(71,85,105,0.45), rgba(71,85,105,0.2))",
                    borderRadius: "0 0 2px 2px",
                  }}
                />

                {/* Top row: icon + step number */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div
                    className={`step-icon-${i}`}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: isAgent
                        ? "linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(124,58,237,0.18) 100%)"
                        : "rgba(71,85,105,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "box-shadow 0.3s ease",
                    }}
                  >
                    <Icon size={15} color={isAgent ? "#6D5EF3" : "#475569"} strokeWidth={1.75} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isAgent ? "#C4B5FD" : "#94A3B8",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Role badge */}
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: roleStyle.text,
                      background: roleStyle.bg,
                      padding: "2px 8px",
                      borderRadius: "20px",
                      marginBottom: "8px",
                    }}
                  >
                    {roleStyle.label}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      color: "#0F172A",
                      fontWeight: 700,
                      fontSize: "14px",
                      lineHeight: "1.35",
                    }}
                  >
                    {step.title}
                  </p>
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "#64748B",
                    fontSize: "12.5px",
                    lineHeight: "1.72",
                  }}
                >
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            color: "#94A3B8",
            fontSize: "14px",
            marginTop: "44px",
            marginBottom: 0,
            fontStyle: "italic",
          }}
        >
          Or skip the review entirely — schedule auto-publish and Korel handles everything.
        </p>
      </div>
    </section>
  );
}
