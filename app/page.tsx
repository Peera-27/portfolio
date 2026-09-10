import ScrollLockedVideoHero from "@/components/ui/scroll-locked-video-hero"
import { SiteNav } from "@/components/site/site-nav"
import { About } from "@/components/site/about"
import { Projects } from "@/components/site/projects"
import { Skills } from "@/components/site/skills"
import { Contact } from "@/components/site/contact"
import { SiteFooter } from "@/components/site/site-footer"
import { media, profile, projects } from "@/lib/site"

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top" className="flex-1">
        <ScrollLockedVideoHero
          eyebrow={profile.role}
          title={profile.heroTitle}
          videoSrc={media.heroVideo}
          posterSrc={media.heroPoster}
          backgroundSrc={media.heroBackdrop}
          projects={projects}
          signature={{ name: `by ${profile.nameEn}`, url: profile.github }}
        />
        <About />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
