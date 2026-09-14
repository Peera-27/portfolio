import type { Metadata } from "next"

import ScrollLockedVideoHero from "@/components/ui/scroll-locked-video-hero"
import { media, projects } from "@/lib/site"

/**
 * Kept as a workbench, not as a page of the site: nothing links here, so the
 * only way in is by typing the URL. `robots` keeps it out of search results and
 * out of `sitemap.ts` — a stray hero with no nav around it is not what should
 * come up when someone searches the name.
 */
export const metadata: Metadata = {
  title: "Hero demo",
  robots: { index: false, follow: false },
}

/**
 * The component on its own, nothing else on the page — the equivalent of the
 * `demo.tsx` in the integration brief. Useful for tweaking the hero without
 * scrolling past the rest of the site.
 */
export default function DemoOne() {
  return (
    <ScrollLockedVideoHero
      videoSrc={media.heroVideo}
      posterSrc={media.heroPoster}
      backgroundSrc={media.heroBackdrop}
      projects={projects}
    />
  )
}
