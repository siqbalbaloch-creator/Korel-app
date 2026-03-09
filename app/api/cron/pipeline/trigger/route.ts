import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { runPipeline } from "@/lib/pipeline/pipeline.service";
import { runStarterStoryDiscovery } from "@/lib/pipeline/starter-story.service";

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
    let discovery: Awaited<ReturnType<typeof runStarterStoryDiscovery>> | null = null;
    let retry: Awaited<ReturnType<typeof runPipeline>> | null = null;

    if (mode === "discovery" || mode === "both") {
      discovery = await runStarterStoryDiscovery(maxResults, minRevenue);
    }
    if (mode === "email_retry" || mode === "both") {
      retry = await runPipeline();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      discovered: discovery?.discovered ?? 0,
      processed: discovery?.processed ?? 0,
      skipped: discovery?.skipped ?? 0,
      failed: discovery?.failed ?? 0,
      emailRetries: retry?.retried ?? 0,
      emailsFound: retry?.emailsFound ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
