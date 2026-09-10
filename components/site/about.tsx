import Image from "next/image"
import { Section } from "./section"
import { about, media, profile } from "@/lib/site"

export function About() {
  return (
    <Section
      id="about"
      eyebrow="about"
      index="01"
      title="I build things end to end"
      lead={profile.headline}
    >
      <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-start lg:gap-16">
        <div className="space-y-5 text-[15px] leading-[1.9] text-muted-foreground">
          <p>
            I&apos;m{" "}
            <span className="font-semibold text-foreground">
              {profile.name} ({profile.nickname})
            </span>
            {/* The sentence already opens with the pronoun the line above just
                used, so it is trimmed rather than repeated. */}
            {about[0].replace(/^I'm\s*/, "").replace(/^a /, ", a ")}
          </p>
          <p>{about[1]}</p>
        </div>

        {/* The portrait comes after the prose in source order, so a narrow screen
            leads with the substance and a screen reader is not made to sit
            through an image description before the introduction. */}
        <figure className="relative overflow-hidden rounded-2xl border border-white/10">
          <Image
            src={media.profile}
            alt={`${profile.name}, ${profile.role}`}
            width={720}
            height={906}
            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
            className="h-auto w-full"
          />
          {/* A whisper of the page's own ink across the bottom edge, so the
              photograph sits on the page instead of being pasted onto it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 62%, hsl(var(--background) / 0.55) 100%)",
            }}
          />
        </figure>
      </div>
    </Section>
  )
}
