import { Suspense } from "react";
import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { TrustStrip } from "./components/trust-strip";
import { HowItWorks } from "./components/how-it-works";
import { Transformation } from "./components/transformation";
import { WhatYouGet } from "./components/what-you-get";
import { Pricing } from "./components/pricing";
import { WhyNotChatGPT } from "./components/WhyNotChatGPT";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/final-cta";
import { Footer } from "./components/footer";
import { ScrollOnLoad } from "./components/ScrollOnLoad";

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
      <Suspense fallback={null}>
        <ScrollOnLoad />
      </Suspense>
      <Navbar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Transformation />
      <WhatYouGet />
      <Pricing />
      <WhyNotChatGPT />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
