import "./globals.css";

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
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
