import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { TrustStrip } from "./components/trust-strip";
import { HowItWorks } from "./components/how-it-works";
import { Transformation } from "./components/transformation";
import { WhatYouGet } from "./components/what-you-get";
import { Pricing } from "./components/pricing";
import { FinalCTA } from "./components/final-cta";
import { Footer } from "./components/footer";

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
      <Navbar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Transformation />
      <WhatYouGet />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
