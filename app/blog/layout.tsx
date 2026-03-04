import type { Metadata } from "next";
import { Navbar } from "../(marketing)/components/navbar";
import { Footer } from "../(marketing)/components/footer";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#F6F7FB",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
