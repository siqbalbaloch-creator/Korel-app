import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { runPipeline } from "@/lib/pipeline/pipeline.service";
import { runStarterStoryDiscovery } from "@/lib/pipeline/starter-story.service";
import { runIndieHackersDiscovery } from "@/lib/pipeline/indie-hackers.service";
import { runFailoryDiscovery } from "@/lib/pipeline/failory.service";

// Admin-only manual trigger
export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    maxResults?: number;
    minRevenue?: number;
    mode?: "discovery" | "email_retry" | "both";
  };

  const maxResults = Math.min(body.maxResults ?? 10, 25);
  const minRevenue = body.minRevenue ?? 5000;
  const mode = body.mode ?? "both";

  try {
    let starterStory: Awaited<ReturnType<typeof runStarterStoryDiscovery>> | null =
      null;
    let indieHackers: Awaited<ReturnType<typeof runIndieHackersDiscovery>> | null =
      null;
    let failory: Awaited<ReturnType<typeof runFailoryDiscovery>> | null = null;
    let retry: Awaited<ReturnType<typeof runPipeline>> | null = null;

    if (mode === "discovery" || mode === "both") {
      [starterStory, indieHackers, failory] = await Promise.all([
        runStarterStoryDiscovery(4, minRevenue),
        runIndieHackersDiscovery(maxResults, minRevenue),
        runFailoryDiscovery(5, minRevenue),
      ]);
    }
    if (mode === "email_retry" || mode === "both") {
      retry = await runPipeline();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      discovered:
        (starterStory?.discovered ?? 0) +
        (indieHackers?.discovered ?? 0) +
        (failory?.discovered ?? 0),
      processed:
        (starterStory?.processed ?? 0) +
        (indieHackers?.processed ?? 0) +
        (failory?.processed ?? 0),
      skipped:
        (starterStory?.skipped ?? 0) +
        (indieHackers?.skipped ?? 0) +
        (failory?.skipped ?? 0),
      failed:
        (starterStory?.failed ?? 0) +
        (indieHackers?.failed ?? 0) +
        (failory?.failed ?? 0),
      emailRetries: retry?.retried ?? 0,
      emailsFound: retry?.emailsFound ?? 0,
      sources: {
        starterStory: starterStory ?? null,
        indieHackers: indieHackers ?? null,
        failory: failory ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
