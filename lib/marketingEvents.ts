const SESSION_KEY = "korel_sid";

function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

export type MarketingEventType =
  | "PAGE_VIEW"
  | "CTA_CLICK"
  | "PRICING_INTENT_OPEN"
  | "PRICING_INTENT_SUBMIT";

export async function logMarketingEvent(
  eventType: MarketingEventType,
  meta?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const sessionId = getSessionId();
    if (!sessionId) return;
    const params = new URLSearchParams(window.location.search);
    await fetch("/api/marketing/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        path: window.location.pathname,
        referrer: document.referrer || null,
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
        eventType,
        meta: meta ?? null,
      }),
    });
  } catch {
    // fire-and-forget — ignore errors
  }
}
