import { BLOG_ARTICLES, formatPublishedDate } from "../../blog/data";

export function BlogPreviewSection() {
  return (
    <section
      style={{
        paddingTop: "96px",
        paddingBottom: "96px",
        backgroundColor: "#F6F7FB",
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "960px" }}>
        {/* Section header */}
        <div style={{ marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            Insights from Korel
          </h2>
          <p
            style={{
              fontSize: "17px",
              color: "#64748B",
              lineHeight: 1.6,
              maxWidth: "480px",
            }}
          >
            Systems and frameworks for turning long-form thinking into
            structured authority.
          </p>
        </div>

        {/* Article cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "16px", marginBottom: "36px" }}
        >
          {BLOG_ARTICLES.map((article) => (
            <a
              key={article.slug}
              href={`/blog/${article.slug}`}
              style={{ textDecoration: "none", display: "flex" }}
            >
              <article
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: "12px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                className="hover:shadow-md hover:border-indigo-200"
              >
                {/* Meta */}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94A3B8",
                    marginBottom: "10px",
                  }}
                >
                  <time dateTime={article.publishedAt}>
                    {formatPublishedDate(article.publishedAt)}
                  </time>
                  <span style={{ margin: "0 6px", color: "#CBD5E1" }}>·</span>
                  {article.readTime}
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 650,
                    color: "#0F172A",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.35,
                    marginBottom: "10px",
                    flexGrow: 1,
                  }}
                >
                  {article.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748B",
                    lineHeight: 1.55,
                    marginBottom: "16px",
                  }}
                >
                  {article.description}
                </p>

                {/* Read link */}
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#4F46E5",
                    marginTop: "auto",
                  }}
                >
                  Read article →
                </div>
              </article>
            </a>
          ))}
        </div>

        {/* View all link */}
        <div>
          <a
            href="/blog"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#4F46E5",
              textDecoration: "none",
            }}
          >
            View all insights →
          </a>
        </div>
      </div>
    </section>
  );
}
