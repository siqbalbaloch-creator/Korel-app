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

const IH_BASE = "https://www.indiehackers.com";
const SITEMAP_BASE =
  "https://storage.googleapis.com/indie-hackers.appspot.com/sitemaps";
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

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

export type IndieHackersRunSummary = {
  discovered: number;
  processed: number;
  skipped: number;
  failed: number;
};

// ─── Revenue parsing from URL slug ────────────────────────────────────────────
// IH encodes revenue in post slugs: "to-33-000-mo", "70k-mo", "12k-mo"

function parseRevenueFromSlug(slug: string): number | null {
  // Pattern 1: "70k-mo", "150k-mo" — Nk-mo
  const m1 = slug.match(/(\d+)k-mo/i);
  if (m1) return parseInt(m1[1]) * 1000;
  // Pattern 2: "33-000-mo", "40-000-mo" — N-NNN-mo
  const m2 = slug.match(/(\d+)-(\d{3})-mo/);
  if (m2) return parseInt(m2[1]) * 1000 + parseInt(m2[2]);
  // Pattern 3: plain 4+ digit, e.g. "3000-mo"
  const m3 = slug.match(/(\d{4,})-mo/);
  if (m3) return parseInt(m3[1]);
  return null;
}

function parseRevenue(text: string): number | null {
  const m = text.match(/\$([0-9,.]+)\s*([kKmM]?)(?:\/mo|\/month|\s+(?:per\s+)?month)?/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(num)) return null;
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "m") return Math.round(num * 1_000_000);
  if (suffix === "k") return Math.round(num * 1_000);
  return Math.round(num);
}

// ─── Scrape IH sitemaps for qualifying post URLs ──────────────────────────────

