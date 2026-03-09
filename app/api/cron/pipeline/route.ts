import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline/pipeline.service";
import { runStarterStoryDiscovery } from "@/lib/pipeline/starter-story.service";
import { runIndieHackersDiscovery } from "@/lib/pipeline/indie-hackers.service";
import { runFailoryDiscovery } from "@/lib/pipeline/failory.service";

// Called daily by Vercel Cron at 9 AM UTC — protected by CRON_SECRET
// Discovery: Starter Story + Indie Hackers + Failory → content pack → outreach leads
// Retry: email waterfall for leads stuck in PENDING_EMAIL / NO_EMAIL
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const maxResults = parseInt(process.env.STARTER_STORY_BATCH_SIZE ?? "10");
    const minRevenue = parseInt(process.env.STARTER_STORY_MIN_REVENUE ?? "5000");

    const [starterStory, indieHackers, failory, retry] = await Promise.allSettled([
      runStarterStoryDiscovery(4, minRevenue),          // ~4 from free tier
      runIndieHackersDiscovery(maxResults, minRevenue), // ~10 from sitemap
      runFailoryDiscovery(5, minRevenue),               // ~5 from index + sitemap
      runPipeline(),                                    // email retry pass
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      starterStory:
        starterStory.status === "fulfilled"
          ? starterStory.value
          : { error: String((starterStory as PromiseRejectedResult).reason) },
      indieHackers:
        indieHackers.status === "fulfilled"
          ? indieHackers.value
          : { error: String((indieHackers as PromiseRejectedResult).reason) },
      failory:
        failory.status === "fulfilled"
          ? failory.value
          : { error: String((failory as PromiseRejectedResult).reason) },
      retry:
        retry.status === "fulfilled"
          ? retry.value
          : { error: String((retry as PromiseRejectedResult).reason) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
