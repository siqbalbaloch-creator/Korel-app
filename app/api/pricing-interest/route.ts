import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

const VALID_PLANS = new Set(["starter", "professional"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  if (!rateLimit(`pricing-interest:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, plan } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (typeof plan !== "string" || !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
  }

  await prisma.pricingInterest.create({
    data: {
      name:  name.trim().slice(0, 200),
      email: email.trim().toLowerCase().slice(0, 320),
      plan,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
