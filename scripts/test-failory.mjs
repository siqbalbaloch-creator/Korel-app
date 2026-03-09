/**
 * Quick smoke test for the Failory scraper.
 * Run with:  node scripts/test-failory.mjs
 */

import { load } from "cheerio";

const BASE = "https://www.failory.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const FAILORY_TWITTER_EXCLUDE = ["hellofailory", "nicocerdeira", "failory"];

function parseFailoryRevenueLower(rangeText) {
  if (!rangeText || rangeText === "No Data") return 0;
  const plus = rangeText.match(/^\+\$(\d+)k/i);
  if (plus) return parseInt(plus[1]) * 1000;
  const firstNum = rangeText.match(/^\$(\d+)(k?)\s*-/i);
  if (firstNum) {
    const n = parseInt(firstNum[1]);
    const hasK = firstNum[2].toLowerCase() === "k";
    return hasK ? n * 1000 : n;
  }
  return 0;
}

function parseRevenue(text) {
  const m = text.match(/\$([0-9,.]+)\s*([kKmM]?)(?:\/mo|\/month|MRR)?/i);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(num)) return 0;
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "m") return Math.round(num * 1_000_000);
  if (suffix === "k") return Math.round(num * 1_000);
  return Math.round(num);
}

async function scrapeIndex() {
  console.log("\n━━━ STEP 1: Fetching Failory index ━━━\n");

  const res = await fetch(`${BASE}/interviews`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });
  console.log(`Status: ${res.status}`);
  if (!res.ok) return [];

  const html = await res.text();
  const $ = load(html);
  const stories = [];

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
    stories.push({ url: fullUrl, title, revenue, revenueText: revText, niche });
  });

  console.log(`Found ${stories.length} interview cards`);
  const withRevenue = stories.filter((s) => s.revenue > 0);
  console.log(`With revenue data: ${withRevenue.length}`);
  console.log(`\nFirst 5:`);
  stories.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.title || "(no title)"}`);
    console.log(`     Revenue: ${s.revenueText || "(none)"} → lower bound $${s.revenue}/mo`);
    console.log(`     Niche: ${s.niche || "(none)"}`);
  });

  return stories;
}

async function scrapeInterview(url) {
  console.log(`\n━━━ STEP 2: Fetching interview ━━━`);
  console.log(`URL: ${url}\n`);

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });
  console.log(`Status: ${res.status}`);
  if (!res.ok) return null;

  const html = await res.text();
  const $ = load(html);

  // Q&A via H2/H3 headings
  const qaFromHeadings = [];
  $("h2, h3").each((_, el) => {
    const q = $(el).text().trim();
    if (!q || q.length < 10 || q.length > 300) return;
    const answers = [];
    let sib = $(el).next();
    while (sib.length && !sib.is("h1,h2,h3,h4")) {
      const t = sib.text().trim();
      if (t.length > 20) answers.push(t);
      sib = sib.next();
    }
    if (answers.length > 0)
      qaFromHeadings.push(`Q: ${q}\nA: ${answers.join(" ")}`);
  });

  let interviewText =
    qaFromHeadings.length >= 3 ? qaFromHeadings.join("\n\n") : "";
  if (!interviewText) {
    const paras = [];
    $("p").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 50) paras.push(t);
    });
    interviewText = paras.join("\n\n");
  }

  const ogTitle =
    $("meta[property='og:title']").attr("content") || $("title").text() || "";
  const pageText = $.text();
  const revFromTitle = ogTitle.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month|MRR)/i);
  const revFromPage = pageText.match(/\$[0-9,.]+\s*[kKmM]?(?:\/mo|\/month|MRR)/i);
  const revenueText = (revFromTitle ?? revFromPage)?.[0]?.trim() ?? "";
  const revenue = revenueText ? parseRevenue(revenueText) : 0;

  // Founder name
  const firstH2 = $("h2").first().text().trim();
  const firstPara = $("p").first().text().trim();
  const nameMatch = (firstH2 + " " + firstPara).match(
    /(?:I'm|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  );
  const founderName = nameMatch ? nameMatch[1] : "(not found)";

  // Social links
  let websiteUrl = null,
    twitterUrl = null;
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href.startsWith("http")) return;
    if (
      href.includes("failory.com") ||
      href.includes("podia.com") ||
      href.includes("calendly.com")
    )
      return;
    if (
      !twitterUrl &&
      /(?:twitter|x)\.com\/(?!search|intent)[a-z0-9_]{2,50}/i.test(href) &&
      !FAILORY_TWITTER_EXCLUDE.some((ex) => href.toLowerCase().includes(ex))
    )
      twitterUrl = href.split("?")[0];
    if (
      !websiteUrl &&
      !/(twitter|x|linkedin|facebook|instagram|youtube)\.com/.test(href)
    )
      websiteUrl = href.split("?")[0];
  });

  const INVALID_FRAG = ["noreply", "no-reply", "@example", "sentry", "failory", "support@"];
  const emailCandidates = pageText.match(EMAIL_RE) ?? [];
  const email =
    emailCandidates.find(
      (e) => !INVALID_FRAG.some((f) => e.toLowerCase().includes(f)),
    ) ?? null;

  console.log(`Page title: ${ogTitle.slice(0, 100)}`);
  console.log(`\nExtraction:`);
  console.log(`  H2/H3 Q&A blocks: ${qaFromHeadings.length}`);
  console.log(`  Chosen method: ${qaFromHeadings.length >= 3 ? "H2/H3 Q&A" : "paragraphs"}`);
  console.log(`  Interview text length: ${interviewText.length} chars`);
  console.log(`  Founder name: ${founderName}`);
  console.log(`  Revenue: ${revenueText || "(not found)"} → $${revenue}/mo`);
  console.log(`  Website: ${websiteUrl ?? "(not found)"}`);
  console.log(`  Twitter: ${twitterUrl ?? "(not found)"}`);
  console.log(`  Email on page: ${email ?? "(not found)"}`);
  console.log(
    `\nInterview preview:\n  ${interviewText.slice(0, 300).replace(/\n/g, "\n  ")}`,
  );

  return { interviewText, founderName, revenue, revenueText, websiteUrl, twitterUrl, email };
}

async function main() {
  console.log("⚡ Failory Scraper Test\n");
  try {
    const stories = await scrapeIndex();
    if (!stories.length) {
      console.log("\n⚠️  No stories found — page structure may have changed.");
      return;
    }

    // Test first story with revenue, or just first
    const testStory = stories.find((s) => s.revenue >= 5000) ?? stories[0];
    const interview = await scrapeInterview(testStory.url);

    if (!interview) {
      console.log("\n❌ Could not fetch interview — check URL and network");
      return;
    }

    console.log("\n━━━ SUMMARY ━━━");
    console.log(
      interview.interviewText.length >= 300
        ? `✅ Interview text: ${interview.interviewText.length} chars — GOOD`
        : `⚠️  Interview text: ${interview.interviewText.length} chars — TOO SHORT (need 300+)`,
    );
    console.log(
      interview.email
        ? `✅ Email found directly on page: ${interview.email}`
        : `ℹ️  No email on page — will use waterfall`,
    );
    console.log(
      interview.twitterUrl
        ? `✅ Twitter: ${interview.twitterUrl}`
        : `ℹ️  No Twitter found`,
    );
    console.log(
      interview.websiteUrl
        ? `✅ Website: ${interview.websiteUrl}`
        : `ℹ️  No website found`,
    );

    console.log("\n✅ Failory scraper is working.");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
  }
}

main();
