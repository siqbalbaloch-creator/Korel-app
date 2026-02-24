import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { assertWithinPlanLimits, buildPlanLimitPayload, PlanLimitError } from "@/lib/planGuard";

export const runtime = "nodejs";

export type RepurposeType = "linkedin_short" | "twitter_hooks" | "blog" | "newsletter";

type RepurposeBody = {
  type: RepurposeType;
};

const VALID_TYPES: RepurposeType[] = ["linkedin_short", "twitter_hooks", "blog", "newsletter"];

const toJsonObject = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function buildLinkedInShort(pack: {
  coreThesis: unknown;
  highLeveragePosts: unknown;
  executiveSummary: unknown;
}): string {
  const ct = toJsonObject(pack.coreThesis);
  const hlp = toJsonObject(pack.highLeveragePosts);
  const es = toJsonObject(pack.executiveSummary);

  const headline =
    typeof es.headline === "string" ? es.headline : typeof ct.primaryThesis === "string" ? ct.primaryThesis : "";
  const posts = toStringArray(hlp.linkedinPosts);
  const firstPost = posts[0] ?? "";

  if (firstPost) return firstPost;

  // Fallback: compose a short post from thesis
  const themes = toStringArray(ct.supportingThemes).slice(0, 3);
  const themesText = themes.length ? "\n" + themes.map((t) => `• ${t}`).join("\n") : "";
  return headline ? `${headline}${themesText}` : "(No content available)";
}

function buildTwitterHooks(pack: { strategicHooks: unknown }): string[] {
  const sh = toJsonObject(pack.strategicHooks);
  return [
    ...toStringArray(sh.linkedin).slice(0, 3),
    ...toStringArray(sh.twitter).slice(0, 3),
    ...toStringArray(sh.contrarian).slice(0, 2),
  ];
}

function buildBlogPost(pack: {
  coreThesis: unknown;
  insightBreakdown: unknown;
  highLeveragePosts: unknown;
  executiveSummary: unknown;
}): string {
  const ct = toJsonObject(pack.coreThesis);
  const ib = toJsonObject(pack.insightBreakdown);
  const hlp = toJsonObject(pack.highLeveragePosts);
  const es = toJsonObject(pack.executiveSummary);

  const title =
    typeof es.headline === "string" ? es.headline : typeof ct.primaryThesis === "string" ? ct.primaryThesis : "Untitled";
  const intro = typeof es.positioningSentence === "string" ? es.positioningSentence : "";
  const themes = toStringArray(ct.supportingThemes);
  const claims = toStringArray(ib.strongClaims);
  const frameworks = toStringArray(ib.frameworks);
  const newsletter = typeof hlp.newsletterSummary === "string" ? hlp.newsletterSummary : "";

  let blog = `# ${title}\n\n`;
  if (intro) blog += `${intro}\n\n`;
  if (themes.length) blog += `## Key Themes\n\n${themes.map((t) => `- ${t}`).join("\n")}\n\n`;
  if (claims.length) blog += `## Strong Claims\n\n${claims.map((c) => `- ${c}`).join("\n")}\n\n`;
  if (frameworks.length) blog += `## Frameworks\n\n${frameworks.map((f) => `- ${f}`).join("\n")}\n\n`;
  if (newsletter) blog += `## Summary\n\n${newsletter}\n`;
  return blog.trim();
}

function buildNewsletter(pack: {
  coreThesis: unknown;
  highLeveragePosts: unknown;
  executiveSummary: unknown;
  repurposingMatrix: unknown;
}): string {
  const ct = toJsonObject(pack.coreThesis);
  const hlp = toJsonObject(pack.highLeveragePosts);
  const es = toJsonObject(pack.executiveSummary);

  const headline =
    typeof es.headline === "string" ? es.headline : typeof ct.primaryThesis === "string" ? ct.primaryThesis : "This Week's Insight";
  const positioning = typeof es.positioningSentence === "string" ? es.positioningSentence : "";
  const newsletterSummary = typeof hlp.newsletterSummary === "string" ? hlp.newsletterSummary : "";
  const insights = toStringArray(es.keyInsights);
  const themes = toStringArray(ct.supportingThemes);

  let nl = `**${headline}**\n\n`;
  if (positioning) nl += `${positioning}\n\n`;
  if (newsletterSummary) nl += `${newsletterSummary}\n\n`;
  if (insights.length) nl += `**Key Takeaways:**\n${insights.map((i) => `• ${i}`).join("\n")}\n\n`;
  if (themes.length) nl += `**Themes:** ${themes.join(" · ")}\n`;
  return nl.trim();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await assertWithinPlanLimits({
      userId,
      action: "repurpose",
      userRole: session.user.role,
    });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(buildPlanLimitPayload(err), { status: 403 });
    }
    throw err;
  }

  const pack = await prisma.authorityPack.findFirst({ where: { id, userId } });
  if (!pack) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: RepurposeBody;
  try {
    body = (await request.json()) as RepurposeBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json(
      { error: "invalid_type", valid: VALID_TYPES },
      { status: 400 },
    );
  }

  let content: unknown;

  if (body.type === "linkedin_short") {
    content = buildLinkedInShort(pack);
  } else if (body.type === "twitter_hooks") {
    content = buildTwitterHooks(pack);
  } else if (body.type === "blog") {
    content = buildBlogPost(pack);
  } else {
    content = buildNewsletter(pack);
  }

  const repurpose = await prisma.authorityPackRepurpose.create({
    data: {
      packId: id,
      type: body.type,
      content: content as Parameters<typeof prisma.authorityPackRepurpose.create>[0]["data"]["content"],
    },
  });

  return NextResponse.json({ id: repurpose.id, type: repurpose.type, content, createdAt: repurpose.createdAt });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pack = await prisma.authorityPack.findFirst({ where: { id, userId }, select: { id: true } });
  if (!pack) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const repurposes = await prisma.authorityPackRepurpose.findMany({
    where: { packId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ repurposes });
}
