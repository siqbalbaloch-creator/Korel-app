/**
 * In-memory sliding window rate limiter.
 *
 * In-memory only - does NOT persist across serverless instances.
 * For multi-instance production deployments, swap for:
 * @upstash/ratelimit + @upstash/redis (drop-in replacement interface).
 *
 * Usage:
 *   const allowed = rateLimit(`gen:${userId}`, 5, 60_000); // 5 per minute
 *   if (!allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
 */

import { logger } from "@/lib/logger";

// Map<key, timestamps[]>
const windows = new Map<string, number[]>();
const locks = new Map<string, number>();

if (process.env.NODE_ENV !== "production") {
  logger.debug("rateLimit.store_initialized");
}

// Prune stale keys every 5 minutes to prevent unbounded memory growth
let lastPrune = Date.now();
const PRUNE_INTERVAL = 5 * 60 * 1000;

function maybePrune(windowMs: number): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;
  for (const [key, hits] of windows) {
    const fresh = hits.filter((t) => t > now - windowMs);
    if (fresh.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, fresh);
    }
  }
}

/**
 * Returns true if the request is allowed, false if the rate limit is exceeded.
 * @param key     Unique identifier (e.g. `"gen:${userId}"`)
 * @param max     Maximum number of requests in the window
 * @param windowMs  Window length in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  maybePrune(windowMs);

  const hits = (windows.get(key) ?? []).filter((t) => t > now - windowMs);

  if (hits.length >= max) {
    return false;
  }

  hits.push(now);
  windows.set(key, hits);
  return true;
}

/**
 * Best-effort in-memory lock with TTL.
 * Returns true if lock acquired, false if lock already held.
 */
export function acquireLock(key: string, ttlMs: number): boolean {
  const now = Date.now();
  const expiresAt = locks.get(key);
  if (expiresAt && expiresAt > now) {
    return false;
  }
  locks.set(key, now + ttlMs);
  return true;
}

/** Release an acquired lock early. */
export function releaseLock(key: string): void {
  locks.delete(key);
}
