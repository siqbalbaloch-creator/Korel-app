import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Korel — Authority Distribution Engine for B2B Founders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #0F172A 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "500px",
            background: "radial-gradient(ellipse, rgba(109, 94, 243, 0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: "28px", fontWeight: 800 }}>K</span>
          </div>
          <span
            style={{
              color: "white",
              fontSize: "36px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            KOREL
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            color: "white",
            fontSize: "62px",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "920px",
            marginBottom: "28px",
          }}
        >
          Authority Distribution Engine
        </div>

        {/* Sub-headline */}
        <div
          style={{
            color: "rgba(148, 163, 184, 1)",
            fontSize: "26px",
            textAlign: "center",
            maxWidth: "740px",
            lineHeight: 1.5,
            marginBottom: "52px",
          }}
        >
          Turn founder interviews into LinkedIn posts, X threads, and newsletters — automatically.
        </div>

        {/* Pill tags */}
        <div style={{ display: "flex", gap: "16px" }}>
          {["LinkedIn", "X / Twitter", "Newsletter"].map((platform) => (
            <div
              key={platform}
              style={{
                background: "rgba(109, 94, 243, 0.18)",
                border: "1px solid rgba(109, 94, 243, 0.4)",
                borderRadius: "999px",
                padding: "10px 24px",
                color: "rgba(167, 155, 255, 1)",
                fontSize: "18px",
                fontWeight: 600,
                display: "flex",
              }}
            >
              {platform}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
