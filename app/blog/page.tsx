import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_ARTICLES, formatPublishedDate } from "./data";

const BASE_URL = "https://www.usekorel.com";

export const metadata: Metadata = {
  title: "Korel Insights | Systems, Frameworks, and Authority Strategy",
  description:
    "Systems, frameworks, and strategies for turning long-form thinking into structured authority.",
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    title: "Korel Insights",
    description:
      "Systems, frameworks, and strategies for turning long-form thinking into structured authority.",
    url: `${BASE_URL}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Korel Insights",
    description:
      "Systems, frameworks, and strategies for turning long-form thinking into structured authority.",
  },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Korel Insights",
  description:
    "Systems, frameworks, and strategies for turning long-form thinking into structured authority.",
  url: `${BASE_URL}/blog`,
};

export default function BlogIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
    <main style={{ paddingTop: "80px", paddingBottom: "120px" }}>
      <div className="mx-auto px-6" style={{ maxWidth: "800px" }}>

        {/* Page header */}
        <div style={{ marginBottom: "56px" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: "16px",
            }}
          >
            Korel Insights
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#64748B",
              lineHeight: 1.65,
              maxWidth: "480px",
            }}
          >
            Systems, frameworks, and strategies for turning long-form thinking
            into structured authority.
          </p>
        </div>

        {/* Article list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {BLOG_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <article
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: "12px",
                  padding: "28px 32px",
                  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                className="hover:shadow-md hover:border-indigo-200"
              >
                {/* Meta line */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <time
                    dateTime={article.publishedAt}
                    style={{ fontSize: "13px", color: "#94A3B8" }}
                  >
                    {formatPublishedDate(article.publishedAt)}
                  </time>
                  <span style={{ color: "#CBD5E1", fontSize: "13px" }}>·</span>
                  <span style={{ fontSize: "13px", color: "#94A3B8" }}>
                    {article.readTime}
                  </span>
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 650,
                    color: "#0F172A",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                    marginBottom: "8px",
                  }}
                >
                  {article.title}
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontSize: "15px",
                    color: "#64748B",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {article.description}
                </p>

                {/* Read link */}
                <div
                  style={{
                    marginTop: "16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#4F46E5",
                  }}
                >
                  Read article →
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
    </>
  );
}
