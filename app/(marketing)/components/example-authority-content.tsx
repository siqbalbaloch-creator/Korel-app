"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Check, Linkedin, Twitter, Mail, Zap, Sparkles } from "lucide-react";

const LINKEDIN_POST_LINES = [
  "Most founders don't have a distribution problem.",
  "",
  "They have a thinking problem.",
  "",
  "They say interesting things in interviews, investor calls, and strategy meetings — but none of it becomes content.",
  "",
  "The issue isn't ideas.",
  "",
  "It's structure.",
  "",
  "Every strong authority brand has one core thesis that every post reinforces.",
  "",
  "Without that structure, content becomes noise.",
  "",
  "That's exactly why we built Korel.",
];

const PACK_ASSETS = [
  { icon: Linkedin, label: "LinkedIn Post" },
  { icon: Twitter, label: "X Thread" },
  { icon: Mail, label: "Newsletter Outline" },
  { icon: Zap, label: "Strategic Hooks" },
] as const;

export function ExampleAuthorityContent() {
  const { status } = useSession();
  const ctaHref = status === "authenticated" ? "/new" : "/signup";

  return (
    <section
      style={{
        backgroundColor: "#F6F7FB",
        padding: "80px 24px",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {/* Section header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#4F46E5",
              marginBottom: "12px",
            }}
          >
            See It In Action
          </p>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            Example Authority Content
          </h2>
          <p
            style={{
              fontSize: "17px",
              color: "#64748B",
              maxWidth: "480px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            What Korel generates from a single transcript.
          </p>
        </div>

        {/* Two-column cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* Left card: LinkedIn Post */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(15, 23, 42, 0.06)",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Linkedin size={14} color="#4F46E5" />
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                LinkedIn Post Example
              </span>
            </div>

            {/* Post content */}
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: 1.75,
                  color: "#334155",
                  whiteSpace: "pre-line",
                }}
              >
                {LINKEDIN_POST_LINES.map((line, i) =>
                  line === "" ? (
                    <div key={i} style={{ height: "10px" }} />
                  ) : (
                    <p key={i} style={{ margin: 0 }}>
                      {line}
                    </p>
                  ),
                )}
              </div>
            </div>

            {/* Card footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={12} color="#94A3B8" />
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                Generated from: Sam Altman interview
              </span>
            </div>
          </div>

          {/* Right card: Authority Pack Assets */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(15, 23, 42, 0.06)",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={14} color="#4F46E5" />
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                Authority Pack Assets
              </span>
            </div>

            {/* Asset list */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {PACK_ASSETS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "10px",
                    border: "1px solid #F1F5F9",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#EEF2FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color="#4F46E5" />
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#334155",
                      flex: 1,
                    }}
                  >
                    {label}
                  </span>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={11} color="#16A34A" strokeWidth={2.5} />
                  </div>
                </div>
              ))}
            </div>

            {/* Source note */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={12} color="#94A3B8" />
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                All assets generated from a single transcript
              </span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: "48px",
            textAlign: "center",
          }}
        >
          <Link
            href={ctaHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "15px",
              padding: "14px 28px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.28)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            <Sparkles size={16} />
            Generate Your Own Authority Pack
          </Link>
          <p
            style={{
              marginTop: "12px",
              fontSize: "13px",
              color: "#94A3B8",
            }}
          >
            Free to start. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
