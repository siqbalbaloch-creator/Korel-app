import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
type WaitlistPlan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
type WaitlistStatus = "ACTIVE" | "CONTACTED" | "CONVERTED" | "REMOVED";

const VALID_PLANS = new Set<WaitlistPlan>([
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
]);

const VALID_STATUSES = new Set<WaitlistStatus>([
  "ACTIVE",
  "CONTACTED",
  "CONVERTED",
  "REMOVED",
]);

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const planParam = searchParams.get("plan");
  const statusParam = searchParams.get("status");
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
  );

  const plan =
    planParam && VALID_PLANS.has(planParam as WaitlistPlan)
      ? (planParam as WaitlistPlan)
      : undefined;

  const status =
    statusParam && VALID_STATUSES.has(statusParam as WaitlistStatus)
      ? (statusParam as WaitlistStatus)
      : undefined;

  const where = {
    ...(plan ? { plan } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q } },
            { fullName: { contains: q } },
          ],
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { lastSubmittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.waitlistEntry.count({ where }),
  ]);

  return NextResponse.json({ entries, total, page, pageSize });
}
