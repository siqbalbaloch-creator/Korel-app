"use client";
  
export function UpgradeModal() {
  return (
    <section 
      className="px-6" 
      style={{ 
        paddingTop: '100px', 
        paddingBottom: '100px',
        backgroundColor: '#F8FAFC'
      }}
    >
      <div className="mx-auto text-center" style={{ maxWidth: '1200px' }}>
        <p 
          style={{ 
            color: '#64748B',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '40px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Upgrade Modal Design Preview
        </p>

        {/* Modal Container */}
        <div 
          className="inline-block"
          style={{ 
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '56px',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
            border: '1px solid #E2E8F0',
            maxWidth: '480px',
            textAlign: 'center'
          }}
        >
          {/* Icon */}
          <div 
            className="flex items-center justify-center mx-auto"
            style={{ 
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #B8A3FF 0%, #9B7FFF 100%)',
              marginBottom: '24px',
              color: '#ffffff'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>

          {/* Title */}
          <h3 
            style={{ 
              color: '#0F172A',
              fontSize: '28px',
              fontWeight: 600,
              marginBottom: '12px',
              letterSpacing: '-0.01em',
              lineHeight: '1.2'
            }}
          >
            You&apos;ve used your 3 free packs
          </h3>

          {/* Description */}
          <p 
            style={{ 
              color: '#64748B',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '1.6',
              marginBottom: '32px'
            }}
          >
            Upgrade to continue generating structured authority content.
          </p>

          {/* Price */}
          <div style={{ marginBottom: '28px' }}>
            <div className="flex items-baseline justify-center" style={{ gap: '6px' }}>
              <span 
                style={{ 
                  color: '#0F172A', 
                  fontWeight: 700,
                  fontSize: '44px',
                  lineHeight: '1',
                  letterSpacing: '-0.02em'
                }}
              >
                $29
              </span>
              <span 
                style={{ 
                  color: '#64748B',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                / month
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #B8A3FF 0%, #9B7FFF 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '16px',
                height: '48px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(155, 127, 255, 0.3)',
                transition: 'all 0.2s ease',
                letterSpacing: '0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(155, 127, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(155, 127, 255, 0.3)';
              }}
            >
              Upgrade to Pro
            </button>

            <button
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: '#64748B',
                fontWeight: 500,
                fontSize: '15px',
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: '0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
