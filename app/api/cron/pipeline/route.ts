import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline/pipeline.service";

// Called daily by Vercel Cron — protected by CRON_SECRET
// Optional query params: ?query=...&maxResults=N&daysBack=N
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const options = {
    query: sp.get("query") ?? undefined,
    maxResults: sp.has("maxResults") ? parseInt(sp.get("maxResults")!, 10) : undefined,
    daysBack: sp.has("daysBack") ? parseInt(sp.get("daysBack")!, 10) : undefined,
  };

  try {
    const summary = await runPipeline(options);
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
