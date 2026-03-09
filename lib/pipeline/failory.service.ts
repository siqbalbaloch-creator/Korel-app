import "server-only";
import { load } from "cheerio";
import { prisma } from "@/lib/prisma";
import {
  extractInsights,
  generateLinkedInVariantA,
  generateXThread,
  generateNewsletter,
} from "@/lib/packGenerationService";
import { findEmail, extractFounderInfo } from "./pipeline.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE = "https://www.failory.com";
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Failory-owned Twitter accounts to exclude
const FAILORY_TWITTER_EXCLUDE = ["hellofailory", "nicocerdeira", "failory"];

// ─── Types ────────────────────────────────────────────────────────────────────

type IndexStory = {
  url: string;
  title: string;
  revenue: number;
  revenueText: string;
  niche: string;
};

type InterviewData = {
  interviewText: string;
  founderFirstName: string;
  founderLastName: string;
  company: string;
  websiteUrl: string | null;
  twitterUrl: string | null;
  email: string | null;
  revenue: number;
  revenueText: string;
  niche: string;
  foundedYear: number | null;
};

export type FailoryRunSummary = {
  discovered: number;
  processed: number;
  skipped: number;
  failed: number;
};

// ─── Revenue range parsing ────────────────────────────────────────────────────
// Failory shows revenue as ranges: "$10k-$25k/mo", "+$500k/mo", "No Data"

function parseFailoryRevenueLower(rangeText: string): number {
  if (!rangeText || rangeText === "No Data") return 0;
  // "+$500k/mo" → 500000
  const plus = rangeText.match(/^\+\$(\d+)k/i);
  if (plus) return parseInt(plus[1]) * 1000;
  // Parse FIRST number before the dash: "$0-$10k/mo" → 0, "$10k-$25k/mo" → 10000
  const firstNum = rangeText.match(/^\$(\d+)(k?)\s*-/i);
  if (firstNum) {
    const n = parseInt(firstNum[1]);
    const hasK = firstNum[2].toLowerCase() === "k";
    return hasK ? n * 1000 : n;
  }
  return 0;
}

function parseRevenue(text: string): number | null {
  const m = text.match(
    /\$([0-9,.]+)\s*([kKmM]?)(?:\/mo|\/month|MRR|\s+(?:per\s+)?month)?/i,
  );
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(num)) return null;
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "m") return Math.round(num * 1_000_000);
  if (suffix === "k") return Math.round(num * 1_000);
  return Math.round(num);
}

// ─── Scrape Failory index page ────────────────────────────────────────────────

