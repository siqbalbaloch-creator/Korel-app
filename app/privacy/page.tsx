import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Korel",
  description: "Privacy Policy for Korel, the AI Authority Distribution Engine.",
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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "15px", marginTop: "12px" }}>
            Effective date: March 10, 2026 &nbsp;·&nbsp; Operated by Saqib Iqbal
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "56px 24px 80px" }}>

        <Section id="intro" title="Overview">
          <p>Korel ("we," "us," "our"), operated by Saqib Iqbal, is committed to protecting your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights in relation to that data. By using Korel at usekorel.com, you agree to the practices described here.</p>
          <p style={{ marginTop: "12px" }}>If you have questions, contact us at <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a>.</p>
        </Section>

        <Section id="data-collected" title="1. What Data We Collect">
          <p><strong>Account information:</strong></p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Name and email address (from registration or Google OAuth)</li>
            <li>Encrypted password hash (if using email/password login)</li>
            <li>Account creation date and last activity timestamp</li>
          </ul>

          <p style={{ marginTop: "16px" }}><strong>Connected account credentials:</strong></p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>LinkedIn OAuth access tokens (for publishing on your behalf)</li>
            <li>X (Twitter) OAuth tokens (for publishing on your behalf)</li>
            <li>Beehiiv API key (stored AES-256-GCM encrypted at rest)</li>
            <li>Beehiiv Publication ID</li>
          </ul>

          <p style={{ marginTop: "16px" }}><strong>Content you submit:</strong></p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Input text (transcripts, memos, documents) submitted for pack generation</li>
            <li>RSS feed URLs and YouTube channel URLs you add to monitoring</li>
            <li>Authority Profile settings (positioning, audience, tone preferences)</li>
          </ul>

          <p style={{ marginTop: "16px" }}><strong>Generated content:</strong></p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Authority Packs (LinkedIn posts, X threads, newsletters, insights) — stored in your account</li>
            <li>Repurposed content variants</li>
            <li>Publish records (platform, scheduled time, status)</li>
          </ul>

          <p style={{ marginTop: "16px" }}><strong>Usage data:</strong></p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Monthly pack generation counts (for plan limit enforcement)</li>
            <li>Subscription plan and billing status (via Paddle webhooks)</li>
          </ul>

          <p style={{ marginTop: "16px" }}><strong>We do not collect:</strong> IP addresses for tracking, advertising data, behavioral analytics, or device fingerprints.</p>
        </Section>

        <Section id="how-we-use" title="2. How We Use Your Data">
          <p>We use your data solely to provide and improve the Korel service:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Service delivery:</strong> Generating Authority Packs from your inputs, monitoring RSS feeds, publishing content to connected accounts on your instruction</li>
            <li><strong>Plan enforcement:</strong> Tracking usage against your monthly pack limit</li>
            <li><strong>Billing:</strong> Processing subscription payments through Paddle</li>
            <li><strong>Communication:</strong> Sending transactional emails (pack ready notifications, new episode alerts, support responses). We do not send unsolicited marketing emails</li>
            <li><strong>Service improvement:</strong> Aggregate, anonymized usage patterns to improve features (no individual data is used for this)</li>
          </ul>
          <p style={{ marginTop: "12px" }}>We do not sell your data. We do not use your content to train AI models. We do not share your personal data with third parties for advertising purposes.</p>
        </Section>

        <Section id="third-parties" title="3. Third-Party Services">
          <p>Korel uses the following third-party services to provide functionality. Each handles data under their own privacy policies:</p>

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { name: "OpenAI", purpose: "AI content generation. Your input text is sent to OpenAI's API to generate Authority Packs.", policy: "openai.com/policies/privacy-policy" },
              { name: "Anthropic", purpose: "AI content processing (used selectively for certain generation tasks).", policy: "anthropic.com/legal/privacy" },
              { name: "LinkedIn", purpose: "OAuth authentication and direct publishing to your LinkedIn account when you authorize it.", policy: "linkedin.com/legal/privacy-policy" },
              { name: "X (Twitter)", purpose: "OAuth authentication and direct publishing to your X account when you authorize it.", policy: "twitter.com/privacy" },
              { name: "Beehiiv", purpose: "Creating newsletter drafts in your Beehiiv publication when you connect your account.", policy: "beehiiv.com/privacy" },
              { name: "YouTube / Google", purpose: "Resolving YouTube channel URLs and fetching RSS feed metadata. No Google account data is stored.", policy: "policies.google.com/privacy" },
              { name: "Paddle", purpose: "Payment processing for subscriptions. Paddle acts as Merchant of Record and handles billing data under their own policies.", policy: "paddle.com/privacy" },
              { name: "Neon (PostgreSQL)", purpose: "Cloud database hosting for your account data and content. Data is stored in US regions.", policy: "neon.tech/privacy" },
            ].map(({ name, purpose, policy }) => (
              <div key={name} style={{ padding: "16px", backgroundColor: "#F1F5F9", borderRadius: "8px" }}>
                <p style={{ fontWeight: 600, color: "#0F172A", margin: 0 }}>{name}</p>
                <p style={{ margin: "4px 0 0" }}>{purpose}</p>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94A3B8" }}>Privacy policy: {policy}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="retention" title="4. Data Retention">
          <p>We retain your data for as long as your account is active. Specifically:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Account data and generated packs:</strong> Retained until you delete your account</li>
            <li><strong>OAuth tokens:</strong> Retained until you disconnect the integration in Settings → Connections, or delete your account</li>
            <li><strong>Usage counters:</strong> Retained for 24 months for billing and plan enforcement purposes</li>
            <li><strong>Support tickets:</strong> Retained for 24 months</li>
            <li><strong>Billing records:</strong> Retained for 7 years as required by applicable law</li>
          </ul>
          <p style={{ marginTop: "12px" }}>After account deletion, personal data is removed from our systems within 30 days. Billing records may be retained longer to comply with legal obligations.</p>
        </Section>

        <Section id="rights" title="5. Your Rights">
          <p>You have the following rights regarding your data:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
            <li><strong>Correction:</strong> Update your name, email, or other account information in Settings</li>
            <li><strong>Deletion:</strong> Delete your account and all associated data from Settings → Account, or by emailing us</li>
            <li><strong>Disconnection:</strong> Revoke any third-party integration (LinkedIn, X, Beehiiv) at any time from Settings → Connections</li>
            <li><strong>Portability:</strong> Request an export of your generated content (Authority Packs) in JSON format</li>
          </ul>
          <p style={{ marginTop: "12px" }}>To exercise any of these rights, email <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a>. We will respond within 30 days.</p>
        </Section>

        <Section id="cookies" title="6. Cookies">
          <p>Korel uses minimal cookies — only what is strictly necessary to operate the service:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Authentication session cookie:</strong> A JWT session token stored as an HTTP-only cookie to keep you logged in. This is required for the service to function and cannot be disabled.</li>
            <li><strong>CSRF token:</strong> A security cookie used to protect form submissions.</li>
          </ul>
          <p style={{ marginTop: "12px" }}>We do not use advertising cookies, analytics cookies, or tracking pixels. We do not use Google Analytics or similar third-party analytics services.</p>
        </Section>

        <Section id="security" title="7. Security">
          <p>We take reasonable technical and organizational measures to protect your data:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>All data in transit is encrypted via HTTPS/TLS</li>
            <li>Passwords are hashed using bcrypt and never stored in plain text</li>
            <li>Third-party API keys (e.g., Beehiiv) are encrypted at rest using AES-256-GCM</li>
            <li>OAuth tokens are stored encrypted and scoped to minimum required permissions</li>
            <li>Database access is restricted to application servers only</li>
          </ul>
          <p style={{ marginTop: "12px" }}>No system is completely secure. If you believe your account has been compromised, contact us immediately at <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a>.</p>
        </Section>

        <Section id="changes" title="8. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by displaying a notice within the Service at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated policy.</p>
        </Section>

        <Section id="contact" title="9. Contact">
          <p>For any privacy-related questions, data requests, or concerns:</p>
          <div style={{ marginTop: "12px", padding: "16px 20px", backgroundColor: "#F1F5F9", borderRadius: "8px" }}>
            <p style={{ margin: 0 }}><strong>Korel</strong> (operated by Saqib Iqbal)</p>
            <p style={{ margin: "4px 0 0" }}>Email: <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a></p>
            <p style={{ margin: "4px 0 0" }}>Website: <a href="https://usekorel.com" style={{ color: "#6D5EF3" }}>usekorel.com</a></p>
          </div>
          <p style={{ marginTop: "16px" }}>Also see our <Link href="/terms" style={{ color: "#6D5EF3" }}>Terms of Service</Link>.</p>
        </Section>

      </div>
    </div>
  );
}
