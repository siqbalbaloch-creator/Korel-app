import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { checkAllFeeds } from "@/lib/rss/rss-monitor.service";

// Admin-only manual trigger for the RSS cron
export async function POST() {
  const session = await getServerAuthSession();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await checkAllFeeds();
  return NextResponse.json({ success: true, ...result });
}
