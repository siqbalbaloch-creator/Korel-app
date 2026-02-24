import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { WaitlistStatus, WaitlistInterestQuality } from "@prisma/client";

const VALID_STATUSES = new Set<WaitlistStatus>([
  WaitlistStatus.ACTIVE,
  WaitlistStatus.CONTACTED,
  WaitlistStatus.CONVERTED,
  WaitlistStatus.REMOVED,
]);

const VALID_QUALITIES = new Set<WaitlistInterestQuality>([
  WaitlistInterestQuality.UNREVIEWED,
  WaitlistInterestQuality.LOW,
  WaitlistInterestQuality.MEDIUM,
  WaitlistInterestQuality.HIGH,
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  if (!rateLimit(`waitlist-patch:${session.user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    status: rawStatus,
    notes: rawNotes,
    interestQuality: rawQuality,
  } = body as Record<string, unknown>;

  // Validate status if provided
  const status =
    rawStatus !== undefined
      ? VALID_STATUSES.has(rawStatus as WaitlistStatus)
        ? (rawStatus as WaitlistStatus)
        : null
      : undefined;

  if (status === null) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  // Validate interestQuality if provided
  const interestQuality =
    rawQuality !== undefined
      ? VALID_QUALITIES.has(rawQuality as WaitlistInterestQuality)
        ? (rawQuality as WaitlistInterestQuality)
        : null
      : undefined;

  if (interestQuality === null) {
    return NextResponse.json({ error: "Invalid interestQuality value." }, { status: 400 });
  }

  const notes =
    rawNotes !== undefined
      ? typeof rawNotes === "string"
        ? rawNotes.trim().slice(0, 2000)
        : null
      : undefined;

  // Confirm entry exists
  const existing = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const entry = await prisma.waitlistEntry.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(interestQuality !== undefined ? { interestQuality } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  logger.info("waitlist.admin.patch", {
    adminId: session.user.id,
    entryId: id,
    status,
    interestQuality,
    hasNotes: !!notes,
  });

  return NextResponse.json({ ok: true, entry });
}
