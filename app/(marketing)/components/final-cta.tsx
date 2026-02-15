"use client";

export function FinalCTA() {
  return (
    <section 
      className="px-6 relative overflow-hidden" 
      style={{ 
        paddingTop: '152px', 
        paddingBottom: '152px',
        background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(109, 94, 243, 0.06) 0%, transparent 60%), #ffffff',
        position: 'relative'
      }}
    >
      <div className="relative mx-auto text-center" style={{ maxWidth: '720px', zIndex: 1 }}>
        <h2 
          style={{ 
            color: '#1F2937', 
            fontWeight: 700,
            fontSize: '48px',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            marginBottom: '48px'
          }}
        >
          Your authority is already there.{' '}
          <span 
            style={{ 
              background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            We extract it.
          </span>
        </h2>

        <button
          style={{
            background: 'linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '16px',
            height: '52px',
            padding: '0 36px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(109, 94, 243, 0.15)',
            transition: 'all 0.2s ease',
            marginBottom: '24px',
            letterSpacing: '0'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(109, 94, 243, 0.25)';
            e.currentTarget.style.filter = 'brightness(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(109, 94, 243, 0.15)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          Generate Your First Pack
        </button>

        <div className="flex flex-wrap justify-center" style={{ gap: '24px' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.3346 4L6.0013 11.3333L2.66797 8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>No credit card</span>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.3346 4L6.0013 11.3333L2.66797 8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>3 free packs</span>
          </div>
        </div>
      </div>
    </section>
  );
}