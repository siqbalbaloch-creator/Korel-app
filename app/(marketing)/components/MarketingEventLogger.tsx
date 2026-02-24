"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logMarketingEvent } from "@/lib/marketingEvents";

function isMarketingPath(path: string): boolean {
  return (
    path === "/" ||
    path.startsWith("/docs") ||
    path.startsWith("/case-studies") ||
    path === "/pricing" ||
    path === "/how-it-works"
  );
}

export function MarketingEventLogger() {
  const pathname = usePathname();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!isMarketingPath(pathname)) return;
    if (lastLogged.current === pathname) return;
    lastLogged.current = pathname;
    void logMarketingEvent("PAGE_VIEW", { page: pathname });
  }, [pathname]);

  return null;
}
