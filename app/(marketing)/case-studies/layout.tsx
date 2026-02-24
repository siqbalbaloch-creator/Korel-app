import type { ReactNode } from "react";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

export default function CaseStudiesLayout({ children }: { children: ReactNode }) {
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
      <main>{children}</main>
      <Footer />
    </div>
  );
}
