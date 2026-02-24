import { prisma } from "./prisma";

export type UtmRow = {
  source: string | null;
  campaign: string | null;
  count: number;
};

export type MarketingAnalytics = {
  pageViews7d: number;
  pageViews30d: number;
  landingViews30d: number;
  ctaClicks7d: number;
  ctaClicks30d: number;
  intentOpens7d: number;
  intentOpens30d: number;
  intentSubmits7d: number;
  intentSubmits30d: number;
  topUtm: UtmRow[];
};

export async function getMarketingAnalytics(): Promise<MarketingAnalytics> {
  const now = new Date();
  const ago7 = new Date(now);
  ago7.setDate(ago7.getDate() - 7);
  const ago30 = new Date(now);
  ago30.setDate(ago30.getDate() - 30);

  const [
    pageViews7d,
    pageViews30d,
    landingViews30d,
    ctaClicks7d,
    ctaClicks30d,
    intentOpens7d,
    intentOpens30d,
    intentSubmits7d,
    intentSubmits30d,
    utmRaw,
  ] = await Promise.all([
    prisma.marketingEvent.count({
      where: { eventType: "PAGE_VIEW", createdAt: { gte: ago7 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "PAGE_VIEW", createdAt: { gte: ago30 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "PAGE_VIEW", path: "/", createdAt: { gte: ago30 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "CTA_CLICK", createdAt: { gte: ago7 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "CTA_CLICK", createdAt: { gte: ago30 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "PRICING_INTENT_OPEN", createdAt: { gte: ago7 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "PRICING_INTENT_OPEN", createdAt: { gte: ago30 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "PRICING_INTENT_SUBMIT", createdAt: { gte: ago7 } },
    }),
    prisma.marketingEvent.count({
      where: { eventType: "PRICING_INTENT_SUBMIT", createdAt: { gte: ago30 } },
    }),
    prisma.marketingEvent.groupBy({
      by: ["utmSource", "utmCampaign"],
      where: {
        createdAt: { gte: ago30 },
        utmSource: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  return {
    pageViews7d,
    pageViews30d,
    landingViews30d,
    ctaClicks7d,
    ctaClicks30d,
    intentOpens7d,
    intentOpens30d,
    intentSubmits7d,
    intentSubmits30d,
    topUtm: utmRaw.map((row) => ({
      source: row.utmSource,
      campaign: row.utmCampaign,
      count: row._count.id,
    })),
  };
}
