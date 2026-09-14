import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/site"

/**
 * Serves /sitemap.xml. One entry, because the site is one page — About,
 * Projects, Skills and Contact are sections of `/`, not routes, and listing
 * `/#projects` here would only tell a crawler about a page it already has.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
