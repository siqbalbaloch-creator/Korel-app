import { Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section
      style={{
        backgroundColor: "#F6F7FB",
        paddingTop: "120px",
        paddingBottom: "32px",
        paddingLeft: "24px",
        paddingRight: "24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 800px 500px at 50% 0%, rgba(99, 82, 255, 0.09) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "720px", margin: "0 auto" }}>
        {/* Badge */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              color: "#6366F1",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "7px 16px",
              borderRadius: "100px",
              background:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72))",
              border: "1px solid rgba(99, 102, 241, 0.28)",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
            }}
          >
            <Sparkles size={13} strokeWidth={2.5} style={{ color: "#6366F1" }} />
            <span>Authority Engine for B2B Founders</span>
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#1F2937",
            fontWeight: 700,
            fontSize: "clamp(42px, 6vw, 64px)",
            lineHeight: 1.06,
            letterSpacing: "-2px",
            marginBottom: "22px",
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
          style={{
            color: "#64748B",
            fontWeight: 400,
            fontSize: "18px",
            lineHeight: 1.65,
            maxWidth: "540px",
            margin: "0 auto 36px",
          }}
        >
          Paste a transcript. Korel extracts your core thesis and generates LinkedIn posts,
          X threads, and newsletters — instantly.
        </p>

        {/* Demo nudge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.75))",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "100px",
            padding: "10px 20px",
            boxShadow: "0 2px 12px rgba(99, 102, 241, 0.1)",
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>👇</span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#4F46E5",
            }}
          >
            Try it free below — no sign-up needed
          </span>
        </div>
      </div>
    </section>
  );
}
