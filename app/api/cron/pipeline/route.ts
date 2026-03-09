import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline/pipeline.service";
import { runStarterStoryDiscovery } from "@/lib/pipeline/starter-story.service";

// Called daily by Vercel Cron at 9 AM UTC — protected by CRON_SECRET
// Phase 1: Discover new Starter Story interviews + generate content + find emails
// Phase 2: Retry email waterfall for any leads stuck in PENDING_EMAIL / NO_EMAIL
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const maxResults = parseInt(process.env.STARTER_STORY_BATCH_SIZE ?? "10");
    const minRevenue = parseInt(process.env.STARTER_STORY_MIN_REVENUE ?? "5000");

    const [discovery, retry] = await Promise.allSettled([
      runStarterStoryDiscovery(maxResults, minRevenue),
      runPipeline(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      discovery: discovery.status === "fulfilled" ? discovery.value : { error: String((discovery as PromiseRejectedResult).reason) },
      retry: retry.status === "fulfilled" ? retry.value : { error: String((retry as PromiseRejectedResult).reason) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
