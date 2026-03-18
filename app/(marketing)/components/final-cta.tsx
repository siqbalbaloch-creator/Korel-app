"use client";

import { useRouter } from "next/navigation";
import { logMarketingEvent } from "@/lib/marketingEvents";

export function FinalCTA() {
  const router = useRouter();
  return (
    <section className="px-6 relative overflow-hidden" style={{ paddingTop: "152px", paddingBottom: "152px", background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(109,94,243,0.08) 0%, transparent 60%), #F6F7FB" }}>
      <div className="relative mx-auto text-center" style={{ maxWidth: "720px", zIndex: 1 }}>
        <h2 style={{ color: "#1F2937", fontWeight: 700, fontSize: "48px", lineHeight: "1.2", letterSpacing: "-0.02em", marginBottom: "16px" }}>
          Your next interview{" "}
          <span style={{ background: "linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            is already content.
          </span>
        </h2>
        <p style={{ color: "#64748B", fontSize: "18px", lineHeight: "1.65", marginBottom: "40px" }}>
          Connect your podcast or paste a transcript. Korel handles the rest.
        </p>
        <button
          style={{ background: "linear-gradient(135deg,#6D5EF3 0%,#8B7CFF 100%)", color: "#ffffff", fontWeight: 600, fontSize: "17px", height: "54px", padding: "0 40px", borderRadius: "12px", border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(109,94,243,0.2)", transition: "all 0.2s ease", marginBottom: "24px" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(109,94,243,0.32)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(109,94,243,0.2)"; }}
          onClick={() => { void logMarketingEvent("CTA_CLICK", { cta: "final_cta_generate" }); router.push("/new"); }}
        >
          Start Free — No credit card required
        </button>
        <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
          Setup takes 3 minutes.<br />First pack generated in under 60 seconds.
        </p>
      </div>
    </section>
  );
}
