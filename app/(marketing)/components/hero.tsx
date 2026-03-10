"use client";

export function Hero() {
  return (
    <section
      style={{
        backgroundColor: "#F6F7FB",
        paddingTop: "120px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow */}
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

      <div style={{ position: "relative", zIndex: 1, maxWidth: "760px", margin: "0 auto" }}>
        {/* Badge */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              color: "#6366F1",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "7px 16px",
              borderRadius: "100px",
              background:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72))",
              border: "1px solid rgba(99, 102, 241, 0.28)",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
            }}
          >
            <span style={{ fontSize: "14px" }}>🤖</span>
            <span>AI Agent for B2B Founders</span>
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#1F2937",
            fontWeight: 700,
            fontSize: "clamp(40px, 6vw, 66px)",
            lineHeight: 1.06,
            letterSpacing: "-2px",
            marginBottom: "24px",
          }}
        >
          Your Content Runs Itself.
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            You Just Show Up.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            color: "#64748B",
            fontWeight: 400,
            fontSize: "18px",
            lineHeight: 1.65,
            maxWidth: "560px",
            margin: "0 auto 40px",
          }}
        >
          Korel monitors your podcast and interviews, generates LinkedIn posts, X threads, and newsletters automatically — then publishes them while you sleep.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <a
            href="/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "16px",
              height: "50px",
              padding: "0 28px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(109, 94, 243, 0.25)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(109, 94, 243, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(109, 94, 243, 0.25)";
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "32px",
          }}
        >
          {[
            { icon: "🤖", label: "AI-generated" },
            { icon: "⚡", label: "Auto-published" },
            { icon: "📡", label: "Always monitoring" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: "7px" }}
            >
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ color: "#64748B", fontSize: "14px", fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
