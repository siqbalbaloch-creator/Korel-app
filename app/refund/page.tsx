import Link from "next/link";

export const metadata = {
  title: "Refund Policy — Korel",
  description: "Refund and cancellation policy for Korel subscriptions.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: "40px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>
        {title}
      </h2>
      <div style={{ color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>{children}</div>
    </section>
  );
}

export default function RefundPage() {
  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#0F172A", padding: "64px 24px 48px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <Link
            href="/"
            style={{ color: "#94A3B8", fontSize: "14px", textDecoration: "none", display: "inline-block", marginBottom: "24px" }}
          >
            ← Back to Korel
          </Link>
          <h1 style={{ color: "#ffffff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            Refund Policy
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "15px", marginTop: "12px" }}>
            Effective date: March 10, 2026 &nbsp;·&nbsp; Operated by Saqib Iqbal
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "56px 24px 80px" }}>

        <Section id="overview" title="1. Overview">
          <p>Korel is a subscription-based SaaS product. Payments are processed by <strong>Paddle</strong>, who acts as Merchant of Record.</p>
          <p style={{ marginTop: "12px" }}>Cancel within 14 days of purchase for a full refund, no questions asked.</p>
        </Section>

        <Section id="free-trial" title="2. Free Tier">
          <p>Korel offers a free tier with up to 3 Authority Packs per month. No payment information is required to use the free tier, and no charges apply. There is nothing to refund on a free account.</p>
        </Section>

        <Section id="paid-plans" title="3. Paid Subscriptions">
          <div style={{ marginTop: "16px" }}>
            <div style={{ padding: "20px", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px" }}>
              <p style={{ fontWeight: 700, color: "#166534", margin: "0 0 6px" }}>14-Day Money-Back Guarantee</p>
              <p style={{ margin: 0, color: "#166534" }}>Cancel within <strong>14 days</strong> of purchase for a full refund, no questions asked.</p>
            </div>
          </div>
        </Section>

        <Section id="renewal" title="4. Renewal Charges">
          <p>Subscriptions renew automatically at the end of each billing period. You may cancel your subscription at any time from your Billing settings to prevent future renewals.</p>
        </Section>

        <Section id="how-to-request" title="5. How to Request a Refund">
          <p>To request a refund:</p>
          <ol style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Email <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a> with the subject line <strong>"Refund Request"</strong></li>
            <li>Include the email address on your Korel account and the approximate date of the charge</li>
          </ol>
          <p style={{ marginTop: "12px" }}>Refunds are processed via Paddle and typically take 5–10 business days to appear on your statement, depending on your payment method and bank.</p>
        </Section>

        <Section id="cancellation" title="6. Cancellation">
          <p>You can cancel your subscription at any time from your <Link href="/billing" style={{ color: "#6D5EF3" }}>Billing</Link> page by clicking "Manage Subscription." Cancellation stops future charges and your access continues until the end of the current billing period.</p>
          <p style={{ marginTop: "12px" }}>To delete your account entirely and have your data removed, contact us at <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a>.</p>
        </Section>

        <Section id="contact" title="7. Contact">
          <p>For any billing or refund questions:</p>
          <div style={{ marginTop: "12px", padding: "16px 20px", backgroundColor: "#F1F5F9", borderRadius: "8px" }}>
            <p style={{ margin: 0 }}><strong>Korel</strong> (operated by Saqib Iqbal)</p>
            <p style={{ margin: "4px 0 0" }}>Email: <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a></p>
            <p style={{ margin: "4px 0 0" }}>Billing settings: <Link href="/billing" style={{ color: "#6D5EF3" }}>usekorel.com/billing</Link></p>
          </div>
          <p style={{ marginTop: "16px" }}>
            Also see our <Link href="/terms" style={{ color: "#6D5EF3" }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: "#6D5EF3" }}>Privacy Policy</Link>.
          </p>
        </Section>

      </div>
    </div>
  );
}
