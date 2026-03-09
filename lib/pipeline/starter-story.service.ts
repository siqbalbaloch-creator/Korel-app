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

const BASE = "https://www.starterstory.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const FETCH_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Paywall / boilerplate phrases that appear after the free preview ends
const PAYWALL_PHRASES = [
  "join our free newsletter",
  "we just need your email",
  "unlimited access to all startup data",
  "starter story account",
  "automatically log in",
  "existing password still works",
  "database of 4,",
  "community of thousands",
  "proven system to find",
  "ship an app that gets users",
  "turning their ideas into real products",
];

// ─── Revenue parsing ──────────────────────────────────────────────────────────

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

// ─── Scrape index page(s) ─────────────────────────────────────────────────────

export type IndexStory = {
  url: string;
  title: string;
  revenue: number;
  revenueText: string;
  niche: string;
};

export async function scrapeStarterStoryIndex(
  maxResults: number = 10,
  minRevenue: number = 5000,
): Promise<IndexStory[]> {
  const candidates: IndexStory[] = [];
  const pages = [
    `${BASE}/explore`,
    `${BASE}/explore?page=2`,
    `${BASE}/explore?page=3`,
  ];

  for (const pageUrl of pages) {
    if (candidates.length >= maxResults * 3) break; // over-fetch, filter later
    try {
      const res = await fetch(pageUrl, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        console.warn(`[scrapeStarterStoryIndex] ${pageUrl} returned ${res.status}`);
        continue;
      }
      const html = await res.text();
      const $ = load(html);
      const seen = new Set<string>();

      // Find all links pointing to individual story pages: /stories/[slug]
      $('a[href]').each((_, el) => {
        const href = $(el).attr("href") ?? "";
        // Only exact /stories/[slug] paths — not /stories itself or /stories?...
        if (!href.match(/^\/stories\/[a-z0-9][a-z0-9-]+$/)) return;
        if (seen.has(href)) return;
        seen.add(href);

        const fullUrl = `${BASE}${href}`;

        // Gather text from the link and its parent card element
        const $card = $(el).closest("article, [class*='card'], [class*='story'], li, div");
        const cardText = ($card.length ? $card : $(el)).text();

        // Revenue: look for $Xk/mo pattern anywhere in card text
        const revMatch = cardText.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month)/i);
        const revenueText = revMatch ? revMatch[0].trim() : "";
        const revenue = revenueText ? (parseRevenue(revenueText) ?? 0) : 0;

        // Title: prefer heading inside the card, else the link text, else slug
        const rawTitle = (
          $card.find("h1,h2,h3,h4,strong,.title").first().text().trim() ||
          $(el).text().trim()
        ).slice(0, 150);
        // If title looks like a number (views count), fall back to humanized slug
        const title = /^\d[\d,]+$/.test(rawTitle.trim())
          ? href.replace(/^\/stories\//, "").replace(/-/g, " ")
          : rawTitle;

        // Niche: any small category tag
        const niche = $card.find(".niche,.category,.tag,.badge,.label").first().text().trim();

        candidates.push({ url: fullUrl, title, revenue, revenueText, niche });
      });

      await sleep(1200);
    } catch (err) {
      console.error(`[scrapeStarterStoryIndex] Error fetching ${pageUrl}:`, err);
    }
  }

  if (!candidates.length) {
    console.warn("[scrapeStarterStoryIndex] No story links found — Starter Story page structure may have changed");
    return [];
  }

  // Deduplication: skip already-processed story URLs
  const allUrls = candidates.map((c) => c.url);
  const existing = await prisma.pipelineVideo.findMany({
    where: { starterStoryUrl: { in: allUrls } },
    select: { starterStoryUrl: true },
  });
  const existingUrls = new Set(existing.map((e) => e.starterStoryUrl));

  return candidates
    .filter((c) => c.revenue >= minRevenue && !existingUrls.has(c.url))
    .slice(0, maxResults);
}

// ─── Scrape individual interview ─────────────────────────────────────────────

