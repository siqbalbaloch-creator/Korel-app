import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/case-studies/", "/docs/"],
        disallow: [
          "/dashboard/",
          "/new/",
          "/packs/",
          "/billing/",
          "/settings/",
          "/history/",
          "/support/",
          "/admin/",
          "/signin/",
          "/signup/",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://www.usekorel.com/sitemap.xml",
  };
}
