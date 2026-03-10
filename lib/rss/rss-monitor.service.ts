import Parser from "rss-parser";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateAuthorityPack } from "@/lib/packGenerationService";
import { calculateQualityScore } from "@/lib/calculateQualityScore";
import { incrementPackUsage } from "@/lib/planGuard";
import { getCurrentUsagePeriod } from "@/lib/usagePeriod";
import { getUserPlan } from "@/lib/getUserPlan";
import { notifyFounderPackReady, notifyFounderNeedsTranscript } from "./rss-notifications";
import { Prisma } from "@prisma/client";

const parser = new Parser({
  customFields: {
    item: [
      ["yt:videoId", "ytVideoId"],
      ["media:group", "mediaGroup"],
    ],
  },
});

type FeedWithUser = Prisma.RssFeedGetPayload<{ include: { user: true } }>;

/** Extract YouTube video ID from a YouTube RSS item */
function extractYouTubeVideoId(item: Parser.Item & { ytVideoId?: string; id?: string }): string | null {
  if (item.ytVideoId) return item.ytVideoId;
  // id looks like "yt:video:VIDEO_ID"
  const id = item.id ?? "";
  const match = id.match(/yt:video:(.+)/);
  return match ? match[1] : null;
}

/** Convert a YouTube channel URL or handle to an RSS feed URL */
export async function resolveYouTubeFeedUrl(input: string): Promise<string> {
  // Already an RSS feed URL
  if (input.includes("youtube.com/feeds/videos.xml")) return input;

  // Extract channel ID from URL formats
  const channelIdMatch = input.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (channelIdMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
  }

  // @handle format — fetch the page to find channelId
  const handleMatch = input.match(/youtube\.com\/@([\w-]+)/);
  if (handleMatch) {
    const res = await fetch(`https://www.youtube.com/@${handleMatch[1]}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const cidMatch = html.match(/"channelId":"(UC[\w-]+)"/);
    if (cidMatch) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${cidMatch[1]}`;
    }
  }

  // Not a YouTube URL — return as-is (regular RSS/podcast feed)
  return input;
}

/** Validate a feed URL and return its name + type */
export async function validateFeed(url: string): Promise<{
  feedName: string;
  feedType: "youtube" | "podcast" | "blog";
  itemCount: number;
}> {
  const resolvedUrl = await resolveYouTubeFeedUrl(url);
  const feed = await parser.parseURL(resolvedUrl);

  const feedName = feed.title ?? "Untitled Feed";
  const itemCount = feed.items.length;
  const feedType = resolvedUrl.includes("youtube.com/feeds") ? "youtube" : "podcast";

  return { feedName, feedType, itemCount };
}

