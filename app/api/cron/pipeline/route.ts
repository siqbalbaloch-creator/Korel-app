import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline/pipeline.service";

// Called daily by Vercel Cron — protected by CRON_SECRET
// Retries Hunter.io email lookup for any leads stuck in PENDING_EMAIL
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runPipeline();
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
