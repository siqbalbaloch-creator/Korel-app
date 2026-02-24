import { MarketingEventLogger } from "./components/MarketingEventLogger";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingEventLogger />
      {children}
    </>
  );
}
