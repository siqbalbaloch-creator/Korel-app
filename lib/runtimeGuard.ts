import { apiError } from "@/lib/apiError";
import { logger } from "@/lib/logger";

export async function guardAsync<T>(fn: () => Promise<T>, context: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const payload: Record<string, unknown> = { context };
    if (process.env.NODE_ENV !== "production") {
      payload.stack = err instanceof Error ? err.stack : String(err);
    }
    logger.error("runtime.unhandled_error", payload);
    return apiError("Internal error", "INTERNAL_ERROR", 500) as unknown as T;
  }
}
