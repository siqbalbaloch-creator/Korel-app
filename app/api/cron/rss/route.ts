import { NextResponse } from "next/server";
import { checkAllFeeds } from "@/lib/rss/rss-monitor.service";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkAllFeeds();
  return NextResponse.json({ success: true, ...result });
}
