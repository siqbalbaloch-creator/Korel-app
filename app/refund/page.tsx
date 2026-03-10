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
          <p>Korel is a subscription-based SaaS product. Payments are processed by <strong>Paddle</strong>, who acts as Merchant of Record. This policy describes when refunds are available and how to request one.</p>
          <p style={{ marginTop: "12px" }}>We want you to be satisfied with Korel. If you have a problem with your subscription or a charge, please contact us first and we will do our best to make it right.</p>
        </Section>

        <Section id="free-trial" title="2. Free Tier">
          <p>Korel offers a free tier with up to 3 Authority Packs per month. No payment information is required to use the free tier, and no charges apply. There is nothing to refund on a free account.</p>
        </Section>

        <Section id="paid-plans" title="3. Paid Subscriptions">
          <p>Paid subscriptions (Pro, Enterprise) are billed on a monthly or annual cycle. The following refund terms apply:</p>

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "20px", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px" }}>
              <p style={{ fontWeight: 700, color: "#166534", margin: "0 0 6px" }}>7-Day Money-Back Guarantee</p>
              <p style={{ margin: 0, color: "#166534" }}>If you subscribed to a paid plan and are not satisfied, you may request a full refund within <strong>7 days</strong> of your initial subscription payment. No questions asked.</p>
            </div>

            <div style={{ padding: "20px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px" }}>
              <p style={{ fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>After 7 Days</p>
              <p style={{ margin: 0 }}>After the 7-day window, subscription charges are non-refundable. You may cancel at any time and you will retain access to your paid plan until the end of the current billing period. No partial-month refunds are issued.</p>
            </div>

            <div style={{ padding: "20px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px" }}>
              <p style={{ fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>Annual Plans</p>
              <p style={{ margin: 0 }}>Annual subscriptions may be refunded in full within 7 days of payment. After the 7-day window, we will evaluate refund requests for annual plans on a case-by-case basis and may offer a pro-rated credit at our discretion.</p>
            </div>
          </div>
        </Section>

        <Section id="renewal" title="4. Renewal Charges">
          <p>Subscriptions renew automatically at the end of each billing period. If you did not intend to renew, you may request a refund for the most recent renewal charge within <strong>72 hours</strong> of the charge date, provided you have not used the service during that renewal period.</p>
          <p style={{ marginTop: "12px" }}>To prevent future renewals, cancel your subscription from your Billing settings before the renewal date.</p>
        </Section>

        <Section id="exceptions" title="5. Exceptions and Discretionary Refunds">
          <p>We may issue refunds outside the above terms in the following circumstances:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Extended service outages (more than 24 hours of cumulative downtime in a billing period) attributable to Korel infrastructure failures</li>
            <li>Duplicate charges caused by a billing error</li>
            <li>Charges made after a verified cancellation request that was not processed correctly</li>
          </ul>
          <p style={{ marginTop: "12px" }}>All discretionary refund decisions are final and made at Korel's sole discretion.</p>
        </Section>

        <Section id="how-to-request" title="6. How to Request a Refund">
          <p>To request a refund:</p>
          <ol style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Email <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a> with the subject line <strong>"Refund Request"</strong></li>
            <li>Include the email address on your Korel account and the approximate date of the charge</li>
            <li>Briefly describe the reason for your request (optional but helpful)</li>
          </ol>
          <p style={{ marginTop: "12px" }}>We will respond within 3 business days. If your refund is approved, it will be processed via Paddle and typically takes 5–10 business days to appear on your statement, depending on your payment method and bank.</p>
        </Section>

        <Section id="cancellation" title="7. Cancellation">
          <p>You can cancel your subscription at any time from your <Link href="/billing" style={{ color: "#6D5EF3" }}>Billing</Link> page by clicking "Manage Subscription." Cancellation stops future charges; it does not immediately remove your access or generate a refund for the current period.</p>
          <p style={{ marginTop: "12px" }}>To delete your account entirely and have your data removed, contact us at <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a>.</p>
        </Section>

        <Section id="contact" title="8. Contact">
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
