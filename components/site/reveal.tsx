"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

/** The tags this is used with. Kept a closed union so the ref stays typed. */
type RevealTag = "div" | "p" | "span" | "h1" | "h2" | "h3" | "li"

/**
 * Splits its text into lines and lifts them out of a mask as they scroll in.
 *
 * Two things it deliberately does NOT do:
 *  • hide anything from CSS. The hidden state is applied by GSAP at runtime, so
 *    if the script fails, or the visitor asked for reduced motion, the text is
 *    simply visible — no blank page held hostage by a bundle.
 *  • split before the webfonts land. Line breaks depend on font metrics, so
 *    splitting against the fallback face produces lines that jump on swap.
 */
export function Reveal({
  children,
  className,
  as = "div",
  delay = 0,
  stagger = 0.07,
}: {
  children: React.ReactNode
  className?: string
  as?: RevealTag
  delay?: number
  stagger?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger, SplitText)

    let ctx: gsap.Context | undefined
    let cancelled = false

    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    fontsReady.then(() => {
      if (cancelled) return
      ctx = gsap.context(() => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "reveal-line",
          // Re-splits on resize; the animation is rebuilt in onSplit so the
          // new lines are the ones that get tweened.
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              opacity: 0,
              duration: 0.9,
              ease: "power3.out",
              stagger,
              delay,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            }),
        })
      }, el)
    })

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [delay, stagger])

  // Narrowed to "div" purely so JSX accepts the HTMLDivElement ref; `as` is
  // still whatever tag the caller asked for at runtime.
  const Tag = as as "div"
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