export async function scrapeIndieHackersIndex(
  maxResults: number = 10,
  minRevenue: number = 5000,
): Promise<IndexStory[]> {
  const candidates: IndexStory[] = [];

  for (let sitemapNum = 1; sitemapNum <= 5; sitemapNum++) {
    if (candidates.length >= maxResults * 5) break;

    try {
      const res = await fetch(`${SITEMAP_BASE}/ih-sitemap-${sitemapNum}.xml`, {
        headers: { "User-Agent": FETCH_HEADERS["User-Agent"] },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      // Extract all /post/ URLs
      const postUrls = (xml.match(/<loc>[^<]+\/post\/[^<]+<\/loc>/g) ?? []).map((m) =>
        m.replace(/<\/?loc>/g, ""),
      );

      for (const url of postUrls) {
        const slug = url.split("/post/")[1] ?? "";
        // Must have revenue pattern in slug
        if (!/-mo/.test(slug)) continue;
        const revenue = parseRevenueFromSlug(slug);
        if (revenue === null || revenue < minRevenue) continue;

        // Firebase ID = last hyphen-separated segment (mixed case alphanumeric)
        const firebaseId = slug.split("-").pop() ?? "";
        if (!firebaseId || firebaseId.length < 8) continue; // sanity check

        // Human-readable title from slug (strip firebase ID)
        const titleSlug = slug.slice(0, slug.lastIndexOf("-" + firebaseId));
        const title = titleSlug.replace(/-/g, " ").slice(0, 120);
        const revenueText =
          revenue >= 1_000_000
            ? `$${Math.round(revenue / 1_000_000)}M/mo`
            : revenue >= 1_000
              ? `$${Math.round(revenue / 1_000)}k/mo`
              : `$${revenue}/mo`;

        candidates.push({ url, title, revenue, revenueText, niche: "" });
      }

      await sleep(400); // polite delay between sitemaps
    } catch (err) {
      console.error(`[scrapeIndieHackersIndex] sitemap ${sitemapNum} error:`, err);
    }
  }

  if (!candidates.length) {
    console.warn("[scrapeIndieHackersIndex] No qualifying posts found in IH sitemaps");
    return [];
  }

  // Shuffle for variety across sitemaps
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Dedup: check which posts are already in DB (check a limited sample)
  const sample = candidates.slice(0, maxResults * 8);
  const sampleIds = sample.map((c) => `ih_${c.url.split("-").pop() ?? ""}`);
  const existing = await prisma.pipelineVideo.findMany({
    where: { youtubeVideoId: { in: sampleIds } },
    select: { youtubeVideoId: true },
  });
  const existingIds = new Set(existing.map((e) => e.youtubeVideoId));

  return sample
    .filter((c) => !existingIds.has(`ih_${c.url.split("-").pop() ?? ""}`))
    .slice(0, maxResults);
}

// ─── Scrape individual IH interview page ─────────────────────────────────────

export async function scrapeIndieHackersInterview(
  url: string,
): Promise<InterviewData | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[scrapeIndieHackersInterview] ${url} returned ${res.status}`);
      return null;
    }
    const html = await res.text();
    const $ = load(html);

    // ── Interview text: H2 headings as questions (confirmed IH format) ────────
    const qaFromH2: string[] = [];
    $("h2").each((_, el) => {
      const q = $(el).text().trim();
      if (!q || q.length < 10 || q.length > 300) return;
      const answers: string[] = [];
      let sibling = $(el).next();
      while (sibling.length && !sibling.is("h1,h2,h3,h4")) {
        const t = sibling.text().trim();
        if (t.length > 20) answers.push(t);
        sibling = sibling.next();
      }
      if (answers.length > 0) qaFromH2.push(`Q: ${q}\nA: ${answers.join(" ")}`);
    });

    let interviewText = qaFromH2.length >= 3 ? qaFromH2.join("\n\n") : "";

    // Fallback: all substantial paragraphs
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
        `[scrapeIndieHackersInterview] Text too short (${interviewText.length} chars) for ${url}`,
      );
      return null;
    }

    // ── Revenue ───────────────────────────────────────────────────────────────
    const ogTitle =
      $("meta[property='og:title']").attr("content") ?? $("title").text() ?? "";
    const pageText = $.text();
    const revFromTitle = ogTitle.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month)/i);
    const revFromPage = pageText.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month)/i);
    const revenueText = (revFromTitle ?? revFromPage)?.[0]?.trim() ?? "";
    const revenue = revenueText ? (parseRevenue(revenueText) ?? 0) : 0;

    // ── Founder name: from first paragraph ────────────────────────────────────
    let founderName = "";
    const firstPara = $("p").first().text().trim();
    const nameMatch =
      firstPara.match(
        /^(?:Hi(?:,|!|\s+there)?!?\s+)?(?:I'm|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      ) ??
      firstPara.match(
        /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:founder|co-founder|CEO|CTO|co-CEO)/i,
      );
    if (nameMatch) founderName = nameMatch[1].trim();

    const nameParts = founderName.trim().split(/\s+/);
    const founderFirstName = nameParts[0] ?? "";
    const founderLastName = nameParts.slice(1).join(" ");

    // ── Company: extract from OG title ────────────────────────────────────────
    let company = "";
    const companyMatch = ogTitle.match(
      /(?:of|for|at|with|behind|building|growing|running)\s+([A-Za-z0-9][A-Za-z0-9\s\-&.,']+?)(?:\s+to\s+\$|\s+-|\s+from|\s+by\s|[,!]|$)/i,
    );
    if (companyMatch) company = companyMatch[1].trim().slice(0, 60);

    // ── Social / contact ──────────────────────────────────────────────────────
    let websiteUrl: string | null = null;
    let twitterUrl: string | null = null;

    $("a[href]").each((_, el) => {
      const href = ($(el).attr("href") ?? "").trim();
      if (!href.startsWith("http")) return;
      if (href.includes("indiehackers.com")) return;

      if (
        !twitterUrl &&
        /(?:twitter|x)\.com\/(?!search|intent|hashtag|home|share)[a-z0-9_]{2,50}/i.test(href) &&
        !/\/indiehackers|\/starterstory|\/indie_hack/i.test(href)
      ) {
        twitterUrl = href.split("?")[0];
      }
      if (
        !websiteUrl &&
        !/(twitter|x|linkedin|facebook|instagram|youtube|pinterest|tiktok)\.com/.test(href)
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
      "indiehackers",
      "support@",
    ];
    const emailCandidates = pageText.match(EMAIL_RE) ?? [];
    const email =
      emailCandidates.find(
        (e) => !INVALID_FRAG.some((f) => e.toLowerCase().includes(f)),
      ) ?? null;

    // ── Founded year ──────────────────────────────────────────────────────────
    const yearM = pageText.match(/(?:founded|started|launched)\s+(?:in\s+)?(\d{4})/i);
    const foundedYear = yearM ? parseInt(yearM[1]) : null;

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
      niche: "",
      foundedYear,
    };
  } catch (err) {
    console.error(`[scrapeIndieHackersInterview] Error for ${url}:`, err);
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
    console.error("[IH generatePipelineContent] Error:", err);
    return null;
  }
}

// ─── Process a single post ────────────────────────────────────────────────────

async function processStory(
  story: IndexStory,
): Promise<"processed" | "skipped" | "failed"> {
  const firebaseId = story.url.split("-").pop() ?? "";
  const uniqueId = `ih_${firebaseId}`;

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
        title: story.title || firebaseId,
        channelName: "Indie Hackers",
        publishedAt: new Date(),
        transcriptFetched: false,
        status: "DISCOVERED",
      },
    });
    pvId = pv.id;

    const interview = await scrapeIndieHackersInterview(story.url);
    if (!interview) {
      await prisma.pipelineVideo.update({
        where: { id: pvId },
        data: { status: "SKIPPED", errorMessage: "Interview text too short or parse failed" },
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
      "Indie Hackers",
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
        emailSource: directEmail ? "indie_hackers_page" : null,
        linkedinUrl: founderInfo.linkedinUrl,
        company: founderInfo.company,
        interviewSource: "Indie Hackers",
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
      `[IH processStory] ✅ ${founderInfo.firstName} ${founderInfo.lastName} @ ${founderInfo.company}`,
    );
    return "processed";
  } catch (err) {
    console.error(`[IH processStory] FAILED for ${story.url}:`, err);
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

export async function runIndieHackersDiscovery(
  maxResults: number = 10,
  minRevenue: number = 5000,
): Promise<IndieHackersRunSummary> {
  console.log(
    `[runIndieHackersDiscovery] start — max=${maxResults} minRevenue=${minRevenue}`,
  );

  const stories = await scrapeIndieHackersIndex(maxResults, minRevenue);
  console.log(
    `[runIndieHackersDiscovery] ${stories.length} new posts after dedup+filter`,
  );

  let processed = 0,
    skipped = 0,
    failed = 0;

  for (let i = 0; i < stories.length; i++) {
    console.log(
      `[runIndieHackersDiscovery] ${i + 1}/${stories.length}: ${stories[i].url.slice(-70)}`,
    );
    const result = await processStory(stories[i]);
    if (result === "processed") processed++;
    else if (result === "skipped") skipped++;
    else failed++;
    if (i < stories.length - 1) await sleep(2000);
  }

  console.log(
    `[runIndieHackersDiscovery] done — processed=${processed} skipped=${skipped} failed=${failed}`,
  );
  return { discovered: stories.length, processed, skipped, failed };
}

// Re-export for type checking
export { IH_BASE };
