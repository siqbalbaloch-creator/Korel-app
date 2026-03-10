"use client";

const PRODUCT_LINKS = [
  { label: "Dashboard", href: "/new" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Insights", href: "/docs" },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refund" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", href: "/support" },
  { label: "Contact Us", href: "mailto:siqbalbaloch@gmail.com" },
];

function FooterColumn({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#94A3B8",
        margin: 0,
      }}>
        {heading}
      </p>
      {links.map(({ label, href }) => (
        <a
          key={href}
          href={href}
          style={{
            color: "#64748B",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
        >
          {label}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer
      className="px-6"
      style={{
        borderTop: "1px solid #E2E8F0",
        backgroundColor: "#ffffff",
        paddingTop: "64px",
        paddingBottom: "48px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1200px" }}>
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "48px",
            alignItems: "start",
            marginBottom: "48px",
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div style={{ maxWidth: "260px" }}>
            <h2 style={{
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "22px",
              letterSpacing: "-0.01em",
              margin: 0,
            }}>
              KOREL
            </h2>
            <p style={{
              color: "#64748B",
              fontSize: "14px",
              lineHeight: "1.6",
              marginTop: "10px",
            }}>
              The AI content agent for B2B founders.
            </p>
          </div>

          {/* Link columns */}
          <div style={{ display: "flex", gap: "64px", flexWrap: "wrap" }}>
            <FooterColumn heading="Product" links={PRODUCT_LINKS} />
            <FooterColumn heading="Legal" links={LEGAL_LINKS} />
            <FooterColumn heading="Support" links={SUPPORT_LINKS} />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid #F1F5F9",
            paddingTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
            &copy; 2026 Korel. All rights reserved.
          </p>
          <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
            Made for founders who think in public.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
