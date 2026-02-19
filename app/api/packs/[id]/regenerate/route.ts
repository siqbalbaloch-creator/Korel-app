import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDemoUser } from "@/lib/demo-user";
import {
  regenerateLinkedInVariantSafe,
  regenerateXThreadSafe,
  regenerateHooksSafe,
} from "@/lib/packGenerationService";

export const runtime = "nodejs";

type RegenerateBody = {
  section: "linkedin_variant" | "xthread" | "hooks";
  variantIndex?: number;
};

const toJsonObject = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await ensureDemoUser();

  const pack = await prisma.authorityPack.findUnique({
    where: { id, userId: user.id },
  });

  if (!pack) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await request.json()) as RegenerateBody;

  if (body.section === "linkedin_variant") {
    const idx = (body.variantIndex ?? 0) as 0 | 1 | 2;
    const { post, error } = await regenerateLinkedInVariantSafe(pack.originalInput, idx);

    if (error || !post) {
      return NextResponse.json(
        { error: "generation_failed", detail: error },
        { status: 500 },
      );
    }

    const existing = toJsonObject(pack.highLeveragePosts);
    const currentPosts: string[] = Array.isArray(existing.linkedinPosts)
      ? [...(existing.linkedinPosts as string[])]
      : ["", "", ""];
    currentPosts[idx] = post;

    await prisma.authorityPack.update({
      where: { id },
      data: {
        highLeveragePosts: { ...existing, linkedinPosts: currentPosts },
      },
    });

    return NextResponse.json({ variantIndex: idx, post });
  }

  if (body.section === "xthread") {
    const { thread, error } = await regenerateXThreadSafe(pack.originalInput);

    if (error) {
      return NextResponse.json(
        { error: "generation_failed", detail: error },
        { status: 500 },
      );
    }

    const existing = toJsonObject(pack.highLeveragePosts);
    await prisma.authorityPack.update({
      where: { id },
      data: {
        highLeveragePosts: { ...existing, twitterThread: thread },
      },
    });

    return NextResponse.json({ thread });
  }

  if (body.section === "hooks") {
    const { hooks, error } = await regenerateHooksSafe(pack.originalInput);

    if (error) {
      return NextResponse.json(
        { error: "generation_failed", detail: error },
        { status: 500 },
      );
    }

    await prisma.authorityPack.update({
      where: { id },
      data: { strategicHooks: hooks },
    });

    return NextResponse.json({ hooks });
  }

  return NextResponse.json({ error: "invalid_section" }, { status: 400 });
}
