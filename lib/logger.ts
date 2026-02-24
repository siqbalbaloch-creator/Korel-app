/**
 * Structured logging layer.
 * In development: human-readable console output.
 * In production: JSON lines (compatible with Vercel / Datadog / Logtail).
 */

type LogLevel = "info" | "warn" | "error" | "debug";

export type LogPayload = Record<string, unknown>;

const IS_PROD = process.env.NODE_ENV === "production";

function log(level: LogLevel, event: string, payload?: LogPayload): void {
  const ts = new Date().toISOString();

  if (level === "debug" && IS_PROD) {
    return;
  }

  if (IS_PROD) {
    // Structured JSON - one object per line
    console.log(JSON.stringify({ level, event, ts, ...payload }));
  } else {
    const prefix =
      level === "error"
        ? "[ERROR]"
        : level === "warn"
          ? "[WARN]"
          : level === "debug"
            ? "[DEBUG]"
            : "[INFO]";
    if (payload && Object.keys(payload).length > 0) {
      console.log(`${prefix} [${event}]`, payload);
    } else {
      console.log(`${prefix} [${event}]`);
    }
  }
}

export const logger = {
  debug: (event: string, payload?: LogPayload) => log("debug", event, payload),
  info: (event: string, payload?: LogPayload) => log("info", event, payload),
  warn: (event: string, payload?: LogPayload) => log("warn", event, payload),
  error: (event: string, payload?: LogPayload) => log("error", event, payload),
};
