import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/site"

/**
 * Serves /robots.txt. `/demo` is the hero workbench — it already carries a
 * noindex in its own metadata, and this keeps crawlers from spending a fetch
 * on it in the first place.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/demo" },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
