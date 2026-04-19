import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { classifyEmailFormat } from "@/lib/pipeline/emailValidation";
import PipelineClient from "./PipelineClient";

export default async function AdminPipelinePage() {
  await requireAdmin();

  // Fetch leads that actually have an email stored. NO_EMAIL / PENDING_EMAIL
  // rows aren't actionable (nowhere to send) so they're hidden from the queue.
  const rawLeads = await prisma.outreachLead.findMany({
    where: { email: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      pipelineVideo: {
        select: { title: true, youtubeUrl: true },
      },
    },
  });

  // Also drop leads whose stored email is a role inbox (info@, support@, etc.)
  // or a placeholder — these can exist from before the waterfall gate was added.
  const usableLeads = rawLeads.filter((l) =>
    l.email ? classifyEmailFormat(l.email).ok : false,
  );
  const hiddenCount = rawLeads.length - usableLeads.length;

  const leads = usableLeads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    approvedAt: l.approvedAt?.toISOString() ?? null,
    sentAt: l.sentAt?.toISOString() ?? null,
    emailAttemptLog: l.emailAttemptLog as { source: string; result: "found" | "skipped" | "failed" | "rejected"; detail: string }[] | null,
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

  // LLM stats — last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [gpt4oCount, claudeCount] = await Promise.all([
    prisma.authorityPack.count({ where: { createdAt: { gte: thirtyDaysAgo }, llmUsed: "openai-gpt4o" } }),
    prisma.authorityPack.count({ where: { createdAt: { gte: thirtyDaysAgo }, llmUsed: "anthropic-claude" } }),
  ]);
  const llmStats = {
    gpt4o: gpt4oCount,
    claude: claudeCount,
    total: gpt4oCount + claudeCount,
  };

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

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          🤖 Pipeline
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Starter Story + Indie Hackers + Failory → interview → content pack → outreach queue. Runs daily at 9 AM or on-demand.
        </p>
      </div>

      <PipelineClient
        leads={leads}
        pipelineLog={pipelineLog}
        lastRun={lastRun}
        llmStats={llmStats}
        hiddenCount={hiddenCount}
      />
    </div>
  );
}
