import OpenAI from "openai";
import { writeFileSync, unlinkSync, createReadStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const WHISPER_MAX_BYTES = 24 * 1024 * 1024; // 24 MB — Whisper API hard limit
const WHISPER_TIMEOUT_MS = 55_000; // 55 seconds — safe margin under Vercel 60s limit

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Download audio from `audioUrl`, send to OpenAI Whisper, return transcript text.
 * Throws if:
 *   - Download fails or file exceeds 24 MB
 *   - Whisper API returns an error
 *   - Transcription takes longer than 55 seconds
 */
export async function transcribeAudioUrl(audioUrl: string): Promise<string> {
  // Download audio
  const res = await fetch(audioUrl, {
    headers: { "User-Agent": "Korel/1.0 (podcast-transcription)" },
  });

  if (!res.ok) {
    throw new Error(`Audio download failed: ${res.status} ${res.statusText}`);
  }

  // Reject before downloading if Content-Length already exceeds limit
  const contentLength = res.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > WHISPER_MAX_BYTES) {
    throw new Error(
      `Audio file too large for Whisper (${Math.round(parseInt(contentLength, 10) / 1024 / 1024)} MB, max 24 MB)`,
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > WHISPER_MAX_BYTES) {
    throw new Error(
      `Audio file too large for Whisper (${Math.round(buffer.byteLength / 1024 / 1024)} MB, max 24 MB)`,
    );
  }

  // Derive extension from URL for correct MIME detection by Whisper
  const ext = (audioUrl.split("?")[0].split(".").pop() ?? "mp3").toLowerCase();
  const safeExt = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg"].includes(ext)
    ? ext
    : "mp3";
  const tmpPath = join(tmpdir(), `korel-whisper-${Date.now()}.${safeExt}`);

  try {
    writeFileSync(tmpPath, buffer);

    const openai = getOpenAI();

    const transcription = await Promise.race([
      openai.audio.transcriptions.create({
        file: createReadStream(tmpPath),
        model: "whisper-1",
        response_format: "text",
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Whisper transcription timed out after 55s")),
          WHISPER_TIMEOUT_MS,
        ),
      ),
    ]);

    // response_format: "text" returns a plain string, but types say SRT | VTT | etc.
    return typeof transcription === "string"
      ? transcription
      : (transcription as { text: string }).text;
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      // temp file cleanup failure is non-fatal
    }
  }
}
