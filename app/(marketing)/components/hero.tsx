"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function Hero() {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  return (
    <section 
      className="relative px-6 overflow-hidden" 
      style={{ 
        paddingTop: '110px', 
        paddingBottom: '80px',
        background: 'radial-gradient(ellipse 800px 600px at 50% 20%, rgba(120, 108, 255, 0.12) 0%, transparent 60%), #F6F7FB',
        position: 'relative'
      }}
    >
      {/* Subtle radial glow behind hero */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 800px 600px at 50% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 60%)',
          zIndex: 0
        }}
      />

      <div className="relative mx-auto text-center" style={{ maxWidth: '1100px', zIndex: 1 }}>
        {/* Authority Badge with AI sparkle icon */}
        <div 
          className="inline-flex items-center justify-center"
          style={{ 
            marginBottom: '28px'
          }}
        >
          <div
            className="flex items-center"
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
              gap: '8px'
            }}
          >
            <Sparkles size={14} strokeWidth={2.5} style={{ color: '#6366F1' }} />
            <span style={{ color: '#6366F1' }}>
              #1 Authority Distribution Engine for B2B Founders
            </span>
          </div>
        </div>

        {/* Headline - Reduced to 60px for above-fold fit */}
        <h1 
          className="mx-auto"
          style={{ 
            color: '#1F2937', 
            fontWeight: 700,
            fontSize: '54px',
            lineHeight: '1.08',
            letterSpacing: '-0.5px',
            marginBottom: '16px',
            maxWidth: '840px'
          }}
        >
          Turn one conversation into a{' '}
          <span 
            style={{ 
              background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            week of authority
          </span>{' '}
          content.
        </h1>
        
        {/* Subheadline - softer contrast */}
        <p 
          className="mx-auto"
          style={{ 
            color: '#64748B',
            fontWeight: 400,
            fontSize: '18px',
            lineHeight: '1.6',
            marginBottom: '32px',
            maxWidth: '640px'
          }}
        >
          Paste a YouTube link or transcript. KOREL extracts your strongest insights and generates a full weekly content pack — instantly.
        </p>

        {/* Interactive Input Block - MAIN PRODUCT SURFACE */}
        <div 
          className="mx-auto"
          style={{ 
            maxWidth: '680px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            marginBottom: '40px',
            transition: 'all 0.3s ease'
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
          {/* Large Textarea - 200px height for above fold */}
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
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)'
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

          {/* Primary CTA Button - Premium gradient */}
          <button
            disabled={!inputValue.trim()}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '16px',
              height: '52px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(109, 94, 243, 0.15)',
              transition: 'all 0.2s ease',
              letterSpacing: '0',
              marginBottom: '14px',
              opacity: inputValue.trim() ? 1 : 0.6,
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed'
            }}
            onMouseEnter={(e) => {
              if (!inputValue.trim()) return;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(109, 94, 243, 0.25)';
              e.currentTarget.style.filter = 'brightness(1.05)';
            }}
            onMouseLeave={(e) => {
              if (!inputValue.trim()) return;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(109, 94, 243, 0.15)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onClick={() => {
              const trimmed = inputValue.trim();
              if (!trimmed) return;
              const params = new URLSearchParams({ input: trimmed });
              router.push(`/new?${params.toString()}`);
            }}
          >
            Generate Free Pack
          </button>

          {/* Microcopy below button */}
          <p 
            style={{ 
              color: '#64748B',
              fontSize: '13px',
              fontWeight: 500,
              margin: 0,
              textAlign: 'center',
              lineHeight: '1.5'
            }}
          >
            Generate your first pack in 30 seconds — 3 free packs available<br />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>No credit card required</span>
          </p>
        </div>

        {/* Social Proof - compact */}
        <div>
          <p 
            style={{ 
              color: '#64748B',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '20px',
              letterSpacing: '0'
            }}
          >
            Trusted by 1,200+ B2B founders and creators
          </p>

          <div 
            className="flex flex-wrap justify-center items-center" 
            style={{ gap: '40px' }}
          >
            <LogoPlaceholder name="Basecamp" />
            <LogoPlaceholder name="Indie Hackers" />
            <LogoPlaceholder name="Product Hunt" />
            <LogoPlaceholder name="Y Combinator" />
            <LogoPlaceholder name="Stripe" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoPlaceholder({ name }: { name: string }) {
  return (
    <div 
      style={{ 
        color: '#94A3B8',
        fontSize: '15px',
        fontWeight: 600,
        opacity: 0.6,
        letterSpacing: '0'
      }}
    >
      {name}
    </div>
  );
}