export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO "YYYY-MM-DD"
  readTime: string;
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "why-founders-waste-their-best-thinking",
    title: "Why Most Founders Waste Their Best Thinking",
    description:
      "The ideas you share in Slack, investor calls, and team meetings are your most valuable content — they're just trapped in the wrong format.",
    publishedAt: "2026-02-20",
    readTime: "5 min read",
  },
  {
    slug: "five-part-framework-for-linkedin-authority",
    title: "The 5-Part Framework for LinkedIn Posts That Build Real Authority",
    description:
      "Most LinkedIn content fails because it optimizes for engagement over insight. Here's a structured approach that does both.",
    publishedAt: "2026-02-27",
    readTime: "7 min read",
  },
  {
    slug: "one-interview-into-a-month-of-content",
    title: "How to Turn One Interview Into a Month of Content",
    description:
      "A single founder conversation contains enough insight for 30+ pieces of structured content — if you know how to extract it.",
    publishedAt: "2026-03-04",
    readTime: "6 min read",
  },
  {
    slug: "founder-authority-system",
    title: "The Founder's System for Turning One Podcast Into a Month of Authority",
    description:
      "A practical framework founders can use to convert long-form content like podcasts and interviews into LinkedIn posts, X threads, and newsletters.",
    publishedAt: "2026-03-10",
    readTime: "6 min read",
  },
];

export const BLOG_SLUGS = BLOG_ARTICLES.map((a) => a.slug);

export function formatPublishedDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
