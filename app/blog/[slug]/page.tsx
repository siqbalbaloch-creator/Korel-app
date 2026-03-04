import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BLOG_ARTICLES, BLOG_SLUGS, formatPublishedDate } from "../data";
import WhyFoundersWaste from "../content/why-founders-waste-their-best-thinking";
import FivePartFramework from "../content/five-part-framework-for-linkedin-authority";
import OneInterview from "../content/one-interview-into-a-month-of-content";
import FounderAuthoritySystem from "../content/founder-authority-system";
import type { ComponentType } from "react";

const BASE_URL = "https://www.usekorel.com";

const CONTENT_MAP: Record<string, ComponentType> = {
  "why-founders-waste-their-best-thinking": WhyFoundersWaste,
  "five-part-framework-for-linkedin-authority": FivePartFramework,
  "one-interview-into-a-month-of-content": OneInterview,
  "founder-authority-system": FounderAuthoritySystem,
};

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};

  const url = `${BASE_URL}/blog/${slug}`;
  return {
    title: `${article.title} | Korel Insights`,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      type: "article",
      publishedTime: article.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) return notFound();

  const ContentComponent = CONTENT_MAP[slug];
  if (!ContentComponent) return notFound();

  const related = BLOG_ARTICLES.filter((a) => a.slug !== slug).slice(0, 2);

  const articleUrl = `${BASE_URL}/blog/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      "@type": "Organization",
      name: "Korel",
    },
    publisher: {
      "@type": "Organization",
      name: "Korel",
      logo: {
        "@type": "ImageObject",
        url: "https://www.usekorel.com/opengraph-image",
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: articleUrl,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://usekorel.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://usekorel.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main style={{ paddingTop: "72px", paddingBottom: "120px" }}>
        <div className="mx-auto px-6" style={{ maxWidth: "720px" }}>

          {/* Back link */}
          <Link
            href="/blog"
            style={{
              display: "inline-block",
              fontSize: "13px",
              color: "#94A3B8",
              textDecoration: "none",
              marginBottom: "40px",
              letterSpacing: "0.01em",
            }}
            className="hover:text-neutral-600 transition-colors"
          >
            ← Korel Insights
          </Link>

          {/* Article header */}
          <header style={{ marginBottom: "48px" }}>
            <h1
              style={{
                fontSize: "clamp(26px, 5vw, 40px)",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: "20px",
              }}
            >
              {article.title}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "14px", color: "#64748B" }}>
                By Korel Team
              </span>
              <span style={{ color: "#CBD5E1", fontSize: "14px" }}>·</span>
              <time
                dateTime={article.publishedAt}
                style={{ fontSize: "14px", color: "#64748B" }}
              >
                {formatPublishedDate(article.publishedAt)}
              </time>
              <span style={{ color: "#CBD5E1", fontSize: "14px" }}>·</span>
              <span style={{ fontSize: "14px", color: "#64748B" }}>
                {article.readTime}
              </span>
            </div>
          </header>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(0,0,0,0.07)",
              marginBottom: "48px",
            }}
          />

          {/* Article body */}
          <div
            style={{
              fontSize: "18px",
              lineHeight: "1.8",
              color: "#374151",
            }}
          >
            <ContentComponent />
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(0,0,0,0.07)",
              marginTop: "64px",
              marginBottom: "48px",
            }}
          />

          {/* Related insights */}
          <section>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#94A3B8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              Related insights
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(0,0,0,0.07)",
                      borderRadius: "10px",
                      padding: "20px 24px",
                      transition: "box-shadow 0.15s ease",
                    }}
                    className="hover:shadow-md"
                  >
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#0F172A",
                        marginBottom: "4px",
                        lineHeight: 1.4,
                      }}
                    >
                      {r.title}
                    </p>
                    <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
                      {r.readTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
