import { NextResponse } from "next/server";
import { getWeaknessRadarForRequest } from "@/lib/weaknessRadar";
import { apiError } from "@/lib/apiError";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { radar } = await getWeaknessRadarForRequest();
    return NextResponse.json(radar);
  } catch (err) {
    return apiError("unauthorized", "UNAUTHORIZED", 401);
  }
}
