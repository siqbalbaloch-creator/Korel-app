import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Korel",
  description: "Terms of Service for Korel, the AI Authority Distribution Engine.",
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

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "15px", marginTop: "12px" }}>
            Effective date: March 10, 2026 &nbsp;·&nbsp; Operated by Saqib Iqbal
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "56px 24px 80px" }}>

        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>By accessing or using Korel ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms form a legally binding agreement between you and Korel, operated by Saqib Iqbal ("we," "us," or "our").</p>
          <p style={{ marginTop: "12px" }}>Korel is operated by Saqib Iqbal, an individual operator based in Abu Dhabi, United Arab Emirates. The legal operator name is Saqib Iqbal trading as Korel.</p>
          <p style={{ marginTop: "12px" }}>We may update these Terms at any time. Continued use of the Service after changes are posted constitutes your acceptance of the updated Terms. We will notify you of material changes via email or an in-app notice.</p>
        </Section>

        <Section id="description" title="2. Description of Service">
          <p>Korel is an AI-powered Authority Distribution Engine designed for B2B founders. The Service includes:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>AI content generation from founder inputs (YouTube transcripts, interviews, strategy memos, and other long-form text)</li>
            <li>Structured "Authority Packs" containing LinkedIn posts, X/Twitter threads, and newsletter content</li>
            <li>Direct publishing and scheduling to LinkedIn and X (Twitter) via connected OAuth accounts</li>
            <li>Beehiiv newsletter integration for draft creation</li>
            <li>RSS feed and YouTube channel monitoring with automated pack generation</li>
            <li>Back catalog repurposing tools</li>
            <li>Content calendar and scheduling management</li>
          </ul>
          <p style={{ marginTop: "12px" }}>Korel is a fully automated AI software service. Content generation, publishing, and distribution are performed entirely by automated AI systems. No human operators are involved in reviewing, editing, or approving individual content outputs. Users review and approve all content before publishing through the Korel interface.</p>
          <p style={{ marginTop: "12px" }}>We reserve the right to modify, suspend, or discontinue any feature of the Service at any time with reasonable notice.</p>
        </Section>

        <Section id="accounts" title="3. User Accounts and Registration">
          <p>To use Korel, you must create an account using a valid email address or a supported OAuth provider (Google). You are responsible for:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activity that occurs under your account</li>
            <li>Providing accurate and complete registration information</li>
            <li>Notifying us immediately of any unauthorized access to your account</li>
          </ul>
          <p style={{ marginTop: "12px" }}>You must be at least 18 years old to create an account. Accounts are personal and may not be transferred to another individual without our prior written consent.</p>
        </Section>

        <Section id="billing" title="4. Subscription and Billing">
          <p>Paid plans are billed on a monthly or annual basis. Payments are processed by <strong>Paddle</strong>, our authorized reseller and payment processor. By subscribing to a paid plan, you agree to Paddle's terms of service and authorize recurring charges to your payment method.</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Subscriptions renew automatically unless cancelled before the renewal date</li>
            <li>All prices are listed in USD unless otherwise stated</li>
            <li>We reserve the right to change pricing with 30 days notice to existing subscribers</li>
            <li>Downgrading your plan may result in loss of access to premium features and content above your plan limits</li>
            <li>You may cancel your subscription at any time through your Billing settings; access continues until the end of the current billing period</li>
          </ul>
        </Section>

        <Section id="trial" title="5. Free Trial and Paid Plans">
          <p>New accounts receive a free tier with limited pack generation capacity. Free accounts are subject to monthly usage limits as described on our pricing page.</p>
          <p style={{ marginTop: "12px" }}>Paid plans (Pro, Enterprise) unlock higher usage limits, back catalog repurposing, RSS monitoring, and other premium features. Feature availability is determined by your active plan at the time of use.</p>
          <p style={{ marginTop: "12px" }}>We may offer promotional free trials for paid plans. At the end of any free trial, you will be charged the applicable subscription fee unless you cancel before the trial expires.</p>
        </Section>

        <Section id="aup" title="6. Acceptable Use Policy">
          <p>You agree not to use Korel to:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Generate, distribute, or publish content that is defamatory, harassing, threatening, obscene, or illegal</li>
            <li>Violate the terms of service of LinkedIn, X (Twitter), Beehiiv, YouTube, or any other connected third-party platform</li>
            <li>Infringe upon the intellectual property rights of any third party</li>
            <li>Attempt to circumvent usage limits, subscription gating, or other service restrictions</li>
            <li>Reverse-engineer, scrape, or create derivative works from the Korel platform</li>
            <li>Use automated means to access the Service beyond its intended API surface</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Distribute spam, unsolicited commercial messages, or misleading content</li>
          </ul>
          <p style={{ marginTop: "12px" }}>We reserve the right to suspend or terminate accounts that violate these policies without prior notice.</p>
        </Section>

        <Section id="ip" title="7. Intellectual Property">
          <p><strong>Your content:</strong> You retain full ownership of any content you submit to Korel (transcripts, documents, input text) and any content generated from your inputs ("Authority Packs"). By using the Service, you grant Korel a limited, non-exclusive, royalty-free license to process your inputs and generated outputs solely to provide and improve the Service.</p>
          <p style={{ marginTop: "12px" }}><strong>Our platform:</strong> Korel, its software, design, branding, algorithms, and all related technology are the exclusive property of Saqib Iqbal and are protected by applicable intellectual property laws. Nothing in these Terms grants you a right to the Korel platform itself.</p>
          <p style={{ marginTop: "12px" }}>We will not use your content to train AI models or sell your data to third parties.</p>
        </Section>

        <Section id="privacy" title="8. Data and Privacy">
          <p>Your use of Korel is also governed by our <Link href="/privacy" style={{ color: "#6D5EF3" }}>Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Service, you consent to the data practices described in the Privacy Policy.</p>
        </Section>

        <Section id="third-party" title="9. Third-Party Services">
          <p>Korel integrates with third-party platforms including LinkedIn, X (Twitter), Beehiiv, YouTube, OpenAI, and Anthropic. Your use of these integrations is subject to those platforms' own terms and privacy policies:</p>
          <ul style={{ marginTop: "12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>LinkedIn: linkedin.com/legal/user-agreement</li>
            <li>X (Twitter): twitter.com/tos</li>
            <li>Beehiiv: beehiiv.com/tou</li>
            <li>YouTube: youtube.com/t/terms</li>
            <li>OpenAI: openai.com/policies/terms-of-use</li>
            <li>Anthropic: anthropic.com/legal/consumer-terms</li>
            <li>Paddle: paddle.com/legal/terms-of-use</li>
          </ul>
          <p style={{ marginTop: "12px" }}>We are not responsible for the actions, content, or availability of third-party services. Disconnecting a third-party integration from Korel does not affect data held by that third party.</p>
        </Section>

        <Section id="warranties" title="10. Disclaimer of Warranties">
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.</p>
          <p style={{ marginTop: "12px" }}>AI-generated content may contain inaccuracies, inconsistencies, or errors. You are solely responsible for reviewing, editing, and approving any content before publishing it to third-party platforms.</p>
        </Section>

        <Section id="liability" title="11. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KOREL AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, REPUTATIONAL HARM, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.</p>
          <p style={{ marginTop: "12px" }}>OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD $50.</p>
        </Section>

        <Section id="termination" title="12. Termination">
          <p>You may terminate your account at any time by contacting us at <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a> or through your account settings.</p>
          <p style={{ marginTop: "12px" }}>We reserve the right to suspend or terminate your account at any time for violation of these Terms, non-payment, or any conduct we determine to be harmful to the Service or other users. Upon termination, your right to access the Service ceases immediately.</p>
          <p style={{ marginTop: "12px" }}>Upon account deletion, your data will be removed from our systems within 30 days, subject to applicable legal retention requirements.</p>
        </Section>

        <Section id="governing-law" title="13. Governing Law">
          <p>These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, specifically the laws of the Emirate of Abu Dhabi. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Abu Dhabi, UAE.</p>
        </Section>

        <Section id="contact" title="14. Contact">
          <p>If you have any questions about these Terms, please contact us:</p>
          <div style={{ marginTop: "12px", padding: "16px 20px", backgroundColor: "#F1F5F9", borderRadius: "8px" }}>
            <p style={{ margin: 0 }}><strong>Korel</strong> (operated by Saqib Iqbal)</p>
            <p style={{ margin: "4px 0 0" }}>Email: <a href="mailto:siqbalbaloch@gmail.com" style={{ color: "#6D5EF3" }}>siqbalbaloch@gmail.com</a></p>
            <p style={{ margin: "4px 0 0" }}>Website: <a href="https://usekorel.com" style={{ color: "#6D5EF3" }}>usekorel.com</a></p>
          </div>
        </Section>
      </div>
    </div>
  );
}
