/**
 * Consistent API error response helper.
 *
 * All API routes should use this to return errors so the frontend
 * always gets a predictable { error, code } shape.
 */
import { NextResponse } from "next/server";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "LIMIT_REACHED"
  | "INVALID_INPUT"
  | "MISSING_FIELDS"
  | "GENERATION_FAILED"
  | "INSIGHT_GUARD_BLOCKED"
  | "EXTRACTION_PARSE_FAILED"
  | "PACK_INCOMPLETE"
  | "ASSET_GEN_FAILED"
  | "REGEN_IN_PROGRESS"
  | "INPUT_TOO_LARGE"
  | "INPUT_INVALID_URL"
  | "TRANSCRIPT_UNAVAILABLE"
  | "INTERNAL_INVALID_REGEN"
  | "INTERNAL_ERROR"
  | "PLAN_LIMIT_PACKS_EXCEEDED"
  | "PLAN_LIMIT_REGEN_EXCEEDED"
  | "PLAN_LIMIT_NOT_ALLOWED";

export function apiError(
  error: string,
  code: ErrorCode,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error, code, ...extra }, { status });
}
