import ScrollLockedVideoHero from "@/components/ui/scroll-locked-video-hero"
import { media, projects } from "@/lib/site"

export const metadata = { title: "Hero demo" }

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
