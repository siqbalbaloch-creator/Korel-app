import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { getServerAuthSession } from "@/lib/auth";

const VALID_EVENT_TYPES = new Set([
  "PAGE_VIEW",
  "CTA_CLICK",
  "PRICING_INTENT_OPEN",
  "PRICING_INTENT_SUBMIT",
]);

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const {
    sessionId: rawSessionId,
    path: rawPath,
    referrer: rawReferrer,
    utmSource: rawUtmSource,
    utmMedium: rawUtmMedium,
    utmCampaign: rawUtmCampaign,
    eventType: rawEventType,
    meta: rawMeta,
  } = body as Record<string, unknown>;

  const sessionId =
    typeof rawSessionId === "string" && rawSessionId.length > 0
      ? rawSessionId.slice(0, 64)
      : null;
  if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  // Rate limit: 30 events per sessionId+IP per minute
  if (!rateLimit(`mkt_evt:${sessionId}:${ip}`, 30, 60_000)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const eventType =
    typeof rawEventType === "string" && VALID_EVENT_TYPES.has(rawEventType)
      ? rawEventType
      : null;
  if (!eventType) return NextResponse.json({ ok: false }, { status: 400 });

  const path = typeof rawPath === "string" ? rawPath.slice(0, 500) : "/";
  const referrer = typeof rawReferrer === "string" ? rawReferrer.slice(0, 500) : null;
  const utmSource = typeof rawUtmSource === "string" ? rawUtmSource.slice(0, 100) : null;
  const utmMedium = typeof rawUtmMedium === "string" ? rawUtmMedium.slice(0, 100) : null;
  const utmCampaign = typeof rawUtmCampaign === "string" ? rawUtmCampaign.slice(0, 100) : null;
  const meta =
    rawMeta !== null &&
    rawMeta !== undefined &&
    typeof rawMeta === "object" &&
    !Array.isArray(rawMeta)
      ? (rawMeta as Prisma.JsonObject)
      : null;

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? null;

  await prisma.marketingEvent.create({
    data: {
      sessionId,
      userId,
      path,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      eventType,
      meta: meta ?? undefined,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