export type InterviewData = {
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

export async function scrapeStarterStoryInterview(
  storyUrl: string,
): Promise<InterviewData | null> {
  try {
    const res = await fetch(storyUrl, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[scrapeStarterStoryInterview] ${storyUrl} returned ${res.status}`);
      return null;
    }
    const html = await res.text();
    const $ = load(html);

    // ── Interview text ──────────────────────────────────────────────────────
    let interviewText = "";

    // Approach 1: explicit .question/.answer class elements (full access)
    const qaFromClass: string[] = [];
    $("[class*='question']").each((_, el) => {
      const q = $(el).text().trim();
      if (q.length < 10) return;
      const answer =
        $(el).next("[class*='answer']").text().trim() ||
        $(el).nextAll("p").slice(0, 5).map((_, p) => $(p).text().trim()).get().join(" ");
      if (answer) qaFromClass.push(`Q: ${q}\nA: ${answer}`);
    });

    if (qaFromClass.length >= 3) {
      interviewText = qaFromClass.join("\n\n");
    } else {
      // Approach 2: h2/h3 as questions, following <p> tags as answers (full access)
      const qaFromHeadings: string[] = [];
      $("article h2, .content h2, main h2, [class*='story'] h2, [class*='content'] h2, h2").each((_, el) => {
        const q = $(el).text().trim();
        if (!q || q.length < 15 || q.length > 300) return;
        const answers: string[] = [];
        let sibling = $(el).next();
        while (sibling.length && !sibling.is("h1,h2,h3,h4")) {
          const t = sibling.text().trim();
          if (t.length > 20) answers.push(t);
          sibling = sibling.next();
        }
        if (answers.length > 0) {
          qaFromHeadings.push(`Q: ${q}\nA: ${answers.join(" ")}`);
        }
      });

      if (qaFromHeadings.length >= 3) {
        interviewText = qaFromHeadings.join("\n\n");
      } else {
        // Approach 3: paragraph text — filter out paywall/boilerplate paragraphs
        const paras: string[] = [];
        $("p").each((_, el) => {
          const t = $(el).text().trim();
          if (t.length < 40) return;
          const tLower = t.toLowerCase();
          if (PAYWALL_PHRASES.some((phrase) => tLower.includes(phrase))) return;
          paras.push(t);
        });
        interviewText = paras.join("\n\n");
      }
    }

    // Approach 4: fall back to meta description (always has brief founder intro)
    if (interviewText.length < 200) {
      const metaDesc = $("meta[name='description']").attr("content")?.trim() ?? "";
      if (metaDesc.length > 100) {
        interviewText = interviewText ? `${metaDesc}\n\n${interviewText}` : metaDesc;
      }
    }

    if (interviewText.length < 150) {
      console.warn(`[scrapeStarterStoryInterview] Interview text too short (${interviewText.length} chars) for ${storyUrl}`);
      return null;
    }

    // ── Founder / company info ──────────────────────────────────────────────

    // Try JSON-LD structured data first (most reliable)
    let founderName = "";
    let company = "";

    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const data = JSON.parse($(el).text()) as Record<string, unknown>;
        if (!founderName && data.author && typeof data.author === "object") {
          const auth = data.author as Record<string, unknown>;
          if (typeof auth.name === "string" && auth.name.trim()) founderName = auth.name.trim();
        }
        if (!company && typeof data.name === "string" && data.name.trim()) company = data.name.trim();
      } catch { /* ignore */ }
    });

    // Try page-specific selectors
    if (!founderName) {
      founderName = (
        $("[class*='founder'] h1,[class*='founder'] h2,[class*='founder'] h3").first().text() ||
        $("[class*='author'] [class*='name']").first().text() ||
        $(".interviewee,.subject,.founder-name").first().text()
      ).trim();
    }
    if (!company) {
      company = (
        $("[class*='company'] h1,[class*='company'] h2,[class*='business']").first().text() ||
        $("[class*='company-name'],[class*='business-name']").first().text()
      ).trim();
    }

    // Fallback: parse from og:title or page title
    const pageTitle =
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      "";
    if (!founderName || !company) {
      const m = pageTitle.match(
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:started|built|grew|founded|runs|of)\s+([A-Za-z0-9\s&.,'()-]+)/i,
      );
      if (m) {
        if (!founderName) founderName = m[1].trim();
        if (!company) company = m[2].trim().replace(/\s+/g, " ").slice(0, 60);
      }
    }

    const nameParts = founderName.trim().split(/\s+/);
    const founderFirstName = nameParts[0] ?? "";
    const founderLastName = nameParts.slice(1).join(" ");

    // ── Social / contact links ──────────────────────────────────────────────
    let websiteUrl: string | null = null;
    let twitterUrl: string | null = null;

    $("a[href]").each((_, el) => {
      const href = ($(el).attr("href") ?? "").trim();
      if (!href.startsWith("http")) return;
      if (href.includes("starterstory.com")) return;

      // Twitter / X — skip Starter Story's own account and common exclusions
      if (
        !twitterUrl &&
        /(?:twitter|x)\.com\/(?!search|intent|hashtag|home|share)[a-z0-9_]{2,50}/i.test(href) &&
        !/\/starter_story|\/starterstory/i.test(href)
      ) {
        twitterUrl = href.split("?")[0];
      }
      // External website (skip all major social networks)
      if (
        !websiteUrl &&
        !/(twitter|x|linkedin|facebook|instagram|youtube|pinterest|tiktok)\.com/.test(href)
      ) {
        websiteUrl = href.split("?")[0].replace(/\/$/, "");
      }
    });

    // ── Email directly on page ──────────────────────────────────────────────
    const INVALID_FRAG = ["noreply", "no-reply", "@example", "sentry", "starterstory", "support@"];
    const pageText = $.text();
    const emailCandidates = pageText.match(EMAIL_RE) ?? [];
    const email = emailCandidates.find(
      (e) => !INVALID_FRAG.some((f) => e.toLowerCase().includes(f)),
    ) ?? null;

    // ── Revenue ─────────────────────────────────────────────────────────────
    // Check OG title first — it's most reliable (e.g. "Makes $200K/Month")
    const ogDesc = $("meta[property='og:title']").attr("content") ?? $("title").text() ?? "";
    const revFromTitle = ogDesc.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month|\/yr|\/year|\s+(?:per\s+)?month)/i);
    const revFromPage = pageText.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month)/i);
    const revMatch = revFromTitle ?? revFromPage;
    const revenueText = revMatch?.[0]?.trim() ?? "";
    const revenue = revenueText ? (parseRevenue(revenueText) ?? 0) : 0;

    // ── Founded year ────────────────────────────────────────────────────────
    const yearM = pageText.match(/(?:founded|started|launched)\s+(?:in\s+)?(\d{4})/i);
    const foundedYear = yearM ? parseInt(yearM[1]) : null;

    const niche = ($("meta[name='keywords']").attr("content") ?? "").split(",")[0].trim();

    return {
      interviewText: interviewText.slice(0, 15000),
      founderFirstName,
      founderLastName,
      company: company.slice(0, 100),
      websiteUrl,
      twitterUrl,
      email,
      revenue,
      revenueText,
      niche,
      foundedYear,
    };
  } catch (err) {
    console.error(`[scrapeStarterStoryInterview] Error for ${storyUrl}:`, err);
    return null;
  }
}

// ─── Generate content from interview text ────────────────────────────────────

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
    console.error("[generatePipelineContent] Error:", err);
    return null;
  }
}

// ─── Process a single story ───────────────────────────────────────────────────

async function processStory(story: IndexStory): Promise<"processed" | "skipped" | "failed"> {
  const slug = story.url.replace(/.*\/stories\//, "");
  const uniqueId = `ss_${slug}`;

  // Re-check deduplication (race condition safety)
  const existing = await prisma.pipelineVideo.findUnique({ where: { youtubeVideoId: uniqueId } });
  if (existing) return "skipped";

  let pvId: string | null = null;
  try {
    // 1. Create PipelineVideo immediately (prevents duplicate concurrent runs)
    const pv = await prisma.pipelineVideo.create({
      data: {
        youtubeVideoId: uniqueId,
        youtubeUrl: story.url, // story URL stored here — powers the card link
        starterStoryUrl: story.url,
        title: story.title || slug.replace(/-/g, " "),
        channelName: "Starter Story",
        publishedAt: new Date(),
        transcriptFetched: false,
        status: "DISCOVERED",
      },
    });
    pvId = pv.id;

    // 2. Scrape the full interview
    const interview = await scrapeStarterStoryInterview(story.url);
    if (!interview) {
      await prisma.pipelineVideo.update({
        where: { id: pvId },
        data: { status: "SKIPPED", errorMessage: "Interview text too short or parse failed" },
      });
      return "skipped";
    }

    await prisma.pipelineVideo.update({
      where: { id: pvId },
      data: { transcript: interview.interviewText, transcriptFetched: true, status: "PACK_GENERATED" },
    });

    // 3. Extract founder info via GPT (then override with scraped data)
    const founderInfo = await extractFounderInfo(interview.interviewText, story.title, "Starter Story");
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

    // 4. Generate content pack (LinkedIn post, X thread, newsletter)
    const content = await generatePipelineContent(interview.interviewText);
    if (!content) {
      await prisma.pipelineVideo.update({
        where: { id: pvId },
        data: { status: "FAILED", errorMessage: "Content generation failed" },
      });
      return "failed";
    }

    // 5. If email found directly on the page, skip the waterfall
    const directEmail = interview.email;

    // 6. Create OutreachLead
    const newLead = await prisma.outreachLead.create({
      data: {
        pipelineVideoId: pvId,
        firstName: founderInfo.firstName,
        lastName: founderInfo.lastName || null,
        email: directEmail,
        emailConfidence: directEmail ? 99 : null,
        emailSource: directEmail ? "starter_story_page" : null,
        linkedinUrl: founderInfo.linkedinUrl,
        company: founderInfo.company,
        interviewSource: "Starter Story",
        interviewTopic: founderInfo.interviewTopic,
        specificMoment: founderInfo.specificMoment,
        linkedinPost: content.linkedinPost,
        twitterPost: content.twitterPost,
        newsletter: content.newsletter,
        monthlyRevenue: interview.revenue > 0 ? interview.revenue : founderInfo.monthlyRevenue,
        revenueStage: founderInfo.revenueStage,
        llmUsed: "openai-gpt4o",
        status: directEmail ? "EMAIL_FOUND" : "PENDING_EMAIL",
      },
      select: { id: true },
    });

    await prisma.pipelineVideo.update({ where: { id: pvId }, data: { status: "READY" } });

    // 7. Run email waterfall only if no email found on page
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
          emailConfidence: emailResult.email && emailResult.confidence > 0 ? emailResult.confidence : null,
          emailSource: emailResult.email ? emailResult.source : null,
          emailAttemptLog: emailResult.attemptLog,
          status: emailResult.email ? "EMAIL_FOUND" : "NO_EMAIL",
        },
      });
    }

    console.log(
      `[processStory] ✅ ${founderInfo.firstName} ${founderInfo.lastName} @ ${founderInfo.company} — email=${directEmail ?? "waterfall"}`,
    );
    return "processed";
  } catch (err) {
    console.error(`[processStory] FAILED for ${story.url}:`, err);
    if (pvId) {
      await prisma.pipelineVideo
        .update({ where: { id: pvId }, data: { status: "FAILED", errorMessage: String(err) } })
        .catch(() => {});
    }
    return "failed";
  }
}

// ─── Main discovery orchestrator ─────────────────────────────────────────────

export type StarterStoryRunSummary = {
  discovered: number;
  processed: number;
  skipped: number;
  failed: number;
};

export async function runStarterStoryDiscovery(
  maxResults: number = 10,
  minRevenue: number = 5000,
): Promise<StarterStoryRunSummary> {
  console.log(`[runStarterStoryDiscovery] start — max=${maxResults} minRevenue=${minRevenue}`);

  const stories = await scrapeStarterStoryIndex(maxResults, minRevenue);
  console.log(`[runStarterStoryDiscovery] ${stories.length} new stories after dedup+filter`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < stories.length; i++) {
    console.log(`[runStarterStoryDiscovery] ${i + 1}/${stories.length}: ${stories[i].url}`);
    const result = await processStory(stories[i]);
    if (result === "processed") processed++;
    else if (result === "skipped") skipped++;
    else failed++;

    if (i < stories.length - 1) await sleep(2000);
  }

  console.log(
    `[runStarterStoryDiscovery] done — processed=${processed} skipped=${skipped} failed=${failed}`,
  );
  return { discovered: stories.length, processed, skipped, failed };
}
