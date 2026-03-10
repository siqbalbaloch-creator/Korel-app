import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishToLinkedIn } from "@/lib/publishers/linkedin";
import { publishToX } from "@/lib/publishers/x";
import { getValidLinkedInToken, getValidXToken } from "@/lib/publishers/refresh";

// Called by Vercel Cron every 30 minutes
// Authorization: Vercel passes CRON_SECRET in Authorization header
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all records due for publishing
  const due = await prisma.publishRecord.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: now },
    },
    select: {
      id: true,
      userId: true,
      platform: true,
      content: true,
    },
  });

  const results: { id: string; status: string; error?: string }[] = [];

  for (const record of due) {
    let postId: string | null = null;
    let postUrl: string | null = null;
    let status = "published";
    let errorMessage: string | null = null;

    try {
      if (record.platform === "linkedin") {
        const { accessToken, platformUserId } = await getValidLinkedInToken(record.userId);
        const result = await publishToLinkedIn(accessToken, platformUserId, record.content);
        postId = result.postId;
        postUrl = result.postUrl;
      } else if (record.platform === "x") {
        const accessToken = await getValidXToken(record.userId);
        const result = await publishToX(accessToken, record.content);
        postId = result.tweetId;
        postUrl = result.tweetUrl;
      }
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    await prisma.publishRecord.update({
      where: { id: record.id },
      data: {
        status,
        postId,
        postUrl,
        errorMessage,
        publishedAt: status === "published" ? new Date() : null,
      },
    });

    results.push({ id: record.id, status, error: errorMessage ?? undefined });
  }

  return NextResponse.json({ processed: results.length, results });
}
