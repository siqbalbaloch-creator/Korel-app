import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { runPipeline } from "@/lib/pipeline/pipeline.service";

// Admin-only manual trigger — no CRON_SECRET needed
export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { query?: string; maxResults?: number; daysBack?: number } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  try {
    const summary = await runPipeline({
      query: body.query,
      maxResults: body.maxResults,
      daysBack: body.daysBack,
    });
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
