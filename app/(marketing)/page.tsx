import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { SocialProofBar } from "./components/social-proof-bar";
import { HowKorelWorks } from "./components/how-korel-works";
import { BeforeAfter } from "./components/before-after";
import { WhyNotChatGPT } from "./components/WhyNotChatGPT";
import { Pricing } from "./components/pricing";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/final-cta";
import { Footer } from "./components/footer";
import { ScrollOnLoad } from "./components/ScrollOnLoad";
import { FadeInSection } from "./components/FadeInSection";

export const metadata: Metadata = {
  alternates: { canonical: "https://www.usekorel.com" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Korel",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://www.usekorel.com",
  description:
    "AI Agent for B2B Founders. Monitors your podcast and interviews, generates LinkedIn posts, X threads, and newsletters automatically — then publishes while you sleep.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Starter", price: "49", priceCurrency: "USD" },
    { "@type": "Offer", name: "Professional", price: "149", priceCurrency: "USD" },
  ],
  featureList: [
    "Automated podcast and RSS monitoring",
    "LinkedIn authority post generation",
    "X / Twitter thread generation",
    "Beehiiv newsletter integration",
    "Auto-publish to LinkedIn and X",
    "Content calendar and scheduling",
    "Back catalog repurposing",
  ],
};

export default function MarketingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#F6F7FB",
        position: "relative",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <ScrollOnLoad />
      </Suspense>
      <Navbar />
      <Hero />
      <FadeInSection><SocialProofBar /></FadeInSection>
      <FadeInSection><HowKorelWorks /></FadeInSection>
      <FadeInSection><BeforeAfter /></FadeInSection>
      <FadeInSection><WhyNotChatGPT /></FadeInSection>
      <FadeInSection><Pricing /></FadeInSection>
      <FadeInSection><FAQ /></FadeInSection>
      <FadeInSection><FinalCTA /></FadeInSection>
      <Footer />
    </div>
  );
}
