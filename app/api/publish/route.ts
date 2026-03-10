import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishToLinkedIn } from "@/lib/publishers/linkedin";
import { publishToX } from "@/lib/publishers/x";
import { getValidLinkedInToken, getValidXToken } from "@/lib/publishers/refresh";

type PublishBody = {
  packId: string;
  platform: "linkedin" | "x";
  scheduledFor?: string; // ISO string
};

function serializeRecord(r: {
  id: string;
  status: string;
  postUrl: string | null;
  postId: string | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
}) {
  return {
    id: r.id,
    status: r.status,
    postUrl: r.postUrl,
    postId: r.postId,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    scheduledFor: r.scheduledFor?.toISOString() ?? null,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { packId, platform, scheduledFor } = body;

  if (!packId || !platform || !["linkedin", "x"].includes(platform)) {
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }

  // Verify the pack belongs to this user
  const pack = await prisma.authorityPack.findFirst({
    where: { id: packId, userId },
    select: {
      id: true,
      highLeveragePosts: true,
    },
  });

  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  // Extract the right content for this platform
  const postsJson = pack.highLeveragePosts as Record<string, unknown> | null;
  let content = "";
  if (platform === "linkedin") {
    const posts = postsJson?.linkedinPosts;
    content = Array.isArray(posts) && posts.length > 0 ? String(posts[0]) : "";
  } else {
    const thread = postsJson?.twitterThread;
    content = Array.isArray(thread) && thread.length > 0 ? String(thread[0]) : "";
  }

  if (!content) {
    return NextResponse.json(
      { error: "No content found in this pack for the selected platform." },
      { status: 422 },
    );
  }

  // --- Scheduled publish ---
  if (scheduledFor) {
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "scheduledFor must be a valid future date." },
        { status: 400 },
      );
    }

    const record = await prisma.publishRecord.create({
      data: {
        userId,
        packId,
        platform,
        content,
        status: "scheduled",
        scheduledFor: scheduledDate,
      },
      select: {
        id: true,
        status: true,
        postUrl: true,
        postId: true,
        publishedAt: true,
        scheduledFor: true,
      },
    });

    return NextResponse.json({ record: serializeRecord(record) });
  }

  // --- Immediate publish ---
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

  const record = await prisma.publishRecord.create({
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
    select: {
      id: true,
      status: true,
      postUrl: true,
      postId: true,
      publishedAt: true,
      scheduledFor: true,
    },
  });

  if (status === "failed") {
    return NextResponse.json(
      { error: errorMessage ?? "Publish failed", record: serializeRecord(record) },
      { status: 502 },
    );
  }

  return NextResponse.json({ record: serializeRecord(record) });
}
