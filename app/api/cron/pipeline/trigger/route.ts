import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { runPipeline } from "@/lib/pipeline/pipeline.service";

// Admin-only manual trigger — retries email lookup for PENDING_EMAIL leads
export async function POST() {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