export async function scrapeFailoryIndex(
  maxResults: number = 5,
  minRevenue: number = 5000,
): Promise<IndexStory[]> {
  const candidates: IndexStory[] = [];

  // Primary: index page (25 most recent, has revenue ranges in card data)
  try {
    const res = await fetch(`${BASE}/interviews`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[scrapeFailoryIndex] /interviews returned ${res.status}`);
    } else {
      const html = await res.text();
      const $ = load(html);

      $("a.interviews-card-div-block[href]").each((_, el) => {
        const href = $(el).attr("href") ?? "";
        if (!href.match(/^\/interview\/[a-z0-9-]+$/)) return;
        const fullUrl = `${BASE}${href}`;
        const revText = $(el).find('[fs-list-field="revenue"]').first().text().trim();
        const revenue = parseFailoryRevenueLower(revText);
        const title =
          $(el).find('[fs-list-field="title"]').first().text().trim() ||
          href.replace(/\/interview\//, "").replace(/-/g, " ");
        const niche = $(el).find('[fs-list-field="category"]').first().text().trim();
        candidates.push({ url: fullUrl, title, revenue, revenueText: revText, niche });
      });
    }
  } catch (err) {
    console.error("[scrapeFailoryIndex] Index page error:", err);
  }

  // Supplemental: sitemap (299 total interviews, for runs after index is exhausted)
  try {
    const sitemapRes = await fetch(`${BASE}/sitemap.xml`, {
      headers: { "User-Agent": FETCH_HEADERS["User-Agent"] },
      signal: AbortSignal.timeout(12000),
    });
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const sitemapUrls = (
        xml.match(/<loc>[^<]*\/interview\/[^<]+<\/loc>/g) ?? []
      )
        .map((m) => m.replace(/<\/?loc>/g, ""))
        .filter((u) => !candidates.some((c) => c.url === u));

      // Shuffle for variety (sitemap is alphabetical)
      for (let i = sitemapUrls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sitemapUrls[i], sitemapUrls[j]] = [sitemapUrls[j], sitemapUrls[i]];
      }

      // Add sitemap URLs with revenue=0 (unknown until we scrape)
      sitemapUrls.slice(0, maxResults * 3).forEach((u) => {
        const slug = u.replace(/.*\/interview\//, "");
        candidates.push({
          url: u,
          title: slug.replace(/-/g, " "),
          revenue: 0,
          revenueText: "No Data",
          niche: "",
        });
      });
    }
  } catch {
    /* sitemap failure is non-fatal */
  }

  if (!candidates.length) {
    console.warn("[scrapeFailoryIndex] No candidates found");
    return [];
  }

  // Dedup against DB
  const allUrls = candidates.map((c) => c.url);
  const existing = await prisma.pipelineVideo.findMany({
    where: { starterStoryUrl: { in: allUrls } },
    select: { starterStoryUrl: true },
  });
  const existingUrls = new Set(existing.map((e) => e.starterStoryUrl));

  return candidates
    .filter(
      (c) =>
        !existingUrls.has(c.url) &&
        // Include if revenue meets threshold OR if revenue unknown (0 = from sitemap)
        (c.revenue >= minRevenue || c.revenue === 0),
    )
    .slice(0, maxResults);
}

// ─── Scrape individual Failory interview ─────────────────────────────────────

export async function scrapeFailoryInterview(
  url: string,
): Promise<InterviewData | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[scrapeFailoryInterview] ${url} returned ${res.status}`);
      return null;
    }
    const html = await res.text();
    const $ = load(html);

    // ── Interview text: h2/h3 as questions ────────────────────────────────────
    const qaFromHeadings: string[] = [];
    $("h2, h3").each((_, el) => {
      const q = $(el).text().trim();
      if (!q || q.length < 10 || q.length > 300) return;
      const answers: string[] = [];
      let sibling = $(el).next();
      while (sibling.length && !sibling.is("h1,h2,h3,h4")) {
        const t = sibling.text().trim();
        if (t.length > 20) answers.push(t);
        sibling = sibling.next();
      }
      if (answers.length > 0) qaFromHeadings.push(`Q: ${q}\nA: ${answers.join(" ")}`);
    });

    let interviewText =
      qaFromHeadings.length >= 3 ? qaFromHeadings.join("\n\n") : "";

    // Fallback: paragraph text
    if (!interviewText) {
      const paras: string[] = [];
      $("p").each((_, el) => {
        const t = $(el).text().trim();
        if (t.length > 50) paras.push(t);
      });
      interviewText = paras.join("\n\n");
    }

    if (interviewText.length < 300) {
      console.warn(
        `[scrapeFailoryInterview] Text too short (${interviewText.length}) for ${url}`,
      );
      return null;
    }

    // ── Revenue: prefer OG title ───────────────────────────────────────────────
    const ogTitle =
      $("meta[property='og:title']").attr("content") ?? $("title").text() ?? "";
    const pageText = $.text();
    const revFromTitle = ogTitle.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month|MRR)/i);
    const revFromPage = pageText.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month|MRR)/i);
    const revenueText = (revFromTitle ?? revFromPage)?.[0]?.trim() ?? "";
    const revenue = revenueText ? (parseRevenue(revenueText) ?? 0) : 0;

    // ── Founder name: from first Q heading greeting or first paragraph ─────────
    let founderName = "";
    const firstH2 = $("h2").first().text().trim(); // e.g. "Hi Mat! Who are you..."
    const firstPara = $("p").first().text().trim();
    const nameMatch =
      (firstH2 + " " + firstPara).match(
        /(?:I'm|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      ) ??
      firstPara.match(
        /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:founder|co-founder|CEO|CTO)/i,
      );
    if (nameMatch) founderName = nameMatch[1].trim();

    if (!founderName) {
      const metaDesc = $("meta[name='description']").attr("content") ?? "";
      const m = metaDesc.match(
        /(?:I'm|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      );
      if (m) founderName = m[1].trim();
    }

    const nameParts = founderName.trim().split(/\s+/);
    const founderFirstName = nameParts[0] ?? "";
    const founderLastName = nameParts.slice(1).join(" ");

    // ── Company: extract from first para or OG title ──────────────────────────
    let company = "";
    const companyMatch = (firstPara + " " + ogTitle).match(
      /(?:co-?founder|founder|CEO|built|started|created|of|at)\s+(?:of\s+|at\s+)?([A-Za-z0-9][A-Za-z0-9\s\-&.,']+?)(?:\s*[.,!]|\s+(?:is|was|which|and|that|a\s)|$)/i,
    );
    if (companyMatch) company = companyMatch[1].trim().slice(0, 60);

    // ── Social / contact ──────────────────────────────────────────────────────
    let websiteUrl: string | null = null;
    let twitterUrl: string | null = null;

    $("a[href]").each((_, el) => {
      const href = ($(el).attr("href") ?? "").trim();
      if (!href.startsWith("http")) return;
      // Skip Failory's own links
      if (
        href.includes("failory.com") ||
        href.includes("podia.com") ||
        href.includes("calendly.com") ||
        href.includes("passionfroot.me")
      )
        return;

      if (
        !twitterUrl &&
        /(?:twitter|x)\.com\/(?!search|intent|hashtag|home|share)[a-z0-9_]{2,50}/i.test(
          href,
        ) &&
        !FAILORY_TWITTER_EXCLUDE.some((ex) => href.toLowerCase().includes(ex))
      ) {
        twitterUrl = href.split("?")[0];
      }
      if (
        !websiteUrl &&
        !/(twitter|x|linkedin|facebook|instagram|youtube|pinterest|tiktok)\.com/.test(
          href,
        )
      ) {
        websiteUrl = href.split("?")[0].replace(/\/$/, "");
      }
    });

    // ── Email ─────────────────────────────────────────────────────────────────
    const INVALID_FRAG = [
      "noreply",
      "no-reply",
      "@example",
      "sentry",
      "failory",
      "support@",
    ];
    const emailCandidates = pageText.match(EMAIL_RE) ?? [];
    const email =
      emailCandidates.find(
        (e) => !INVALID_FRAG.some((f) => e.toLowerCase().includes(f)),
      ) ?? null;

    // ── Founded year ──────────────────────────────────────────────────────────
    const yearM = pageText.match(
      /(?:founded|started|launched)\s+(?:in\s+)?(\d{4})/i,
    );
    const foundedYear = yearM ? parseInt(yearM[1]) : null;

    const niche = ($("meta[name='keywords']").attr("content") ?? "")
      .split(",")[0]
      .trim();

    return {
      interviewText: interviewText.slice(0, 15000),
      founderFirstName,
      founderLastName,
      company,
      websiteUrl,
      twitterUrl,
      email,
      revenue,
      revenueText,
      niche,
      foundedYear,
    };
  } catch (err) {
    console.error(`[scrapeFailoryInterview] Error for ${url}:`, err);
    return null;
  }
}

// ─── Generate content ────────────────────────────────────────────────────────

async function generatePipelineContent(
  interviewText: string,
): Promise<{ linkedinPost: string; twitterPost: string; newsletter: string } | null> {
  try {
    const insights = await extractInsights(interviewText, "INTERVIEW", "THOUGHT_LEADERSHIP");
    const [linkedinPost, twitterPost, newsletter] = await Promise.all([
      generateLinkedInVariantA(insights, "INTERVIEW", "THOUGHT_LEADERSHIP"),
      generateXThread(insights, "INTERVIEW", "THOUGHT_LEADERSHIP"),
      generateNewsletter(insights, "INTERVIEW", "THOUGHT_LEADERSHIP"),
    ]);
    return { linkedinPost, twitterPost, newsletter };
  } catch (err) {
    console.error("[Failory generatePipelineContent] Error:", err);
    return null;
  }
}

// ─── Process a single interview ───────────────────────────────────────────────

async function processStory(
  story: IndexStory,
  minRevenue: number,
): Promise<"processed" | "skipped" | "failed"> {
  const slug = story.url.replace(/.*\/interview\//, "");
  const uniqueId = `fa_${slug}`;

  const existing = await prisma.pipelineVideo.findUnique({
    where: { youtubeVideoId: uniqueId },
  });
  if (existing) return "skipped";

  let pvId: string | null = null;
  try {
    const pv = await prisma.pipelineVideo.create({
      data: {
        youtubeVideoId: uniqueId,
        youtubeUrl: story.url,
        starterStoryUrl: story.url,
        title: story.title || slug.replace(/-/g, " "),
        channelName: "Failory",
        publishedAt: new Date(),
        transcriptFetched: false,
        status: "DISCOVERED",
      },
    });
    pvId = pv.id;

    const interview = await scrapeFailoryInterview(story.url);
    if (!interview) {
      await prisma.pipelineVideo.update({
        where: { id: pvId },
        data: { status: "SKIPPED", errorMessage: "Interview text too short or parse failed" },
      });
      return "skipped";
    }

    // Revenue gate for sitemap-sourced interviews (revenue was unknown at index time)
    if (story.revenue === 0 && interview.revenue > 0 && interview.revenue < minRevenue) {
      await prisma.pipelineVideo.update({
        where: { id: pvId },
        data: {
          status: "SKIPPED",
          errorMessage: `Revenue $${interview.revenue}/mo below $${minRevenue}/mo minimum`,
        },
      });
      return "skipped";
    }

    await prisma.pipelineVideo.update({
      where: { id: pvId },
      data: {
        transcript: interview.interviewText,
        transcriptFetched: true,
        status: "PACK_GENERATED",
      },
    });

    const founderInfo = await extractFounderInfo(
      interview.interviewText,
      story.title,
      "Failory",
    );
    if (interview.founderFirstName) founderInfo.firstName = interview.founderFirstName;
    if (interview.founderLastName) founderInfo.lastName = interview.founderLastName;
    if (interview.company) founderInfo.company = interview.company;
    if (interview.revenue > 0 && !founderInfo.monthlyRevenue) {
      founderInfo.monthlyRevenue = interview.revenue;
    }

    if (!founderInfo.isFounderInterview && !interview.founderFirstName) {
      await prisma.pipelineVideo.update({
        where: { id: pvId },
        data: { status: "SKIPPED", errorMessage: "Not identified as founder interview" },
      });
      return "skipped";
    }

    const content = await generatePipelineContent(interview.interviewText);
    if (!content) {
      await prisma.pipelineVideo.update({
        where: { id: pvId },
        data: { status: "FAILED", errorMessage: "Content generation failed" },
      });
      return "failed";
    }

    const directEmail = interview.email;

    const newLead = await prisma.outreachLead.create({
      data: {
        pipelineVideoId: pvId,
        firstName: founderInfo.firstName,
        lastName: founderInfo.lastName || null,
        email: directEmail,
        emailConfidence: directEmail ? 90 : null,
        emailSource: directEmail ? "failory_page" : null,
        linkedinUrl: founderInfo.linkedinUrl,
        company: founderInfo.company,
        interviewSource: "Failory",
        interviewTopic: founderInfo.interviewTopic,
        specificMoment: founderInfo.specificMoment,
        linkedinPost: content.linkedinPost,
        twitterPost: content.twitterPost,
        newsletter: content.newsletter,
        monthlyRevenue:
          interview.revenue > 0 ? interview.revenue : founderInfo.monthlyRevenue,
        revenueStage: founderInfo.revenueStage,
        llmUsed: "openai-gpt4o",
        status: directEmail ? "EMAIL_FOUND" : "PENDING_EMAIL",
      },
      select: { id: true },
    });

    await prisma.pipelineVideo.update({
      where: { id: pvId },
      data: { status: "READY" },
    });

    if (!directEmail) {
      const emailResult = await findEmail(
        founderInfo.firstName,
        founderInfo.lastName,
        founderInfo.company,
        undefined,
        interview.websiteUrl ?? undefined,
        founderInfo.linkedinUrl ?? undefined,
        interview.twitterUrl ?? undefined,
      );
      await prisma.outreachLead.update({
        where: { id: newLead.id },
        data: {
          email: emailResult.email,
          emailConfidence:
            emailResult.email && emailResult.confidence > 0
              ? emailResult.confidence
              : null,
          emailSource: emailResult.email ? emailResult.source : null,
          emailAttemptLog: emailResult.attemptLog,
          status: emailResult.email ? "EMAIL_FOUND" : "NO_EMAIL",
        },
      });
    }

    console.log(
      `[Failory processStory] ✅ ${founderInfo.firstName} ${founderInfo.lastName} @ ${founderInfo.company}`,
    );
    return "processed";
  } catch (err) {
    console.error(`[Failory processStory] FAILED for ${story.url}:`, err);
    if (pvId) {
      await prisma.pipelineVideo
        .update({
          where: { id: pvId },
          data: { status: "FAILED", errorMessage: String(err) },
        })
        .catch(() => {});
    }
    return "failed";
  }
}

// ─── Main discovery orchestrator ─────────────────────────────────────────────

export async function runFailoryDiscovery(
  maxResults: number = 5,
  minRevenue: number = 5000,
): Promise<FailoryRunSummary> {
  console.log(
    `[runFailoryDiscovery] start — max=${maxResults} minRevenue=${minRevenue}`,
  );

  const stories = await scrapeFailoryIndex(maxResults, minRevenue);
  console.log(
    `[runFailoryDiscovery] ${stories.length} new interviews after dedup+filter`,
  );

  let processed = 0,
    skipped = 0,
    failed = 0;

  for (let i = 0; i < stories.length; i++) {
    console.log(
      `[runFailoryDiscovery] ${i + 1}/${stories.length}: ${stories[i].url}`,
    );
    const result = await processStory(stories[i], minRevenue);
    if (result === "processed") processed++;
    else if (result === "skipped") skipped++;
    else failed++;
    if (i < stories.length - 1) await sleep(2000);
  }

  console.log(
    `[runFailoryDiscovery] done — processed=${processed} skipped=${skipped} failed=${failed}`,
  );
  return { discovered: stories.length, processed, skipped, failed };
}
