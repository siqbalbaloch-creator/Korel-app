import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://www.usekorel.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Korel — Authority Distribution Engine for B2B Founders",
    template: "%s | Korel",
  },
  description:
    "Turn founder interviews, podcast appearances, and thought leadership into LinkedIn posts, X threads, and newsletters. Korel structures your authority and distributes it across platforms automatically.",
  keywords: [
    "authority marketing",
    "thought leadership",
    "B2B founders",
    "LinkedIn content automation",
    "content distribution",
    "personal branding",
    "founder marketing",
    "content repurposing",
    "authority building",
    "Strategic Authority Map",
  ],
  authors: [{ name: "Korel", url: SITE_URL }],
  creator: "Korel",
  publisher: "Korel",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Korel",
    title: "Korel — Authority Distribution Engine for B2B Founders",
    description:
      "Turn founder interviews and thought leadership into LinkedIn posts, X threads, and newsletters. Structured authority, automatically distributed.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Korel — Authority Distribution Engine for B2B Founders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Korel — Authority Distribution Engine for B2B Founders",
    description:
      "Turn founder interviews and thought leadership into LinkedIn posts, X threads, and newsletters. Structured authority, automatically distributed.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-zinc-50 text-zinc-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
