"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { logMarketingEvent } from "@/lib/marketingEvents";

export function Hero() {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  return (
    <section
      className="relative px-6 overflow-hidden pt-24 pb-20 lg:pt-[120px] lg:pb-[120px]"
      style={{
        background: 'radial-gradient(ellipse 900px 600px at 55% 30%, rgba(99, 82, 255, 0.22) 0%, transparent 65%), #F9F8FF',
        position: 'relative',
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 900px 600px at 55% 30%, rgba(79, 70, 229, 0.08) 0%, transparent 65%)',
          zIndex: 0,
        }}
      />

      {/* Two-column split layout */}
      <div
        className="relative mx-auto grid items-center grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px] gap-10 lg:gap-12"
        style={{ maxWidth: '1320px', zIndex: 1 }}
      >
        {/* LEFT COLUMN — Copy + CTAs */}
        <div className="flex flex-col">
          {/* Badge */}
          <div style={{ marginBottom: '28px' }}>
            <div
              className="inline-flex items-center"
              style={{
                color: '#6366F1',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '8px 16px',
                borderRadius: '100px',
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
                gap: '8px',
              }}
            >
              <Sparkles size={14} strokeWidth={2.5} style={{ color: '#6366F1' }} />
              <span style={{ color: '#6366F1' }}>Authority Engine for B2B Founders</span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl lg:text-5xl"
            style={{
              color: '#1F2937',
              fontWeight: 700,
              lineHeight: '1.1',
              letterSpacing: '-0.5px',
              marginBottom: '20px',
            }}
          >
            Paste a Transcript.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Generate a Structured Authority Pack.
            </span>
          </h1>

          {/* Subheading */}
          <p
            style={{
              color: '#64748B',
              fontWeight: 400,
              fontSize: '18px',
              lineHeight: '1.65',
              marginBottom: '36px',
            }}
          >
            Korel extracts your thesis, builds a Strategic Authority Map, and compiles LinkedIn posts, X threads, and newsletters — instantly.
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row items-start"
            style={{ gap: '12px', marginBottom: '16px' }}
          >
            <button
              onClick={() => {
                void logMarketingEvent("CTA_CLICK", { cta: "hero_generate_free_pack" });
                router.push('/new');
              }}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '16px',
                height: '52px',
                paddingLeft: '28px',
                paddingRight: '28px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 28px rgba(79, 70, 229, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(79, 70, 229, 0.35)';
              }}
            >
              Generate Your Free Pack
            </button>

            <button
              onClick={() => {
                void logMarketingEvent("CTA_CLICK", { cta: "hero_see_how_it_works" });
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center"
              style={{
                gap: '6px',
                color: '#6366F1',
                fontWeight: 500,
                fontSize: '15px',
                height: '52px',
                padding: '0 4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6366F1';
              }}
            >
              See How It Works
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Caption */}
          <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500, margin: 0 }}>
            3 free packs &bull; No credit card required
          </p>
        </div>

        {/* RIGHT COLUMN — Input form */}
        <div>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(99, 102, 241, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
            }}
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste your YouTube link or transcript..."
              style={{
                width: '100%',
                minHeight: '200px',
                maxHeight: '200px',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '15px',
                fontFamily: 'inherit',
                color: '#0F172A',
                backgroundColor: '#F8FAFC',
                resize: 'none',
                marginBottom: '20px',
                transition: 'all 0.2s ease',
                outline: 'none',
                lineHeight: '1.6',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6D5EF3';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04), 0 0 0 3px rgba(109, 94, 243, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04)';
              }}
            />

            <button
              disabled={!inputValue.trim()}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '16px',
                height: '52px',
                borderRadius: '12px',
                border: 'none',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                boxShadow: '0 6px 24px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s ease',
                marginBottom: '14px',
                opacity: inputValue.trim() ? 1 : 0.55,
              }}
              onMouseEnter={(e) => {
                if (!inputValue.trim()) return;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 28px rgba(79, 70, 229, 0.45)';
                e.currentTarget.style.filter = 'brightness(1.05)';
              }}
              onMouseLeave={(e) => {
                if (!inputValue.trim()) return;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(79, 70, 229, 0.35)';
                e.currentTarget.style.filter = 'brightness(1)';
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
                color: '#64748B',
                fontSize: '13px',
                fontWeight: 500,
                margin: 0,
                textAlign: 'center',
                lineHeight: '1.5',
              }}
            >
              Generate your first pack in 30 seconds
              <br />
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Early access — private founder cohort
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
