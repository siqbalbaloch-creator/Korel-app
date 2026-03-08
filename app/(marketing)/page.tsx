import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { HowKorelWorks } from "./components/how-korel-works";
import { Pricing } from "./components/pricing";
import { WhyNotChatGPT } from "./components/WhyNotChatGPT";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/final-cta";
import { Footer } from "./components/footer";
import { ScrollOnLoad } from "./components/ScrollOnLoad";
import { ExampleAuthorityContent } from "./components/example-authority-content";
import { DemoAuthorityPack } from "./components/DemoAuthorityPack";

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
    "Authority Distribution Engine for B2B Founders. Turn founder interviews and thought leadership into LinkedIn posts, X threads, and newsletters — automatically.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Starter", price: "49", priceCurrency: "USD" },
    { "@type": "Offer", name: "Professional", price: "149", priceCurrency: "USD" },
  ],
  featureList: [
    "Strategic Authority Map (SAM) generation",
    "LinkedIn platform-ready assets",
    "X / Twitter thread generation",
    "Newsletter format output",
    "Messaging Strength evaluation",
    "Authority Consistency tracking",
    "Weakness Radar insights",
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
      <DemoAuthorityPack />
      <HowKorelWorks />
      <ExampleAuthorityContent />
      <WhyNotChatGPT />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
