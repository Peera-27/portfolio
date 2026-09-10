"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/** Clears the fixed 64px header, matching the `scroll-mt-20` on each section. */
const ANCHOR_OFFSET = -80

/**
 * Anything that needs to move the page itself has to go through Lenis, or the
 * two disagree about where the page is. Publishing the instance on `window` is
 * how the hero reaches it: the hero is meant to stay droppable into a project
 * with no smooth-scroll layer at all, so it may not import from this file — it
 * looks for this handle and falls back to a native scroll when it is absent.
 */
declare global {
  interface Window {
    __lenis?: Lenis
  }
}

/**
 * Lenis drives the page scroll and GSAP's ticker drives Lenis, so ScrollTrigger
 * measures against the same clock instead of racing its own rAF loop.
 *
 * The hero's project deck captures the wheel itself. Rather than teaching Lenis
 * about it, the deck carries `data-lenis-prevent`, which Lenis honours natively:
 * inside that subtree the wheel event is left alone and the deck's own physics
 * still see it. That is why smooth scroll and the hero can coexist at all.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Someone who asked the OS for less motion did not ask for scroll inertia.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    // CSS keeps `scroll-behavior: smooth` so anchors still glide with no JS.
    // Once Lenis is driving, that same rule would animate every programmatic
    // scroll Lenis performs — two easings fighting over one scrollTop.
    const root = document.documentElement
    const previousBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = "auto"

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices already have native inertia that feels better than ours.
      syncTouch: false,
    })

    lenis.on("scroll", ScrollTrigger.update)
    window.__lenis = lenis

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // In-page links have to be routed through Lenis too, otherwise the browser
    // jumps the scroll position out from under it and the two disagree about
    // where the page is.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const link = (e.target as HTMLElement | null)?.closest?.("a")
      if (!link) return
      const href = link.getAttribute("href")
      if (!href || !href.startsWith("#") || href === "#") return
      const target = document.querySelector(href)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: ANCHOR_OFFSET })
      // Keep the URL in step so the link is still shareable and back works.
      history.pushState(null, "", href)
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      gsap.ticker.remove(raf)
      if (window.__lenis === lenis) delete window.__lenis
      lenis.destroy()
      root.style.scrollBehavior = previousBehavior
    }
  }, [])

  return <>{children}</>
}
