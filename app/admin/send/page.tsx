import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import KorelSendClient from "./KorelSendClient";

type SearchParams = Promise<{
  packId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
}>;

function toStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function toStrArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export default async function AdminSendPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAdmin();

  const currentUser = {
    role: "admin" as const,
    name: session.user.name ?? session.user.email ?? "Admin",
  };

  const sp = await searchParams;
  type InitialPack = {
    project_id: string;
    client_name: string;
    client_email: string;
    company: string;
    linkedin_post: string;
    twitter_post: string;
    newsletter: string;
  };

  // Check for approved pipeline leads
  const approvedLeadCount = await prisma.outreachLead.count({
    where: { status: "APPROVED" },
  });

  let initialPack: InitialPack | null = null;

  if (sp.packId) {
    const pack = await prisma.authorityPack.findUnique({
      where: { id: sp.packId },
      select: { id: true, highLeveragePosts: true },
    });

    if (pack) {
      const hlp = isRecord(pack.highLeveragePosts) ? pack.highLeveragePosts : {};
      const linkedinPosts = toStrArr(hlp.linkedinPosts);
      const twitterThread = toStrArr(hlp.twitterThread);
      const newsletter = toStr(hlp.newsletterSummary);

      initialPack = {
        project_id: pack.id,
        client_name: sp.recipientName ?? "",
        client_email: sp.recipientEmail ?? "",
        company: sp.recipientCompany ?? "",
        linkedin_post: linkedinPosts[0] ?? "",
        twitter_post: twitterThread.join("\n\n"),
        newsletter,
      };
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          KorelSend
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Distribute authority packs to clients via Gmail.
        </p>
      </div>

      {approvedLeadCount > 0 && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <p className="text-sm font-medium text-indigo-800">
            📋 {approvedLeadCount} approved lead{approvedLeadCount !== 1 ? "s" : ""} ready to send from the pipeline.
          </p>
          <Link
            href="/admin/pipeline"
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Send from Pipeline →
          </Link>
        </div>
      )}

      <KorelSendClient currentUser={currentUser} initialPack={initialPack} />
    </div>
  );
}
