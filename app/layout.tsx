import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "KOREL",
  description: "Authority Distribution Engine for B2B Founders",
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