/** Check all active feeds for all users — called by daily cron */
export async function checkAllFeeds(): Promise<{
  feedsChecked: number;
  newEpisodes: number;
  packsGenerated: number;
}> {
  const feeds = await prisma.rssFeed.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  let newEpisodes = 0;
  let packsGenerated = 0;

  for (const feed of feeds) {
    try {
      const result = await checkFeed(feed);
      if (result.newEpisode) newEpisodes++;
      if (result.packGenerated) packsGenerated++;
    } catch (err) {
      console.error(`[rss] Feed check failed for ${feed.feedUrl}:`, err);
    }
    // Rate-limit feed fetching
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { feedsChecked: feeds.length, newEpisodes, packsGenerated };
}

async function checkFeed(feed: FeedWithUser): Promise<{
  newEpisode: boolean;
  packGenerated: boolean;
}> {
  const resolvedUrl = await resolveYouTubeFeedUrl(feed.feedUrl);
  const parsed = await parser.parseURL(resolvedUrl);
  const latest = parsed.items[0] as Parser.Item & { ytVideoId?: string; id?: string };

  if (!latest) return { newEpisode: false, packGenerated: false };

  const guid = latest.guid ?? latest.id ?? latest.link ?? "";
  if (!guid) return { newEpisode: false, packGenerated: false };

  // Dedup — already processed this episode
  if (feed.lastEpisodeGuid === guid) {
    await prisma.rssFeed.update({
      where: { id: feed.id },
      data: { lastCheckedAt: new Date() },
    });
    return { newEpisode: false, packGenerated: false };
  }

  // Dedup — already in DB
  const existing = await prisma.rssEpisode.findUnique({
    where: { feedId_guid: { feedId: feed.id, guid } },
  });
  if (existing) return { newEpisode: false, packGenerated: false };

  // Build episode data
  const videoId =
    feed.feedType === "youtube" ? extractYouTubeVideoId(latest) : null;
  const youtubeUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : null;
  const audioUrl = (latest.enclosure as { url?: string } | undefined)?.url ?? null;
  const description =
    latest.contentSnippet ?? latest.content ?? latest.summary ?? "";

  const episode = await prisma.rssEpisode.create({
    data: {
      feedId: feed.id,
      guid,
      title: latest.title ?? "Untitled",
      description,
      audioUrl,
      youtubeUrl,
      publishedAt: latest.pubDate ? new Date(latest.pubDate) : null,
      status: "discovered",
    },
  });

  await prisma.rssFeed.update({
    where: { id: feed.id },
    data: {
      lastCheckedAt: new Date(),
      lastEpisodeGuid: guid,
      lastEpisodeTitle: latest.title ?? null,
    },
  });

  // Determine content to generate pack from
  let packInput: string;
  if (feed.feedType === "youtube" && youtubeUrl) {
    packInput = youtubeUrl; // generateAuthorityPack handles transcript fetch
  } else {
    // Podcast: use show notes / description
    const content = latest.content ?? latest.contentSnippet ?? description;
    packInput = content;
  }

  // For YouTube feeds packInput is a URL — transcript is fetched inside generateAuthorityPack.
  // Only apply the length gate for podcast/blog feeds where show notes are used directly.
  if (feed.feedType !== "youtube" && packInput.trim().length < 200) {
    await prisma.rssEpisode.update({
      where: { id: episode.id },
      data: { status: "needs_transcript" },
    });
    await notifyFounderNeedsTranscript(feed.user, episode, feed);
    return { newEpisode: true, packGenerated: false };
  }

  // Check plan limits before generating
  const planInfo = await getUserPlan(feed.userId, { role: feed.user.role });
  const { month, year } = getCurrentUsagePeriod();
  const usage = await prisma.usage.findUnique({
    where: { userId_month_year: { userId: feed.userId, month, year } },
  });
  const used = usage?.packsUsed ?? 0;
  const limit = planInfo.limit;

  if (Number.isFinite(limit) && used >= limit) {
    await prisma.rssEpisode.update({
      where: { id: episode.id },
      data: { status: "needs_transcript" },
    });
    // Don't notify — plan limit emails would be noisy
    return { newEpisode: true, packGenerated: false };
  }

  // Generate pack
  try {
    const structuredPack = await generateAuthorityPack(packInput, {
      inputType: "INTERVIEW",
      angle: "THOUGHT_LEADERSHIP",
    });

    const { totalScore, breakdown } = calculateQualityScore(
      structuredPack,
      "INTERVIEW",
      "THOUGHT_LEADERSHIP",
    );

    const title = `${episode.title} — ${feed.feedName ?? "RSS Pack"}`;

    const createdPack = await prisma.$transaction(async (tx) => {
      const pack = await tx.authorityPack.create({
        data: {
          title: title.slice(0, 200),
          originalInput: packInput.slice(0, 10000),
          userId: feed.userId,
          inputType: "INTERVIEW",
          angle: "THOUGHT_LEADERSHIP",
          coreThesis: structuredPack.coreThesis as unknown as Prisma.InputJsonValue,
          strategicHooks: structuredPack.strategicHooks as unknown as Prisma.InputJsonValue,
          highLeveragePosts: structuredPack.highLeveragePosts as unknown as Prisma.InputJsonValue,
          insightBreakdown: structuredPack.insightBreakdown as unknown as Prisma.InputJsonValue,
          repurposingMatrix: structuredPack.repurposingMatrix as unknown as Prisma.InputJsonValue,
          executiveSummary: structuredPack.executiveSummary as unknown as Prisma.InputJsonValue,
          strategicMap: structuredPack.strategicMap
            ? (structuredPack.strategicMap as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          qualityScore: totalScore,
          qualityBreakdown: breakdown as unknown as Prisma.InputJsonValue,
          lastGeneratedAt: new Date(),
          llmUsed: "openai-gpt4o",
          approveToken: randomUUID(),
        },
      });
      await incrementPackUsage(feed.userId, tx);
      return pack;
    });

    await prisma.rssEpisode.update({
      where: { id: episode.id },
      data: { packId: createdPack.id, status: "pack_generated" },
    });

    await prisma.rssFeed.update({
      where: { id: feed.id },
      data: { checkCount: { increment: 1 } },
    });

    await notifyFounderPackReady(feed.user, episode, feed, createdPack);

    await prisma.rssEpisode.update({
      where: { id: episode.id },
      data: { status: "notified", notifiedAt: new Date() },
    });

    return { newEpisode: true, packGenerated: true };
  } catch (err) {
    console.error(`[rss] Pack generation failed for episode "${episode.title}":`, err);
    await prisma.rssEpisode.update({
      where: { id: episode.id },
      data: { status: "needs_transcript" },
    });
    return { newEpisode: true, packGenerated: false };
  }
}
