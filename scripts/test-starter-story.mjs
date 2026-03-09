/**
 * Quick smoke test for the Starter Story scraper.
 * Run with:  node scripts/test-starter-story.mjs
 *
 * This script fetches the index page and one interview,
 * then prints what was extracted so you can verify selectors
 * are working before committing the full pipeline integration.
 */

import { load } from "cheerio";

const BASE = "https://www.starterstory.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

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

function parseRevenue(text) {
  const m = text.match(/\$([0-9,.]+)\s*([kKmM]?)(?:\/mo|\/month|\s+(?:per\s+)?month)?/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(num)) return null;
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "m") return Math.round(num * 1_000_000);
  if (suffix === "k") return Math.round(num * 1_000);
  return Math.round(num);
}

// ─── Scrape index ─────────────────────────────────────────────────────────────
async function scrapeIndex() {
  console.log("\n━━━ STEP 1: Fetching story index ━━━\n");
  const res = await fetch(`${BASE}/explore`, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
  console.log(`Status: ${res.status}`);
  if (!res.ok) return [];

  const html = await res.text();
  const $ = load(html);
  const stories = [];
  const seen = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href.match(/^\/stories\/[a-z0-9][a-z0-9-]+$/)) return;
    if (seen.has(href)) return;
    seen.add(href);

    const $card = $(el).closest("article, [class*='card'], [class*='story'], li, div");
    const cardText = ($card.length ? $card : $(el)).text();
    const revMatch = cardText.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month)/i);
    const revenueText = revMatch ? revMatch[0].trim() : "";
    const revenue = revenueText ? (parseRevenue(revenueText) ?? 0) : 0;
    const rawTitle = (
      $card.find("h1,h2,h3,h4,strong,.title").first().text().trim() ||
      $(el).text().trim()
    ).slice(0, 100);
    const title = /^\d[\d,]+$/.test(rawTitle.trim())
      ? href.replace(/^\/stories\//, "").replace(/-/g, " ")
      : rawTitle;

    stories.push({ url: `${BASE}${href}`, title, revenue, revenueText });
  });

  console.log(`Found ${stories.length} story links`);
  const withRevenue = stories.filter((s) => s.revenue > 0);
  console.log(`With revenue data: ${withRevenue.length}`);
  console.log(`\nFirst 5 stories:`);
  stories.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.title || "(no title)"}`);
    console.log(`     URL: ${s.url}`);
    console.log(`     Revenue: ${s.revenueText || "(not found)"} → $${s.revenue}/mo`);
  });

  return stories;
}

// ─── Scrape interview ─────────────────────────────────────────────────────────
async function scrapeInterview(url) {
  console.log(`\n━━━ STEP 2: Fetching interview ━━━`);
  console.log(`URL: ${url}\n`);

  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
  console.log(`Status: ${res.status}`);
  if (!res.ok) return null;

  const html = await res.text();
  const $ = load(html);

  // Interview text
  const qaFromClass = [];
  $("[class*='question']").each((_, el) => {
    const q = $(el).text().trim();
    if (q.length < 10) return;
    const answer = $(el).next("[class*='answer']").text().trim() ||
      $(el).nextAll("p").slice(0, 5).map((_, p) => $(p).text().trim()).get().join(" ");
    if (answer) qaFromClass.push(`Q: ${q}\nA: ${answer}`);
  });

  const qaFromH2 = [];
  $("article h2, .content h2, main h2, h2").each((_, el) => {
    const q = $(el).text().trim();
    if (!q || q.length < 15 || q.length > 300) return;
    const answers = [];
    let sib = $(el).next();
    while (sib.length && !sib.is("h1,h2,h3,h4")) {
      const t = sib.text().trim();
      if (t.length > 20) answers.push(t);
      sib = sib.next();
    }
    if (answers.length > 0) qaFromH2.push(`Q: ${q}\nA: ${answers.join(" ")}`);
  });

  const paras = [];
  $("p").each((_, el) => {
    const t = $(el).text().trim();
    if (t.length < 40) return;
    const tLower = t.toLowerCase();
    if (PAYWALL_PHRASES.some((phrase) => tLower.includes(phrase))) return;
    paras.push(t);
  });

  let interviewText =
    qaFromClass.length >= 3
      ? qaFromClass.join("\n\n")
      : qaFromH2.length >= 3
        ? qaFromH2.join("\n\n")
        : paras.join("\n\n");

  // Fall back to meta description if not enough text
  if (interviewText.length < 200) {
    const metaDesc = $("meta[name='description']").attr("content")?.trim() ?? "";
    if (metaDesc.length > 100) {
      interviewText = interviewText ? `${metaDesc}\n\n${interviewText}` : metaDesc;
    }
  }

  // Social links
  let websiteUrl = null, twitterUrl = null, email = null;
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href.startsWith("http") || href.includes("starterstory.com")) return;
    if (!twitterUrl && /(?:twitter|x)\.com\/(?!search|intent)[a-z0-9_]{2,50}/i.test(href) && !/\/starter_story|\/starterstory/i.test(href)) twitterUrl = href.split("?")[0];
    if (!websiteUrl && !/(twitter|x|linkedin|facebook|instagram|youtube)\.com/.test(href)) websiteUrl = href.split("?")[0];
  });

  const INVALID_FRAG = ["noreply", "no-reply", "@example", "sentry", "starterstory", "support@", "your@email"];
  const pageText = $.text();
  const emailCandidates = pageText.match(EMAIL_RE) ?? [];
  email = emailCandidates.find((e) => !INVALID_FRAG.some((f) => e.toLowerCase().includes(f))) ?? null;

  // Revenue: prefer OG title (most reliable)
  const ogTitle = $("meta[property='og:title']").attr("content") ?? $("title").text() ?? "";
  const revFromTitle = ogTitle.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month|\/yr|\/year|\s+(?:per\s+)?month)/i);
  const revFromPage = pageText.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month)/i);
  const revM = revFromTitle ?? revFromPage;
  const revenueText = revM?.[0]?.trim() ?? "";
  const revenue = revenueText ? (parseRevenue(revenueText) ?? 0) : 0;

  console.log(`Page title: ${ogTitle}`);
  console.log(`\nInterview extraction methods:`);
  console.log(`  .question blocks found: ${qaFromClass.length}`);
  console.log(`  h2 Q&A blocks found: ${qaFromH2.length}`);
  console.log(`  Paragraph blocks found: ${paras.length}`);
  console.log(`\nChosen method: ${qaFromClass.length >= 3 ? ".question" : qaFromH2.length >= 3 ? "h2" : "paragraphs"}`);
  console.log(`Interview text length: ${interviewText.length} chars`);
  console.log(`Interview preview (first 300 chars):\n  ${interviewText.slice(0, 300).replace(/\n/g, "\n  ")}`);
  console.log(`\nWebsite URL: ${websiteUrl ?? "(not found)"}`);
  console.log(`Twitter URL: ${twitterUrl ?? "(not found)"}`);
  console.log(`Email on page: ${email ?? "(not found)"}`);
  console.log(`Revenue: ${revenueText || "(not found)"} → $${revenue}/mo`);

  return { interviewText, websiteUrl, twitterUrl, email, revenue, revenueText };
}

// ─── Run test ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Starter Story Scraper Test\n");
  try {
    const stories = await scrapeIndex();

    if (!stories.length) {
      console.log("\n⚠️  No stories found — page structure may have changed. Check HTML manually.");
      return;
    }

    // Test first story (or first with revenue)
    const testStory = stories.find((s) => s.revenue > 0) ?? stories[0];
    const interview = await scrapeInterview(testStory.url);

    if (!interview) {
      console.log("\n❌ Could not fetch interview — check URL and network");
      return;
    }

    console.log("\n━━━ SUMMARY ━━━");
    console.log(interview.interviewText.length >= 150
      ? `✅ Interview text: ${interview.interviewText.length} chars — GOOD`
      : `⚠️  Interview text: ${interview.interviewText.length} chars — TOO SHORT (need 150+)`);
    console.log(interview.email
      ? `✅ Email found directly on page: ${interview.email}`
      : `ℹ️  No email on page — will use waterfall`);
    console.log(interview.twitterUrl ? `✅ Twitter: ${interview.twitterUrl}` : `ℹ️  No Twitter found`);
    console.log(interview.websiteUrl ? `✅ Website: ${interview.websiteUrl}` : `ℹ️  No website found`);

    console.log("\n✅ Scraper is working. Run the pipeline from /admin/pipeline to process real leads.");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
  }
}

main();
