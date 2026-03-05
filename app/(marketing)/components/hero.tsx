"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, FileText, MessageSquare, Mail, Zap } from "lucide-react";
import { logMarketingEvent } from "@/lib/marketingEvents";

const PACK_ITEMS = [
  { icon: FileText, label: "LinkedIn Post", desc: "3 hook variants ready to publish" },
  { icon: MessageSquare, label: "X Thread", desc: "7-tweet breakdown with CTA" },
  { icon: Mail, label: "Newsletter Outline", desc: "Full section structure + copy" },
  { icon: Zap, label: "Strategic Hooks", desc: "8 authority-building angles" },
] as const;

export function Hero() {
  const router = useRouter();

  return (
    <section
      className="relative px-6 overflow-hidden py-28 lg:py-32"
      style={{
        background:
          "radial-gradient(ellipse 900px 600px at 55% 30%, rgba(99, 82, 255, 0.11) 0%, transparent 65%), #FDFCFF",
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 900px 600px at 55% 30%, rgba(79, 70, 229, 0.04) 0%, transparent 65%)",
          zIndex: 0,
        }}
      />

      {/* Two-column layout */}
      <div
        className="relative mx-auto grid items-center grid-cols-1 lg:grid-cols-2 gap-16"
        style={{ maxWidth: "1200px", zIndex: 1 }}
      >
        {/* LEFT — Copy + CTAs */}
        <div className="flex flex-col">
          {/* Badge */}
          <div style={{ marginBottom: "28px" }}>
            <div
              className="inline-flex items-center"
              style={{
                color: "#6366F1",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "8px 16px",
                borderRadius: "100px",
                background:
                  "linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
                gap: "8px",
              }}
            >
              <Sparkles size={14} strokeWidth={2.5} style={{ color: "#6366F1" }} />
              <span>Authority Engine for B2B Founders</span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl lg:text-6xl"
            style={{
              color: "#1F2937",
              fontWeight: 700,
              lineHeight: "1.08",
              letterSpacing: "-1.5px",
              marginBottom: "24px",
            }}
          >
            Turn Founder Thinking
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Into Authority Content
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="max-w-xl"
            style={{
              color: "#64748B",
              fontWeight: 400,
              fontSize: "18px",
              lineHeight: "1.65",
              marginBottom: "40px",
            }}
          >
            Korel extracts insights from transcripts and generates LinkedIn posts, X threads, and
            newsletters instantly.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start" style={{ gap: "16px" }}>
            <button
              onClick={() => {
                void logMarketingEvent("CTA_CLICK", { cta: "hero_generate_free_pack" });
                router.push("/new");
              }}
              style={{
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "16px",
                height: "52px",
                paddingLeft: "28px",
                paddingRight: "28px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(79, 70, 229, 0.35)",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 28px rgba(79, 70, 229, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(79, 70, 229, 0.35)";
              }}
            >
              Generate Your Free Pack
            </button>

            <button
              onClick={() => {
                void logMarketingEvent("CTA_CLICK", { cta: "hero_see_how_it_works" });
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center"
              style={{
                gap: "6px",
                color: "#6366F1",
                fontWeight: 500,
                fontSize: "15px",
                height: "52px",
                padding: "0 4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#4F46E5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#6366F1";
              }}
            >
              See How It Works
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Caption */}
          <p
            style={{
              color: "#94A3B8",
              fontSize: "13px",
              fontWeight: 500,
              marginTop: "16px",
              marginBottom: 0,
            }}
          >
            3 free packs &bull; No credit card required
          </p>
        </div>

        {/* RIGHT — Authority Pack Preview */}
        <div className="flex justify-center lg:justify-end">
          <div
            className="w-full"
            style={{
              maxWidth: "440px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              padding: "28px",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-start justify-between"
              style={{ marginBottom: "20px", gap: "12px" }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6366F1",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "4px",
                  }}
                >
                  Authority Pack Preview
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1F2937" }}>
                  Why Most Founders Stay Invisible
                </div>
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Generated
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "#F1F5F9", marginBottom: "20px" }} />

            {/* Pack items */}
            {PACK_ITEMS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-start"
                style={{
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E9EEF5",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    color: "#6366F1",
                    backgroundColor: "rgba(99, 102, 241, 0.08)",
                    borderRadius: "7px",
                    padding: "6px",
                    flexShrink: 0,
                    marginTop: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={15} strokeWidth={2} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1E293B",
                      marginBottom: "2px",
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", lineHeight: "1.4" }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}

            {/* Quality score footer */}
            <div
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                borderRadius: "8px",
                background:
                  "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={13} style={{ color: "#6366F1", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: "#6366F1", fontWeight: 500 }}>
                Quality Score: 94 / 100
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
