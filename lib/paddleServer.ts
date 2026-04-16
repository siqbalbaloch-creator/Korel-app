import { Paddle, Environment } from "@paddle/paddle-node-sdk";

/**
 * Returns a fresh Paddle client. Do NOT instantiate at module scope —
 * keeps Paddle off the critical path for non-billing routes.
 */
export function getPaddle(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("Missing PADDLE_API_KEY env var");

  const envName = (process.env.PADDLE_ENV ?? "sandbox").toLowerCase();
  const environment =
    envName === "production" ? Environment.production : Environment.sandbox;

  return new Paddle(apiKey, { environment });
}
