import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FeedsClient from "./FeedsClient";

export default async function FeedsPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const feeds = await prisma.rssFeed.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { episodes: true } } },
  });

  const serialized = feeds.map((f) => ({
    id: f.id,
    feedUrl: f.feedUrl,
    feedName: f.feedName ?? null,
    feedType: f.feedType,
    isActive: f.isActive,
    lastCheckedAt: f.lastCheckedAt?.toISOString() ?? null,
    lastEpisodeTitle: f.lastEpisodeTitle ?? null,
    checkCount: f.checkCount,
    episodeCount: f._count.episodes,
    createdAt: f.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[640px] mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">
            Content Sources
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Add your podcast or YouTube channel. Korel monitors for new episodes
            and generates content packs automatically — no manual work needed.
          </p>
        </div>
        <FeedsClient initialFeeds={serialized} />
      </div>
    </div>
  );
}
