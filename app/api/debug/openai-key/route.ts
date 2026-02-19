import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";

const parseEnvValue = (content: string, key: string) => {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const normalized = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length).trim()
      : trimmed;
    const eqIndex = normalized.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }
    const name = normalized.slice(0, eqIndex).trim();
    if (name !== key) {
      continue;
    }
    let value = normalized.slice(eqIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return null;
};

const safePreview = (value: string) => {
  if (!value) {
    return null;
  }
  const head = value.slice(0, 7);
  const tail = value.slice(-4);
  return `${head}...${tail}`;
};

const readEnvFile = (filename: string) => {
  try {
    const fullPath = path.join(process.cwd(), filename);
    return readFileSync(fullPath, "utf8");
  } catch {
    return null;
  }
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production." },
      { status: 404 },
    );
  }

  const runtimeKey = (process.env.OPENAI_API_KEY ?? "").trim();
  const envLocal = readEnvFile(".env.local");
  const envFile = readEnvFile(".env");

  const envLocalValue = envLocal
    ? parseEnvValue(envLocal, "OPENAI_API_KEY")
    : null;
  const envValue = envFile ? parseEnvValue(envFile, "OPENAI_API_KEY") : null;

  const envLocalTrimmed = envLocalValue?.trim() ?? null;
  const envTrimmed = envValue?.trim() ?? null;

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasRuntimeKey: Boolean(runtimeKey),
    runtimeKeyLength: runtimeKey.length,
    runtimeKeyPreview: safePreview(runtimeKey),
    envLocalFound: envLocalValue !== null,
    envLocalLength: envLocalTrimmed?.length ?? null,
    envLocalMatchesRuntime:
      envLocalTrimmed !== null ? envLocalTrimmed === runtimeKey : null,
    envFound: envValue !== null,
    envLength: envTrimmed?.length ?? null,
    envMatchesRuntime: envTrimmed !== null ? envTrimmed === runtimeKey : null,
  });
}
