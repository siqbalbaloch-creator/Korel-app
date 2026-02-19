import { NextResponse } from "next/server";
import { fetchYouTubeTranscriptDebug } from "@/lib/packGenerationService";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Provide ?url= query param" }, { status: 400 });
  }

  const start = Date.now();

  try {
    const fullText = await fetchYouTubeTranscriptDebug(url);
    const elapsedMs = Date.now() - start;

    const usable = fullText.trim().length > 50;
    const words = fullText.trim().split(/\s+/).filter(Boolean);
    return NextResponse.json({
      success: true,
      usable,
      elapsedMs,
      charCount: fullText.length,
      wordCount: words.length,
      preview: fullText.slice(0, 500) + (fullText.length > 500 ? "…" : ""),
      ...(!usable && { warning: "Transcript is empty or too short — will be treated as unavailable" }),
    });
  } catch (err) {
    const elapsedMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    return NextResponse.json({
      success: false,
      elapsedMs,
      error: message,
    });
  }
}
