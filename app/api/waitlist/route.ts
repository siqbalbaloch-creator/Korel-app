import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { apiError } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { getServerAuthSession } from "@/lib/auth";
import { WaitlistPlan, WaitlistSource } from "@prisma/client";

const VALID_PLANS = new Set<WaitlistPlan>([
  WaitlistPlan.STARTER,
  WaitlistPlan.PROFESSIONAL,
  WaitlistPlan.ENTERPRISE,
]);

const VALID_SOURCES = new Set<WaitlistSource>([
  WaitlistSource.PRICING,
  WaitlistSource.NAVBAR,
  WaitlistSource.UPGRADE,
  WaitlistSource.UNKNOWN,
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(`waitlist:${ip}`, 5, 60_000)) {
    return apiError("Too many requests — please try again shortly.", "RATE_LIMITED", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid request body.", "INVALID_INPUT", 400);
  }

  const {
    plan: rawPlan,
    fullName: rawFullName,
    email: rawEmail,
    source: rawSource,
  } = body as Record<string, unknown>;

  // Validate plan
  const plan =
    typeof rawPlan === "string" && VALID_PLANS.has(rawPlan as WaitlistPlan)
      ? (rawPlan as WaitlistPlan)
      : null;
  if (!plan) {
    return apiError("Invalid plan.", "INVALID_INPUT", 400);
  }

  // Validate source (optional — default to PRICING)
  const source: WaitlistSource =
    typeof rawSource === "string" && VALID_SOURCES.has(rawSource as WaitlistSource)
      ? (rawSource as WaitlistSource)
      : WaitlistSource.PRICING;

  // Sanitize fullName
  const fullName =
    typeof rawFullName === "string" && rawFullName.trim().length > 0
      ? rawFullName.trim().slice(0, 200)
      : undefined;

  // Auth: prefer logged-in email
  const session = await getServerAuthSession();
  let email: string;
  let userId: string | undefined;

  if (session?.user?.email) {
    // Logged-in: use session email, ignore any body email
    email = session.user.email.trim().toLowerCase();
    userId = session.user.id ?? undefined;
  } else {
    // Logged-out: email is required
    if (typeof rawEmail !== "string" || !EMAIL_RE.test(rawEmail.trim())) {
      return apiError("A valid email address is required.", "MISSING_FIELDS", 400);
    }
    email = rawEmail.trim().toLowerCase().slice(0, 320);
  }

  // Idempotent find-then-create
  const existing = await prisma.waitlistEntry.findUnique({
    where: { email_plan: { email, plan } },
  });

  if (existing) {
    logger.info("waitlist.duplicate", {
      plan,
      source,
      authed: !!session?.user?.id,
      status: existing.status,
    });

    return NextResponse.json(
      {
        ok: true,
        alreadyExists: true,
        plan: existing.plan,
        status: existing.status,
      },
      { status: 200 },
    );
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      email,
      plan,
      source,
      fullName: fullName ?? null,
      userId: userId ?? null,
      submitCount: 1,
      lastSubmittedAt: new Date(),
    },
  });

  logger.info("waitlist.submit", {
    plan,
    source,
    authed: !!session?.user?.id,
  });

  return NextResponse.json(
    {
      ok: true,
      alreadyExists: false,
      plan: entry.plan,
      status: entry.status,
    },
    { status: 201 },
  );
}
