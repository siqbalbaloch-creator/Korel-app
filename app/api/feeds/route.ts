import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateFeed, resolveYouTubeFeedUrl } from "@/lib/rss/rss-monitor.service";
import { getPlanSnapshot } from "@/lib/planGuard";

// GET /api/feeds — list user's feeds with episode counts
export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feeds = await prisma.rssFeed.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { episodes: true } },
    },
  });

  return NextResponse.json({ feeds });
}

// POST /api/feeds — validate and add a new feed
export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { feedUrl: rawUrl, feedName: customName } = (await req.json()) as {
    feedUrl?: string;
    feedName?: string;
  };

  if (!rawUrl?.trim()) {
    return NextResponse.json({ error: "feedUrl is required" }, { status: 400 });
  }

  // Plan-gated feed limit (DB-backed subscription, not session)
  const [snapshot, count] = await Promise.all([
    getPlanSnapshot(session.user.id, session.user.role),
    prisma.rssFeed.count({ where: { userId: session.user.id } }),
  ]);
  const maxFeeds = snapshot.config.maxRssFeeds;
  if (Number.isFinite(maxFeeds) && count >= maxFeeds) {
    return NextResponse.json(
      {
        error:
          maxFeeds === 0
            ? `RSS monitoring isn't included in the ${snapshot.plan} plan. Upgrade to add feeds.`
            : `You've reached your ${snapshot.plan} plan limit of ${maxFeeds} feed${maxFeeds === 1 ? "" : "s"}. Upgrade to add more.`,
        upgradeHint: true,
        plan: snapshot.plan,
        limit: maxFeeds,
        used: count,
      },
      { status: 422 },
    );
  }

  let feedName: string;
  let feedType: "youtube" | "podcast" | "blog";
  let itemCount: number;
  let resolvedUrl: string;

  try {
    resolvedUrl = await resolveYouTubeFeedUrl(rawUrl.trim());
    const validated = await validateFeed(resolvedUrl);
    feedName = customName?.trim() || validated.feedName;
    feedType = validated.feedType;
    itemCount = validated.itemCount;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not fetch feed";
    return NextResponse.json(
      { error: `Invalid feed URL: ${msg}` },
      { status: 422 },
    );
  }

  // Check for duplicate
  const existing = await prisma.rssFeed.findUnique({
    where: { userId_feedUrl: { userId: session.user.id, feedUrl: resolvedUrl } },
  });
  if (existing) {
    return NextResponse.json({ error: "This feed is already added." }, { status: 409 });
  }

  const feed = await prisma.rssFeed.create({
    data: {
      userId: session.user.id,
      feedUrl: resolvedUrl,
      feedName,
      feedType,
      isActive: true,
    },
  });

  return NextResponse.json({ feed, itemCount, feedName }, { status: 201 });
}
