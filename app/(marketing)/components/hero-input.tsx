"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logMarketingEvent } from "@/lib/marketingEvents";

export function HeroInput() {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  return (
    <section className="px-6 pb-24" style={{ backgroundColor: "#FDFCFF" }}>
      <div className="mx-auto" style={{ maxWidth: "640px" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            padding: "36px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#1F2937",
              marginBottom: "6px",
              marginTop: 0,
            }}
          >
            Generate Your First Authority Pack
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#94A3B8",
              marginBottom: "20px",
              marginTop: 0,
            }}
          >
            Paste a YouTube link or transcript below.
          </p>

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste your YouTube link or transcript..."
            style={{
              width: "100%",
              minHeight: "160px",
              maxHeight: "160px",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              fontSize: "15px",
              fontFamily: "inherit",
              color: "#0F172A",
              backgroundColor: "#F8FAFC",
              resize: "none",
              marginBottom: "16px",
              transition: "all 0.2s ease",
              outline: "none",
              lineHeight: "1.6",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
              boxSizing: "border-box",
              display: "block",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#6D5EF3";
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.boxShadow =
                "inset 0 1px 2px rgba(0, 0, 0, 0.04), 0 0 0 3px rgba(109, 94, 243, 0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.backgroundColor = "#F8FAFC";
              e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0, 0, 0, 0.04)";
            }}
          />

          <button
            disabled={!inputValue.trim()}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "16px",
              height: "52px",
              borderRadius: "12px",
              border: "none",
              cursor: inputValue.trim() ? "pointer" : "not-allowed",
              boxShadow: "0 6px 24px rgba(79, 70, 229, 0.35)",
              transition: "all 0.2s ease",
              opacity: inputValue.trim() ? 1 : 0.55,
              display: "block",
            }}
            onMouseEnter={(e) => {
              if (!inputValue.trim()) return;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(79, 70, 229, 0.45)";
            }}
            onMouseLeave={(e) => {
              if (!inputValue.trim()) return;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(79, 70, 229, 0.35)";
            }}
            onClick={() => {
              const trimmed = inputValue.trim();
              if (!trimmed) return;
              void logMarketingEvent("CTA_CLICK", { cta: "hero_input_generate" });
              const params = new URLSearchParams({ input: trimmed });
              router.push(`/new?${params.toString()}`);
            }}
          >
            Generate Free Pack
          </button>

          <p
            style={{
              color: "#94A3B8",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "12px",
              marginBottom: 0,
            }}
          >
            3 free packs &bull; No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
