import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishToLinkedIn } from "@/lib/publishers/linkedin";
import { publishToX } from "@/lib/publishers/x";
import { getValidLinkedInToken, getValidXToken } from "@/lib/publishers/refresh";

type Body = {
  platform: "linkedin" | "x";
  content: string;
  approveToken?: string;
  scheduledFor?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packId: string }> },
) {
  const { packId } = await params;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { platform, content, approveToken, scheduledFor } = body;

  if (!packId || !platform || !["linkedin", "x"].includes(platform)) {
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Find the pack
  const pack = await prisma.authorityPack.findUnique({
    where: { id: packId },
    select: { id: true, userId: true, approveToken: true },
  });

  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  // Auth: token-based or session-based
  let userId: string | null = null;

  if (approveToken && pack.approveToken && approveToken === pack.approveToken) {
    userId = pack.userId;
  } else {
    const session = await getServerAuthSession();
    if (session?.user?.id === pack.userId) {
      userId = session.user.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Scheduled publish
  if (scheduledFor) {
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "scheduledFor must be a valid future date." },
        { status: 400 },
      );
    }

    const record = await prisma.publishRecord.create({
      data: { userId, packId, platform, content, status: "scheduled", scheduledFor: scheduledDate },
    });

    return NextResponse.json({ scheduledFor: record.scheduledFor?.toISOString() });
  }

  // Immediate publish
  let postId: string | null = null;
  let postUrl: string | null = null;
  let errorMessage: string | null = null;
  let status = "published";

  try {
    if (platform === "linkedin") {
      const { accessToken, platformUserId } = await getValidLinkedInToken(userId);
      const result = await publishToLinkedIn(accessToken, platformUserId, content);
      postId = result.postId;
      postUrl = result.postUrl;
    } else {
      const accessToken = await getValidXToken(userId);
      const result = await publishToX(accessToken, content);
      postId = result.tweetId;
      postUrl = result.tweetUrl;
    }
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  await prisma.publishRecord.create({
    data: {
      userId,
      packId,
      platform,
      content,
      postId,
      postUrl,
      status,
      errorMessage,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  if (status === "failed") {
    return NextResponse.json(
      { error: errorMessage ?? "Publish failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ postUrl });
}
