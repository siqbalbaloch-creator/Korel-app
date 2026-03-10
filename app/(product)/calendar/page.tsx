import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  // Fetch scheduled (all future) + recently published (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const records = await prisma.publishRecord.findMany({
    where: {
      userId,
      OR: [
        { status: "scheduled" },
        { status: "published", publishedAt: { gte: thirtyDaysAgo } },
        { status: "failed", publishedAt: { gte: thirtyDaysAgo } },
      ],
    },
    select: {
      id: true,
      platform: true,
      content: true,
      status: true,
      scheduledFor: true,
      publishedAt: true,
      postUrl: true,
      errorMessage: true,
      pack: {
        select: { id: true, title: true },
      },
    },
    orderBy: [
      { scheduledFor: "asc" },
      { publishedAt: "desc" },
    ],
  });

  const serialized = records.map((r) => ({
    id: r.id,
    platform: r.platform as "linkedin" | "x",
    content: r.content,
    status: r.status,
    scheduledFor: r.scheduledFor?.toISOString() ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    postUrl: r.postUrl,
    errorMessage: r.errorMessage,
    packId: r.pack?.id ?? null,
    packTitle: r.pack?.title ?? null,
  }));

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[960px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Content Calendar
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Scheduled and published posts across all platforms.
          </p>
        </div>
        <CalendarClient records={serialized} />
      </div>
    </div>
  );
}
