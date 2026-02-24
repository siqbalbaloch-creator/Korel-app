import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_CORE_THESIS = 500;
const MAX_POSITIONING = 500;
const MAX_TARGET_AUDIENCE = 200;
const MAX_TONE_NOTES = 280;

const VALID_TONES = new Set(["MEASURED", "BOLD", "DIRECT", "ACADEMIC", "FRIENDLY"]);

export async function GET() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await prisma.authorityProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile: profile ?? null });
}

export async function PUT(request: Request) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const coreThesis = typeof body.coreThesis === "string" ? body.coreThesis.trim() : "";
  const positioning = typeof body.positioning === "string" ? body.positioning.trim() : "";
  const targetAudience = typeof body.targetAudience === "string" ? body.targetAudience.trim() : "";
  const rawTone = typeof body.tone === "string" ? body.tone.trim() : "MEASURED";
  const tone = VALID_TONES.has(rawTone) ? rawTone : "MEASURED";
  const toneNotes = typeof body.toneNotes === "string" ? body.toneNotes.trim() : "";

  if (coreThesis.length > MAX_CORE_THESIS) {
    return NextResponse.json({ error: "core_thesis_too_long", max: MAX_CORE_THESIS }, { status: 400 });
  }
  if (positioning.length > MAX_POSITIONING) {
    return NextResponse.json({ error: "positioning_too_long", max: MAX_POSITIONING }, { status: 400 });
  }
  if (targetAudience.length > MAX_TARGET_AUDIENCE) {
    return NextResponse.json({ error: "target_audience_too_long", max: MAX_TARGET_AUDIENCE }, { status: 400 });
  }
  if (toneNotes.length > MAX_TONE_NOTES) {
    return NextResponse.json({ error: "tone_notes_too_long", max: MAX_TONE_NOTES }, { status: 400 });
  }

  const profile = await prisma.authorityProfile.upsert({
    where: { userId },
    create: {
      userId,
      coreThesis: coreThesis || null,
      positioning: positioning || null,
      targetAudience: targetAudience || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tone: tone as any,
      toneNotes: toneNotes || null,
    },
    update: {
      coreThesis: coreThesis || null,
      positioning: positioning || null,
      targetAudience: targetAudience || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tone: tone as any,
      toneNotes: toneNotes || null,
    },
  });

  return NextResponse.json({ profile });
}
