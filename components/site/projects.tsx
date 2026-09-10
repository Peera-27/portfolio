"use client"

import { useEffect, useRef } from "react"
import { ArrowUpRight } from "lucide-react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Section } from "./section"
import { projects } from "@/lib/site"

/**
 * The site header is fixed and 64px tall, so pinning at `top top` parks the
 * ribbon underneath it. 80 is the clearance the rest of the site already uses —
 * `scroll-mt-20` on every section, and the anchor offset in SmoothScroll — so
 * the pinned ribbon lines up with where an anchor jump would leave it.
 */
const NAV_CLEARANCE = 80

/**
 * The project ribbon: vertical scroll is translated into horizontal travel while
 * the section is pinned.
 *
 * It degrades on purpose. Until GSAP has actually pinned the section — no JS,
 * script still loading, or reduced motion — the track is a plain
 * `overflow-x: auto` strip that scrolls with a finger or a trackpad. `pinned`
 * only flips to true once the ScrollTrigger exists, and it is what swaps the
 * native overflow off. Nothing is ever unreachable.
 */
export function Projects() {
  const scopeRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  // The pinned state and the scrub position are written straight to the DOM
  // rather than held in React state: the progress bar updates every scroll
  // frame, and re-rendering seven project cards at 60fps to move one <span> is
  // work for nothing. The markup ships in its un-enhanced form and the effect
  // upgrades it, which is also what makes the no-JS fallback honest.
  const viewportRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const modeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const scope = scopeRef.current
    const track = trackRef.current
    if (!scope || !track) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    // Below this width a pinned horizontal section fights the native vertical
    // gesture more than it delights, so phones keep the plain swipe strip.
    if (window.innerWidth < 760) return

    gsap.registerPlugin(ScrollTrigger)

    // Native horizontal overflow is the fallback; once GSAP drives the track,
    // leaving it on would give the strip two competing scroll mechanisms.
    const viewport = viewportRef.current
    const mode = modeRef.current
    if (viewport) viewport.style.overflowX = "hidden"
    if (mode) mode.textContent = "scroll"

    const ctx = gsap.context(() => {
      // Measured in a function so `invalidateOnRefresh` can re-run it after a
      // resize instead of freezing the first layout's numbers.
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 40)

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: scope,
          start: `top top+=${NAV_CLEARANCE}`,
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.width = `${self.progress * 100}%`
          },
        },
      })
    }, scope)

    return () => {
      ctx.revert()
      if (viewport) viewport.style.overflowX = ""
      if (mode) mode.textContent = "swipe"
    }
  }, [])

  return (
    <Section
      id="projects"
      eyebrow="work"
      index="02"
      title="Things I’ve built and shipped"
      lead="Each one had a problem of its own to solve — what follows is the hardest part of each, not a list of technologies."
      bleed
    >
      <div ref={scopeRef}>
        <div ref={viewportRef} className="overflow-x-auto">
          <div
            ref={trackRef}
            className="flex w-max gap-5 px-5 pb-4 sm:px-[max(1.25rem,calc((100vw-72rem)/2))]"
          >
            {projects.map((p, i) => (
              <article
                key={p.id}
                className="group relative flex w-[min(84vw,25rem)] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20"
              >
                {/* colour signature — the same gradient the hero uses for this project */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px opacity-70"
                  style={{ background: `linear-gradient(90deg, ${p.colorA}, ${p.colorB} 70%, transparent)` }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                  style={{ background: p.colorA }}
                />

                <div className="flex items-start justify-between gap-4">
                  <span className="flex items-center gap-2.5">
                    <span className="mono-label text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {p.status && (
                      <span className="mono-label rounded-full border border-accent/40 px-2 py-0.5 text-accent">
                        {p.status}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    {p.demo && (
                      <a
                        href={p.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono-label rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        live
                      </a>
                    )}
                    {p.href && (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open the ${p.title} repository`}
                        className="rounded-full border border-white/10 p-2 text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <ArrowUpRight size={15} />
                      </a>
                    )}
                  </span>
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <div
                    className="mt-1 h-10 w-10 flex-shrink-0 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${p.colorA}, ${p.colorB})`,
                      boxShadow: `0 0 22px ${p.colorA}44`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl leading-none text-foreground">{p.title}</h3>
                    <p className="mono-label mt-2 text-muted-foreground">
                      {[p.kind, p.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>

                {p.highlights && p.highlights.length > 0 && (
                  <ul className="mt-5 space-y-2.5">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-[13.5px] leading-relaxed text-muted-foreground">
                        <span
                          aria-hidden
                          className="mt-2 h-1 w-1 flex-shrink-0 rounded-full"
                          style={{ background: p.colorA }}
                        />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}

                {p.stack && (
                  <ul className="mt-auto flex flex-wrap gap-2 pt-6">
                    {p.stack.map((s) => (
                      <li
                        key={s}
                        className="mono-label rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-muted-foreground"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Position readout for the ribbon — mirrors the hero's deck indicator */}
        <div className="mx-auto mt-6 flex w-full max-w-6xl items-center gap-4 px-5">
          <span ref={modeRef} className="mono-label text-muted-foreground">
            swipe
          </span>
          <span aria-hidden className="relative h-px flex-1 bg-white/10">
            <span ref={barRef} className="absolute inset-y-0 left-0 w-0 bg-primary" />
          </span>
          <span className="mono-label tabular-nums text-muted-foreground">
            {String(projects.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </Section>
  )
}
