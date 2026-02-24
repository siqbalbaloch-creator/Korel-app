import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

const VALID_PLANS = new Set(["starter", "professional"]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  if (!rateLimit(`pricing-click:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { plan } = body as Record<string, unknown>;

  if (typeof plan !== "string" || !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await prisma.pricingClick.create({ data: { plan } });

  return NextResponse.json({ success: true }, { status: 201 });
}
