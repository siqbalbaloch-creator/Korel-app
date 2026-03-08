import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const videoId = request.nextUrl.searchParams.get("v") ?? "dQw4w9WgXcQ";
  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  const html = await pageRes.text();

  function extractJsonArray(src: string, key: string) {
    const marker = `"${key}":[`;
    const idx = src.indexOf(marker);
    if (idx === -1) return null;
    const start = idx + marker.length - 1;
    let depth = 0;
    for (let i = start; i < src.length; i++) {
      if (src[i] === "[") depth++;
      else if (src[i] === "]") {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(src.slice(start, i + 1)); } catch { return null; }
        }
      }
    }
    return null;
  }

  const tracks = extractJsonArray(html, "captionTracks") as
    | { baseUrl: string; languageCode: string; kind?: string }[]
    | null;

  if (!tracks?.length) {
    return NextResponse.json({
      step: "page",
      error: "No captionTracks in HTML",
      htmlLength: html.length,
      containsCaptionTracks: html.includes("captionTracks"),
    });
  }

  const track =
    tracks.find((t) => t.languageCode === "en" || t.languageCode.startsWith("en")) ?? tracks[0];

  const captionRes = await fetch(track.baseUrl, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  const captionHeaders: Record<string, string> = {};
  captionRes.headers.forEach((v, k) => { captionHeaders[k] = v; });
  const captionBody = await captionRes.text();

  return NextResponse.json({
    videoId,
    pageHttp: pageRes.status,
    tracks: tracks.length,
    trackLang: track.languageCode,
    trackKind: track.kind,
    trackUrl: track.baseUrl.slice(0, 150) + "...",
    captionHttp: captionRes.status,
    captionBodyLength: captionBody.length,
    captionContentType: captionHeaders["content-type"],
    captionContentLength: captionHeaders["content-length"],
    captionPreview: captionBody.slice(0, 500),
  });
}
