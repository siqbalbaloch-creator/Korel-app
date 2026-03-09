import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import PipelineClient from "./PipelineClient";

export default async function AdminPipelinePage() {
  await requireAdmin();

  // Fetch all leads with their video info
  const rawLeads = await prisma.outreachLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pipelineVideo: {
        select: { title: true, youtubeUrl: true },
      },
    },
  });

  // Classify READY statuses for the client
  const leads = rawLeads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    approvedAt: l.approvedAt?.toISOString() ?? null,
    sentAt: l.sentAt?.toISOString() ?? null,
    emailAttemptLog: l.emailAttemptLog as { source: string; result: "found" | "skipped" | "failed"; detail: string }[] | null,
  }));

  // Pipeline log: 50 most recent PipelineVideo rows
  const rawLog = await prisma.pipelineVideo.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      youtubeVideoId: true,
      title: true,
      status: true,
      createdAt: true,
      errorMessage: true,
    },
  });

  const pipelineLog = rawLog.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  // Last run info
  const lastVideo = await prisma.pipelineVideo.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const todayCount = await prisma.pipelineVideo.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const lastRun = lastVideo
    ? { at: lastVideo.createdAt.toISOString(), count: todayCount }
    : null;

  const defaultQuery =
    process.env.PIPELINE_SEARCH_QUERY ?? "founder interview startup bootstrapped SaaS";

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          🤖 Pipeline
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          YouTube → transcript → content pack → outreach queue. Run daily or on-demand.
        </p>
      </div>

      <PipelineClient
        leads={leads}
        pipelineLog={pipelineLog}
        lastRun={lastRun}
        defaultQuery={defaultQuery}
      />
    </div>
  );
}
