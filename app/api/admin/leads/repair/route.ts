import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { repairStuckLeads } from "@/lib/pipeline/pipeline.service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  await requireAdmin();
  const result = await repairStuckLeads();
  return NextResponse.json({ success: true, ...result });
}
