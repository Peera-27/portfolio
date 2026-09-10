"use client"

import { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  MousePointerClick,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────
// SCROLL-LOCKED VIDEO HERO — portfolio edition
//
// A looping video fills a floating "screen" that tilts toward the cursor.
// Behind it a real background image sets the palette — deep navy, cyan glow,
// warm amber accent. The project list has momentum physics (flick-and-settle,
// not 1:1 drag) and a wide-angle coverflow lean, with a synthesized encoder
// "click" on every detent. Prev / play / next are real controls, and the
// centred project opens its link. A second "minimal" theme drops the video
// entirely for a geometric, in-motion backdrop.
//
// Deliberate differences from the upstream music-player version:
//  • Wheel is captured only while the pointer is over the deck (the list plus
//    the controls under it), NOT over the whole page. Upstream called
//    preventDefault on every window wheel event, which makes the rest of a
//    portfolio unreachable.
//  • Wide view lays the card out with position:absolute inside this section
//    instead of position:fixed over the viewport — visually identical on load,
//    but the page still scrolls past the hero.
//  • "Play" means auto-advance through projects, a real behaviour, since the
//    video carries no audio track to play.
//  • The volume slider drives the detent click, the one sound that exists here.
//  • prefers-reduced-motion disables auto-advance, the tilt and the drift.
// ─────────────────────────────────────────────────────────────

export interface Project {
  id: string
  title: string
  subtitle: string
  year?: string
  kind?: string
  stack?: string[]
  description?: string
  highlights?: string[]
  href?: string
  /** a live deployment, when there is one — shown alongside the repo link */
  demo?: string
  /**
   * A short note about how the project stands rather than what it is — "collab",
   * "in development". Rendered as a badge only when set, so the common case of
   * a finished solo project carries no extra chrome.
   */
  status?: string
  colorA: string
  colorB: string
}

export interface ScrollLockedVideoHeroProps {
  title?: string
  eyebrow?: string
  videoSrc: string
  posterSrc?: string
  backgroundSrc?: string
  projects: Project[]
  signature?: { name: string; url: string } | false
  /** start with the detent click enabled (still needs a user gesture first) */
  sound?: boolean
  /** ms between automatic advances while auto-advance is on */
  autoAdvanceMs?: number
  /** start in the edge-to-edge wide view, the way the original opens */
  wide?: boolean
  /**
   * Pixels of scroll each project gets while the hero is pinned. The whole
   * pinned run is this times (projects - 1); the video playhead and the deck
   * both ride that one progress value.
   */
  scrubPerProject?: number
  /**
   * The one-line prompt under the title. Passed in rather than hardcoded so a
   * host app can translate it; the defaults keep the component usable on its own.
   */
  hints?: { scrollToExplore: string; dragToBrowse: string; scrollOverDeck: string }
  fullBleed?: boolean
  className?: string
  style?: React.CSSProperties
}

// The site's three faces, loaded by next/font in app/layout.tsx. Read as raw
// custom properties rather than Tailwind classes because this component styles
// itself inline — it has to keep working when dropped into a project that has
// no Tailwind at all.
const SANS = "var(--ff-body), ui-sans-serif, system-ui, -apple-system, sans-serif"
const MONO = "var(--ff-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
const DISPLAY = "var(--ff-display), 'Arial Narrow', sans-serif"
const CYAN = "#74b9f1"
const AMBER = "#f3724c"

// shadcn-style CSS variables, read with a fallback matching this component's
// own dark palette. The host app's theme wins when it defines them.
// NOTE: this only works if the host stores them as raw HSL triplets
// ("222 47% 5%"). A full oklch() value would make hsl(oklch(...)) — invalid
// CSS that paints nothing. app/globals.css keeps the triplet format for this.
const bgVar = "hsl(var(--background, 60 5% 4%))"
const fgVar = "hsl(var(--foreground, 40 10% 96%))"
const fgMutedVar = (a: number) => `hsl(var(--foreground, 40 10% 96%) / ${a})`
const cardVar = (a = 1) => `hsl(var(--card, 60 4% 8%) / ${a})`

// Upstream's row pitch. Every other number in the coverflow maths is tuned
// against it, so it is not a free knob.
const ROW_HEIGHT = 60

// A floor for the pinned run. The runway is derived from the project count, so
// a short list would otherwise scrub the entire video away in less than one
// screen of scrolling — three projects at the default 340 is 680px, and the
// hero would be gone before the visitor registered it was interactive.
const MIN_SCRUB_DISTANCE = 1400

// In wide view the card is the whole viewport, but the deck is not: it stays a
// centred column this wide. That is what leaves margins either side where the
// wheel still scrolls the page, which is the whole reason the rest of the site
// stays reachable from a full-bleed hero.
const WIDE_DECK_HALF = 380

// A fixed diagonal lean at rest. While hovering, the tilt is a clean symmetric
// swing around zero — not offset by this resting baseline, which would bias
// every swing toward one side.
const BASE_ROTATE_Y = -13
const BASE_ROTATE_X = 5

// The click is the only sound here, so unlike upstream — where the slider
// capped video ambience — this cap keeps the click itself civil at full slider.
const MAX_CLICK_GAIN = 0.2

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

// ── synthesized mouse-wheel click — a tight noise transient, closer to a
// real encoder detent than a soft tick. No audio files, no dependencies. ──
function playWheelClick(ctx: AudioContext, velocity: number, volume: number) {
  const now = ctx.currentTime
  const strength = clamp(velocity, 0, 1)
  const peak = clamp(volume, 0, 1) * MAX_CLICK_GAIN * (0.72 + strength * 0.28)
  if (peak <= 0.0005) return
  const bufferSize = Math.floor(ctx.sampleRate * 0.012)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.6)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const bp = ctx.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = 4200 + strength * 700
  bp.Q.value = 3
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(peak, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)
  noise.connect(bp)
  bp.connect(gain)
  gain.connect(ctx.destination)
  noise.start(now)
}

export default function ScrollLockedVideoHero({
  title = "Code that sees, understands, and acts",
  eyebrow,
  videoSrc,
  posterSrc,
  backgroundSrc,
  projects,
  signature = false,
  sound = true,
  autoAdvanceMs = 4800,
  wide = true,
  scrubPerProject = 340,
  hints = {
    scrollToExplore: "Scroll to explore",
    dragToBrowse: "Drag the list to browse",
    scrollOverDeck: "Scroll over the deck",
  },
  fullBleed = true,
  className,
  style,
}: ScrollLockedVideoHeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrubVideoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // The deck — list plus control bar — is its own element so the wheel zone is
  // exactly one DOM subtree rather than a rectangle guessed from coordinates.
  // That precision is what lets `data-lenis-prevent` on the same element line up
  // perfectly with what this component captures: no gutter where both Lenis and
  // the deck would answer the same wheel event.
  const deckRef = useRef<HTMLDivElement>(null)
  const listViewportRef = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const offsetRef = useRef(0)
  const velocityRef = useRef(0)
  const snapTargetRef = useRef<number | null>(null)
  const lastDetentRef = useRef(0)
  const isDraggingRef = useRef(false)
  const lastDragYRef = useRef(0)
  const lastDragTRef = useRef(0)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  // Read inside rAF loops that must not re-subscribe on every volume tweak.
  const soundOnRef = useRef(sound)
  const volumeRef = useRef(0.7)

  const [soundOn, setSoundOn] = useState(sound)
  const [volume, setVolume] = useState(0.7)
  const [activeIndex, setActiveIndex] = useState(0)
  const [announcement, setAnnouncement] = useState("")
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true)
  // Hover is tracked on the deck, not on the card: in wide view the card IS
  // the viewport, so pausing on card hover would mean auto-advance never runs
  // once the pointer is anywhere on the page.
  const [isHoveringDeck, setIsHoveringDeck] = useState(false)
  // Opens edge-to-edge, the way the original does — that full-bleed video with
  // the title floating over it IS the look, and the small tilted card is the
  // alternate state rather than the entry point.
  const [isWide, setIsWide] = useState(wide)
  // "video" = the full experience (video + immersive background).
  // "minimal" = a clean, flat skin with no video or photo at all.
  const [theme, setTheme] = useState<"video" | "minimal">("video")
  const [isCompact, setIsCompact] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const n = projects.length
  const activeProject = projects[activeIndex] ?? projects[0]

  // Scroll-scrub mode: the section is made taller than the viewport and its
  // contents stick to the top, so scrolling through that extra height drives
  // both the video playhead and the deck from a single progress value.
  //
  // Pinning is done with `position: sticky` rather than a scroll library on
  // purpose — it keeps this component free of GSAP so it stays droppable into a
  // project that has none, and it sidesteps having to reconcile two different
  // things that both want to own the scroll position.
  //
  // Compact and reduced-motion both fall back to the old behaviour: the video
  // loops on its own and the deck is driven by wheel and drag inside its zone.
  // Pinning a phone screen for two viewport-heights is hostile, and scrubbing
  // is motion tied to input, which is exactly what reduced motion asks to avoid.
  const scrub = !isCompact && !reducedMotion
  const scrubDistance = Math.max(MIN_SCRUB_DISTANCE, Math.max(1, n - 1) * scrubPerProject)

  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])
  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  useEffect(() => {
    // A real touch device AND a narrow window both count. Testing "responsive"
    // by shrinking a desktop browser does not change pointer type, so relying
    // on pointer:coarse alone leaves the desktop layout active on narrow
    // windows — which reads as "way too zoomed in".
    const check = () => {
      const coarse = window.matchMedia?.("(pointer: coarse)").matches
      const narrow = window.innerWidth < 760
      setIsCompact(Boolean(coarse || narrow))
    }
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReducedMotion(Boolean(motion?.matches))
    check()
    syncMotion()
    window.addEventListener("resize", check)
    motion?.addEventListener?.("change", syncMotion)
    return () => {
      window.removeEventListener("resize", check)
      motion?.removeEventListener?.("change", syncMotion)
    }
  }, [])

  // Screen-reader announcements, debounced so a fast flick through the list
  // fires once it settles rather than once per row.
  useEffect(() => {
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current)
    announceTimerRef.current = setTimeout(() => {
      const p = projects[activeIndex]
      if (p) setAnnouncement(`${p.title} — ${p.subtitle}`)
    }, 400)
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current)
    }
  }, [activeIndex, projects])

  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) return null
        audioCtxRef.current = new Ctx()
      }
      return audioCtxRef.current
    } catch {
      return null
    }
  }, [])

  const fireClick = useCallback(
    (velocity: number) => {
      if (!soundOnRef.current) return
      const ctx = getCtx()
      if (!ctx) return
      const vol = volumeRef.current
      if (ctx.state === "suspended") {
        ctx.resume().then(() => playWheelClick(ctx, velocity, vol)).catch(() => {})
      } else {
        playWheelClick(ctx, velocity, vol)
      }
    },
    [getCtx]
  )

  // Unlock the audio context on the first gesture the browser accepts.
  useEffect(() => {
    const unlock = () => {
      const ctx = getCtx()
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {})
    }
    const opts = { once: true } as AddEventListenerOptions
    window.addEventListener("pointerdown", unlock, opts)
    window.addEventListener("keydown", unlock, opts)
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [getCtx])

  // ── render loop: lay the rows out in 3D from the current offset ──
  useEffect(() => {
    let rafId = 0
    const render = () => {
      const centerIndexFloat = offsetRef.current / ROW_HEIGHT

      rowRefs.current.forEach((el, i) => {
        if (!el) return
        let d = i - centerIndexFloat
        d = mod(d + n / 2, n) - n / 2
        const absD = Math.abs(d)
        const rotate = clamp(d * 9, -22, 22)
        const scale = clamp(1 - absD * 0.1, 0.72, 1)
        const opacity = clamp(1 - absD * 0.4, 0, 1)
        el.style.transform = `translateY(${d * ROW_HEIGHT}px) translateZ(${-absD * 18}px) rotateX(${rotate}deg) scale(${scale})`
        el.style.opacity = String(opacity)
        // Rows past the fade are invisible; letting them keep hit-testing means
        // clicking "nothing" jumps the deck somewhere unexpected.
        el.style.pointerEvents = absD < 2.2 ? "auto" : "none"
        el.style.zIndex = String(1000 - Math.round(absD * 10))
      })

      // Round first, then wrap — rounding a value already near n (11.999)
      // can land exactly on n, one past the last valid index.
      const nearest = mod(Math.round(centerIndexFloat), n)
      setActiveIndex((prev) => (prev === nearest ? prev : nearest))
      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [n])

  // ── physics loop: settle toward a snap target, or coast with friction.
  //    Silent while scrubbing — there, scroll position owns the offset and a
  //    second writer would fight it every frame. ──
  useEffect(() => {
    if (scrub) return
    let rafId = 0
    const physics = () => {
      if (snapTargetRef.current !== null) {
        const target = snapTargetRef.current
        offsetRef.current += (target - offsetRef.current) * 0.22
        if (Math.abs(target - offsetRef.current) < 0.4) {
          offsetRef.current = target
          snapTargetRef.current = null
        }
      } else if (!isDraggingRef.current) {
        offsetRef.current += velocityRef.current
        velocityRef.current *= 0.93
        if (Math.abs(velocityRef.current) < 0.02) velocityRef.current = 0
      }

      const detent = Math.round(offsetRef.current / ROW_HEIGHT)
      if (detent !== lastDetentRef.current) {
        lastDetentRef.current = detent
        fireClick(clamp(Math.abs(velocityRef.current) / ROW_HEIGHT, 0.15, 1))
      }
      rafId = requestAnimationFrame(physics)
    }
    rafId = requestAnimationFrame(physics)
    return () => cancelAnimationFrame(rafId)
  }, [fireClick, scrub])

  const goStep = useCallback((dir: 1 | -1) => {
    const current = Math.round(offsetRef.current / ROW_HEIGHT)
    snapTargetRef.current = (current + dir) * ROW_HEIGHT
    velocityRef.current = 0
  }, [])

  const goToIndex = useCallback(
    (i: number) => {
      const current = offsetRef.current / ROW_HEIGHT
      // pick whichever wrap-around of index i is closest to where we are
      const delta = mod(i - current + n / 2, n) - n / 2
      snapTargetRef.current = Math.round(current + delta) * ROW_HEIGHT
      velocityRef.current = 0
    },
    [n]
  )

  // ── auto-advance. Pauses while the pointer is on the card so it never
  //    moves out from under someone who is reading. ──
  useEffect(() => {
    // Under scrub the visitor is the clock; advancing on a timer as well would
    // move the deck out from under a stationary scroll position.
    if (scrub || !isAutoAdvancing || reducedMotion || isHoveringDeck) return
    const id = setInterval(() => goStep(1), autoAdvanceMs)
    return () => clearInterval(id)
  }, [scrub, isAutoAdvancing, reducedMotion, isHoveringDeck, autoAdvanceMs, goStep])

  // ── input. Wheel is captured only over the deck — the list plus a margin
  //    that covers the controls — so the page scrolls past the hero anywhere
  //    else, even in wide view where the card fills the viewport. ──
  useEffect(() => {
    // Scrubbing means the page scroll IS the input, so the deck must stop
    // swallowing wheel events — that capture zone existed only to give the deck
    // a way to be driven while the page scrolled past it.
    if (scrub) return
    const deck = deckRef.current
    if (!deck) return

    const onWheel = (e: WheelEvent) => {
      // Horizontal-dominant scrolls (trackpad swipes) are left to the page.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      snapTargetRef.current = null
      velocityRef.current = clamp(velocityRef.current + e.deltaY * 0.045, -14, 14)
      const ctx = getCtx()
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {})
    }
    const onTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true
      snapTargetRef.current = null
      velocityRef.current = 0
      lastDragYRef.current = e.touches[0]?.clientY ?? 0
      lastDragTRef.current = performance.now()
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      const y = e.touches[0]?.clientY ?? lastDragYRef.current
      const dy = lastDragYRef.current - y
      offsetRef.current += dy
      const t = performance.now()
      const dt = Math.max(1, t - lastDragTRef.current)
      velocityRef.current = (dy / dt) * 16
      lastDragYRef.current = y
      lastDragTRef.current = t
    }
    const onTouchEnd = () => {
      isDraggingRef.current = false
    }

    // On touch the drag surface is the list only — the rest of the hero has to
    // stay swipeable so the page can be scrolled past it.
    const touchTarget = listViewportRef.current ?? deck
    deck.addEventListener("wheel", onWheel, { passive: false })
    touchTarget.addEventListener("touchstart", onTouchStart, { passive: true })
    touchTarget.addEventListener("touchmove", onTouchMove, { passive: false })
    touchTarget.addEventListener("touchend", onTouchEnd)
    return () => {
      deck.removeEventListener("wheel", onWheel)
      touchTarget.removeEventListener("touchstart", onTouchStart)
      touchTarget.removeEventListener("touchmove", onTouchMove)
      touchTarget.removeEventListener("touchend", onTouchEnd)
    }
  }, [getCtx, isCompact, theme, isWide, scrub])

  // ── scroll-scrub driver: one progress value feeds the video playhead and
  //    the deck, so scrolling anywhere over the hero moves both together. ──
  useEffect(() => {
    if (!scrub) return
    const section = sectionRef.current
    if (!section) return

    let rafId = 0
    let lastSeek = -1

    const tick = () => {
      // While the sticky child is held at the top of the viewport, the tall
      // section's own top edge travels from 0 down to -scrubDistance. Clamping
      // parks the hero at either end once it is off screen.
      const progress = clamp(-section.getBoundingClientRect().top / scrubDistance, 0, 1)

      // The deck walks the list exactly once across the whole pinned run.
      offsetRef.current = progress * Math.max(1, n - 1) * ROW_HEIGHT

      const detent = Math.round(offsetRef.current / ROW_HEIGHT)
      if (detent !== lastDetentRef.current) {
        lastDetentRef.current = detent
        fireClick(0.45)
      }

      const video = scrubVideoRef.current
      if (video && video.readyState >= 1 && video.duration) {
        const t = progress * video.duration
        // Seeks are asynchronous and queue behind one another. Asking for a
        // position less than a frame away from the last request buys nothing
        // visible and costs a decode, so those are dropped.
        if (Math.abs(t - lastSeek) > 1 / 24) {
          lastSeek = t
          video.currentTime = t
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [scrub, scrubDistance, n, fireClick])

  const onCardMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isCompact || reducedMotion || theme === "minimal") return
      const rect = cardRef.current?.getBoundingClientRect()
      if (!rect) return
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5

      if (isWide) {
        // In wide view the frame is already the viewport, so the parallax has
        // to happen on the oversized inner layer instead of on the card.
        const el = videoWrapRef.current
        if (!el) return
        el.style.transition = "transform 0.05s linear"
        el.style.transform = `scale(1.45) rotateY(${px * 26}deg) rotateX(${-py * 20}deg)`
        return
      }
      const el = cardRef.current
      if (el) {
        el.style.transition =
          "width 0.5s cubic-bezier(.2,.8,.2,1), height 0.5s cubic-bezier(.2,.8,.2,1), transform 0.05s linear"
        el.style.transform = `rotateY(${px * 46}deg) rotateX(${-py * 38}deg) scale(1.03)`
      }
      if (bgRef.current) {
        bgRef.current.style.transform = `translate(${-px * 34}px, ${-py * 24}px) scale(1.06)`
      }
    },
    [isCompact, reducedMotion, isWide, theme]
  )

  const onCardLeave = useCallback(() => {
    if (isCompact || reducedMotion || theme === "minimal") return
    if (isWide) {
      const el = videoWrapRef.current
      if (el) {
        el.style.transition = "transform 0.6s cubic-bezier(.2,.8,.2,1)"
        el.style.transform = "scale(1.45) rotateY(0deg) rotateX(0deg)"
      }
      return
    }
    const el = cardRef.current
    if (el) {
      el.style.transition =
        "width 0.5s cubic-bezier(.2,.8,.2,1), height 0.5s cubic-bezier(.2,.8,.2,1), transform 0.6s cubic-bezier(.2,.8,.2,1)"
      el.style.transform = `rotateY(${BASE_ROTATE_Y}deg) rotateX(${BASE_ROTATE_X}deg) scale(1)`
    }
    if (bgRef.current) {
      bgRef.current.style.transition = "transform 0.6s cubic-bezier(.2,.8,.2,1)"
      bgRef.current.style.transform = "translate(0px, 0px) scale(1.06)"
    }
  }, [isCompact, reducedMotion, isWide, theme])

  const setRowRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      rowRefs.current[i] = el
    },
    []
  )

  // While scrubbing, the deck's position is a pure function of page scroll, so
  // any control that changes the project has to move the page. Writing the
  // offset directly would be overwritten on the very next frame.
  //
  // The smooth-scroll layer, if the host app has one, publishes itself on
  // window. It is read structurally rather than imported so this file keeps
  // working — falling back to a native scroll — in a project that has none.
  const scrollToProgress = useCallback(
    (p: number) => {
      const section = sectionRef.current
      if (!section) return
      // scrollY + rect.top is the page offset at which progress is exactly 0.
      const target =
        window.scrollY + section.getBoundingClientRect().top + clamp(p, 0, 1) * scrubDistance
      const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number) => void } }).__lenis
      if (lenis) lenis.scrollTo(target)
      else window.scrollTo({ top: target, behavior: "smooth" })
    },
    [scrubDistance]
  )

  const selectIndex = useCallback(
    (i: number) => {
      if (!scrub) {
        goToIndex(i)
        return
      }
      scrollToProgress(n > 1 ? clamp(i, 0, n - 1) / (n - 1) : 0)
    },
    [scrub, goToIndex, scrollToProgress, n]
  )

  const step = useCallback(
    (dir: 1 | -1) => {
      fireClick(0.5)
      if (!scrub) {
        goStep(dir)
        return
      }
      selectIndex(activeIndex + dir)
    },
    [scrub, goStep, selectIndex, activeIndex, fireClick]
  )

  const openActive = useCallback(() => {
    const href = projects[activeIndex]?.href
    if (href) window.open(href, "_blank", "noopener,noreferrer")
  }, [projects, activeIndex])

  // Keyboard equivalents of scrolling the list and pressing the controls.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault()
      step(1)
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault()
      step(-1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      openActive()
    } else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault()
      setIsAutoAdvancing((p) => !p)
    }
  }

  const deckLabel = `Project deck. Showing ${activeProject?.title}. Use the up and down arrow keys to change project, Enter to open it, Space to pause auto-advance.`

  const sharedStyles = (
    <style>{`
      @keyframes slvh-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      @keyframes slvh-drift {
        0%,100% { transform: translate(0,0) scale(1.06); }
        50%     { transform: translate(1.5%, -1%) scale(1.1); }
      }
      @keyframes slvh-eq1 { 0%,100% { height: 4px; } 50% { height: 14px; } }
      @keyframes slvh-eq2 { 0%,100% { height: 13px; } 50% { height: 5px; } }
      @keyframes slvh-eq3 { 0%,100% { height: 7px; } 50% { height: 15px; } }
      .slvh-focusable:focus-visible { outline: 3px solid ${CYAN}; outline-offset: 3px; }
      .slvh-list-fade {
        -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%);
        mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%);
      }
      .slvh-btn { transition: color .25s ease, box-shadow .25s ease, background .25s ease; }
      .slvh-btn:hover { color: ${CYAN}; }
      .slvh-range { -webkit-appearance: none; appearance: none; background: transparent; height: 14px; }
      .slvh-range::-webkit-slider-runnable-track { height: 3px; border-radius: 2px; background: rgba(255,255,255,0.18); }
      .slvh-range::-moz-range-track { height: 3px; border-radius: 2px; background: rgba(255,255,255,0.18); }
      .slvh-range::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; margin-top: -3.5px;
        width: 10px; height: 10px; border-radius: 50%; border: none; cursor: pointer;
        background: var(--slvh-thumb, #fff);
      }
      .slvh-range::-moz-range-thumb {
        width: 10px; height: 10px; border-radius: 50%; border: none; cursor: pointer;
        background: var(--slvh-thumb, #fff);
      }
    `}</style>
  )

  const roundBtn = (size: number, accent: string, on: boolean): React.CSSProperties => ({
    background: "rgba(18,18,16,0.62)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: `1px solid ${accent}`,
    boxShadow: on ? `0 0 14px ${accent}` : "none",
    borderRadius: 999,
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  })

  // The wide/card toggle is desktop-only: the compact layout is always
  // edge-to-edge, so shipping the control there would be a dead switch.
  const buttonCluster = (size: number, showWide: boolean) => (
    <>
      <button
        onClick={() => setTheme((t) => (t === "video" ? "minimal" : "video"))}
        aria-label={theme === "video" ? "Switch to the minimal theme" : "Switch to the video theme"}
        title="Switch theme"
        className="slvh-btn slvh-focusable"
        style={{ ...roundBtn(size, fgMutedVar(0.3), false), color: fgMutedVar(0.75) }}
      >
        <RefreshCw size={Math.round(size * 0.42)} />
      </button>

      <button
        onClick={() => setSoundOn((s) => !s)}
        aria-label={soundOn ? "Mute the scroll click" : "Unmute the scroll click"}
        title="Scroll click"
        className="slvh-btn slvh-focusable"
        style={{ ...roundBtn(size, `${CYAN}55`, soundOn), color: soundOn ? CYAN : fgMutedVar(0.55) }}
      >
        {soundOn ? <Volume2 size={Math.round(size * 0.44)} /> : <VolumeX size={Math.round(size * 0.44)} />}
      </button>

      {showWide && (
      <button
        onClick={() => setIsWide((f) => !f)}
        aria-label={isWide ? "Shrink to the floating card" : "Expand to the wide view"}
        title={isWide ? "Floating card" : "Wide view"}
        className="slvh-btn slvh-focusable"
        style={{ ...roundBtn(size, `${AMBER}55`, isWide), color: isWide ? AMBER : fgMutedVar(0.55) }}
      >
        {isWide ? <Minimize2 size={Math.round(size * 0.44)} /> : <Maximize2 size={Math.round(size * 0.44)} />}
      </button>
      )}
    </>
  )

  const listBody = (
    <div style={{ position: "absolute", left: 0, right: 0, top: "30%", height: 0, transformStyle: "preserve-3d" }}>
      {projects.map((p, i) => (
        <ProjectRow
          key={p.id}
          project={p}
          index={i}
          isActive={i === activeIndex}
          isAutoAdvancing={isAutoAdvancing && !reducedMotion}
          setRowRef={setRowRef}
          onSelect={() => (i === activeIndex ? openActive() : selectIndex(i))}
        />
      ))}
    </div>
  )

  // The site header is 64px tall and fixed. Reserving that height here, rather
  // than nudging the title down with a top offset, is what stops the two from
  // ever sharing a row.
  //
  // 80 is the clearance the rest of the site uses too — `scroll-mt-20` on every
  // section, the anchor offset in SmoothScroll, and the pin start on the project
  // ribbon. Compact needs more because the title drops below the icon cluster
  // rather than sitting beside it.
  const NAV_CLEARANCE = isCompact ? 92 : 80

  /**
   * Everything behind the content: the video (or the minimal backdrop) plus the
   * scrims that darken it. Absolutely positioned, so it never takes part in the
   * flex layout dividing the height in front of it.
   */
  const videoLayers = (zoomed: boolean) =>
    theme === "video" ? (
      <>
        {/* The frame around this clips at its own bounds, so nothing behind is
            ever revealed. Only this inner, oversized layer tilts. */}
        <div
          ref={videoWrapRef}
          style={{
            position: "absolute",
            inset: 0,
            background: bgVar,
            transformStyle: "preserve-3d",
            transform: zoomed ? "scale(1.45)" : "none",
            transition: "transform 0.5s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {scrub ? (
            <ScrubVideo ref={scrubVideoRef} src={videoSrc} poster={posterSrc} />
          ) : (
            <SeamlessLoopVideo src={videoSrc} poster={posterSrc} playing={!reducedMotion} />
          )}
        </div>
        {/* lens vignette — the "wide angle" read on the screen itself */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 55%, rgba(8,8,6,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Top stop is heavy on purpose: the headline sits on this, and a bright
            sign or lamp landing behind it would otherwise eat the text. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(9,9,7,0.62) 0%, rgba(9,9,7,0.1) 30%, rgba(9,9,7,0.35) 58%, rgba(9,9,7,0.9) 100%)",
            pointerEvents: "none",
          }}
        />
      </>
    ) : (
      <MinimalBackdrop />
    )

  /**
   * The deck — list plus control bar — as a flex item rather than something
   * pinned to the bottom edge.
   *
   * This is the fix for the overlap bug: the title band and the deck used to be
   * positioned from opposite edges with nothing relating them, so the moment
   * their natural heights exceeded the viewport they grew straight into each
   * other. As flex items with a spacer between them they divide the height
   * instead of competing for it, which makes the collision impossible by
   * construction rather than merely avoided by picking lucky numbers.
   */
  const deckStack = (compact: boolean, bounded: boolean) => (
    <div
      ref={deckRef}
      data-lenis-prevent
      style={{
        // `0 1 auto` — never grows, but is allowed to shrink. Together with the
        // flexible list below it, that makes the deck the second thing to give
        // way on a short window, after the spacer has already collapsed.
        flex: "0 1 auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
        zIndex: 4,
        width: "100%",
        maxWidth: bounded ? WIDE_DECK_HALF * 2 : undefined,
        margin: "0 auto",
        padding: compact ? "0 12px 16px" : "0 14px 14px",
        boxSizing: "border-box",
      }}
    >
      <div
        ref={listViewportRef}
        className="slvh-list-fade"
        onPointerEnter={() => setIsHoveringDeck(true)}
        onPointerLeave={() => setIsHoveringDeck(false)}
        style={{
          position: "relative",
          // A preferred height that can still be squeezed: the rows fade out at
          // the edges anyway, so losing a little of the list is far cheaper than
          // clipping the control bar or letting the title collide with it.
          flex: "1 1 auto",
          height: compact ? "26vh" : "30vh",
          minHeight: compact ? 96 : 110,
          maxHeight: compact ? 240 : 290,
          overflow: "hidden",
          perspective: "1500px",
          perspectiveOrigin: "50% 30%",
          touchAction: "none",
        }}
      >
        {listBody}
      </div>

      <PlayerControls
        compact={compact}
        project={activeProject}
        index={activeIndex}
        total={n}
        isAutoAdvancing={isAutoAdvancing}
        onToggleAuto={() => setIsAutoAdvancing((p) => !p)}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onOpen={openActive}
        soundOn={soundOn}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  )

  /**
   * The title band. In the full-bleed compositions it is a flex item at the top
   * of the column, so it can only ever take the room above the deck; in the
   * floating-card composition it sits in normal flow above the card.
   *
   * The type is capped against viewport height as well as width. Width alone
   * was half the bug: at 1900px wide the headline wants 92px, three lines of
   * that is 254px, and on a short window there is nothing left for the deck.
   */
  const heading = (overlay: boolean, compact: boolean) => (
    <div
      style={{
        flex: overlay ? "0 0 auto" : undefined,
        zIndex: overlay ? 20 : undefined,
        // The band must not swallow pointer events belonging to the video
        // underneath it; the signature link opts back in for itself.
        pointerEvents: overlay ? "none" : undefined,
        paddingTop: overlay ? NAV_CLEARANCE : undefined,
        paddingLeft: overlay ? 20 : undefined,
        paddingRight: overlay ? 20 : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {eyebrow && <span style={eyebrowStyle}>{eyebrow}</span>}
      <h1
        style={{
          margin: 0,
          // Bebas is condensed and caps-only, so it takes a far larger size than
          // a normal sans at the same measure — and needs positive tracking,
          // since tight tracking on all-caps condensed type closes it up.
          fontFamily: DISPLAY,
          fontWeight: 400,
          textTransform: "uppercase",
          // Three separate caps because the three compositions have different
          // budgets: full-bleed gives the headline the whole screen, while card
          // view has to leave room for a square card underneath it.
          fontSize: compact
            ? "min(clamp(32px, 10.5vw, 54px), 9vh)"
            : overlay
              ? "min(clamp(40px, 6.4vw, 92px), 11vh)"
              : "min(clamp(36px, 5vw, 68px), 9vh)",
          letterSpacing: "0.01em",
          lineHeight: 0.92,
          color: overlay ? "#fff" : fgVar,
          textAlign: "center",
          maxWidth: "15ch",
          textShadow: "0 4px 26px rgba(0,0,0,0.7)",
        }}
      >
        {title}
      </h1>
      {signature && (
        <a
          href={signature.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...signatureStyle, pointerEvents: "auto" }}
        >
          {signature.name}
        </a>
      )}
    </div>
  )

  const hint = (compact: boolean) => (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: fgMutedVar(0.45),
        whiteSpace: "nowrap",
      }}
    >
      <MousePointerClick size={13} />
      {scrub ? hints.scrollToExplore : compact ? hints.dragToBrowse : hints.scrollOverDeck}
    </div>
  )

  /**
   * The breathing room between the title and the deck, and where the hint now
   * lives: parked in the middle of whatever space is left over, it cannot be
   * pushed into either neighbour. `overflow: hidden` lets this be the part that
   * gives way first when the window is genuinely too short.
   */
  const spacer = (compact: boolean) => (
    <div
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        pointerEvents: "none",
        padding: "0 20px",
      }}
    >
      {hint(compact)}
    </div>
  )

  const liveRegion = (
    <span aria-live="polite" style={srOnly}>
      {announcement}
    </span>
  )

  // ── COMPACT / TOUCH: no floating card and no background image — the video
  //    fills a full-height block with the deck laid over it, like an app screen.
  if (isCompact) {
    return (
      <section
        className={className}
        style={{
          position: "relative",
          height: fullBleed ? "100dvh" : undefined,
          minHeight: 560,
          width: "100%",
          background: bgVar,
          overflow: "hidden",
          ...style,
        }}
      >
        {sharedStyles}
        <div
          ref={cardRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="application"
          aria-label={deckLabel}
          className="slvh-focusable"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: bgVar,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {videoLayers(false)}
          {liveRegion}
          {heading(true, true)}
          {spacer(true)}
          {deckStack(true, false)}
        </div>

        <div
          style={{
            position: "absolute",
            top: "clamp(76px, 11vh, 108px)",
            right: 14,
            zIndex: 21,
            display: "flex",
            gap: 8,
          }}
        >
          {buttonCluster(34, false)}
        </div>
      </section>
    )
  }

  // ── DESKTOP ────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      className={className}
      style={{
        position: "relative",
        // Scrub makes the section taller than the viewport. The sticky child
        // below is all the visitor ever sees; the extra height is the runway
        // that scroll progress is measured against.
        //
        // `overflow: hidden` deliberately lives on the child, not here — an
        // ancestor with a clipped overflow becomes a scroll container and
        // silently kills `position: sticky` inside it.
        height: scrub ? `calc(100dvh + ${scrubDistance}px)` : fullBleed ? "100dvh" : undefined,
        width: "100%",
        background: bgVar,
        ...style,
      }}
    >
      <div
        ref={isWide ? cardRef : undefined}
        onPointerMove={isWide ? onCardMove : undefined}
        onPointerLeave={isWide ? onCardLeave : undefined}
        onKeyDown={isWide ? handleKeyDown : undefined}
        tabIndex={isWide ? 0 : undefined}
        role={isWide ? "application" : undefined}
        aria-label={isWide ? deckLabel : undefined}
        className={isWide ? "slvh-focusable" : undefined}
        style={{
          position: scrub ? "sticky" : "relative",
          top: 0,
          height: scrub ? "100dvh" : "100%",
          minHeight: 560,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: isWide ? undefined : "center",
          // Not `center`: a flex container centring an item taller than itself
          // overflows in BOTH directions, which is how the headline ended up
          // underneath the fixed site header. The column below uses `margin:
          // auto 0` instead — that centres when there is room and simply stays
          // at the start when there is not, so it can never overflow upward.
          justifyContent: isWide ? undefined : "flex-start",
          // Top padding reserves the fixed 64px header. Full-bleed modes reserve
          // it inside the title band instead, since their video runs edge to edge.
          padding: isWide
            ? 0
            : `${NAV_CLEARANCE}px clamp(16px, 3vw, 48px) clamp(16px, 3vw, 48px)`,
          boxSizing: "border-box",
        }}
      >
        {sharedStyles}

        {/* The immersive photo behind the floating card. Only ever visible in
            card view — wide view covers it edge to edge. A rich fallback
            gradient sits behind it always, so a wrong path shows colour rather
            than black, which makes a broken asset obvious. */}
        {!isWide && theme === "video" && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at 30% 25%, ${CYAN}44, transparent 55%), radial-gradient(circle at 75% 70%, ${AMBER}33, transparent 55%), #0a0a09`,
              }}
            />
            {backgroundSrc && (
              <div
                ref={bgRef}
                style={{
                  position: "absolute",
                  inset: "-6%",
                  backgroundImage: `url(${backgroundSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transform: "scale(1.06)",
                  animation: reducedMotion ? "none" : "slvh-drift 16s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 40%, rgba(8,8,6,0.78) 100%)",
                pointerEvents: "none",
              }}
            />
          </>
        )}
        {!isWide && theme === "minimal" && <MinimalBackdrop />}

        <div
          style={{
            position: "absolute",
            // clears the site header, which is 64px tall
            top: "clamp(78px, 12vh, 116px)",
            right: "clamp(12px, 2.5vw, 24px)",
            zIndex: 21,
            display: "flex",
            gap: 10,
          }}
        >
          {buttonCluster(40, true)}
        </div>

        {isWide ? (
          <>
            {videoLayers(true)}
            {liveRegion}
            {heading(true, false)}
            {spacer(false)}
            {deckStack(false, true)}
          </>
        ) : (
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(14px, 2.4vh, 26px)",
              // Safe centring — see the note on justifyContent above.
              margin: "auto 0",
            }}
          >
            {heading(false, false)}

            {/* The wide-angle "lens" wrapper. The perspective has to live HERE,
                on the parent: a `perspective` set on the rotating element itself
                only applies to its children, so the card's own rotateY would
                flatten into a plain 2D skew. */}
            <div style={{ position: "relative", perspective: "1700px" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "128%",
                  height: "118%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(ellipse, ${CYAN}55, transparent 68%)`,
                  filter: "blur(40px)",
                  mixBlendMode: "screen",
                  animation: reducedMotion ? "none" : "slvh-pulse 4s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              <div
                ref={cardRef}
                onPointerMove={onCardMove}
                onPointerLeave={onCardLeave}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="application"
                aria-label={deckLabel}
                className="slvh-focusable"
                style={{
                  position: "relative",
                  // Was 58dvh, which together with a three-line headline and the
                  // header reservation did not fit on a short window.
                  width: "min(46dvh, 420px)",
                  height: "min(46dvh, 420px)",
                  borderRadius: 30,
                  overflow: "hidden",
                  background: bgVar,
                  boxShadow: `0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px ${CYAN}2b, inset 0 0 60px rgba(0,0,0,0.25)`,
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${BASE_ROTATE_Y}deg) rotateX(${BASE_ROTATE_X}deg)`,
                  transition: "transform 0.5s cubic-bezier(.2,.8,.2,1)",
                  touchAction: "none",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {videoLayers(false)}
                {liveRegion}
                {spacer(false)}
                {deckStack(false, false)}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: CYAN,
  textShadow: "0 2px 14px rgba(0,0,0,0.6)",
}

const signatureStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  color: fgMutedVar(0.55),
  textDecoration: "none",
}

/**
 * The video in scrub mode: a single element that never plays itself. Its
 * playhead is written every frame from the scroll position, so it is paused
 * from the first moment — calling play() would put a second author on
 * currentTime and the two would stutter against each other.
 *
 * Scrubbing only stays smooth if the file was encoded with dense keyframes;
 * seeking into a clip with one keyframe means decoding from the start every
 * time. See the README for the encode used here.
 */
const ScrubVideo = forwardRef<HTMLVideoElement, { src: string; poster?: string }>(
  function ScrubVideo({ src, poster }, ref) {
    return (
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    )
  }
)

// ─────────────────────────────────────────────────────────────
// Two stacked <video> elements crossfading into each other just before the
// loop point, instead of the native `loop` attribute's hard seek-and-restart
// — which is what actually causes the little stutter, however well the file
// itself loops. The inactive video starts and fades in during the last
// second of the active one; once the fade completes they swap roles.
// ─────────────────────────────────────────────────────────────
const CROSSFADE_S = 1

function SeamlessLoopVideo({
  src,
  poster,
  playing,
  style,
}: {
  src: string
  poster?: string
  playing: boolean
  style?: React.CSSProperties
}) {
  const aRef = useRef<HTMLVideoElement>(null)
  const bRef = useRef<HTMLVideoElement>(null)
  const activeRef = useRef<"a" | "b">("a")
  const crossfadingRef = useRef(false)
  const [aOpacity, setAOpacity] = useState(1)
  const [bOpacity, setBOpacity] = useState(0)

  useEffect(() => {
    const active = activeRef.current === "a" ? aRef.current : bRef.current
    if (!active) return
    if (playing) active.play().catch(() => {})
    else active.pause()
  }, [playing])

  useEffect(() => {
    const a = aRef.current
    const b = bRef.current
    if (!a || !b) return
    a.play().catch(() => {})
    let rafId = 0
    const tick = () => {
      const active = activeRef.current === "a" ? a : b
      const inactive = activeRef.current === "a" ? b : a
      if (active.duration) {
        const remaining = active.duration - active.currentTime
        if (!crossfadingRef.current && remaining <= CROSSFADE_S) {
          crossfadingRef.current = true
          inactive.currentTime = 0
          inactive.play().catch(() => {})
        }
        if (crossfadingRef.current) {
          const t = clamp(1 - remaining / CROSSFADE_S, 0, 1)
          if (activeRef.current === "a") {
            setAOpacity(1 - t)
            setBOpacity(t)
          } else {
            setBOpacity(1 - t)
            setAOpacity(t)
          }
          if (remaining <= 0.03) {
            active.pause()
            crossfadingRef.current = false
            activeRef.current = activeRef.current === "a" ? "b" : "a"
          }
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }
  return (
    <>
      <video
        ref={aRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ ...base, ...style, opacity: aOpacity }}
      />
      <video
        ref={bRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ ...base, ...style, opacity: bOpacity }}
      />
    </>
  )
}

// Backdrop for the minimal theme under Deep Ink: a lit grid rather than the
// blurred orbs it replaced. Orbs were soft blue shapes on a blue ground, which
// on a near-neutral ink base just read as smudges — a ruled grid gives the same
// depth using the one thing this palette still has, the cyan.
//
// Both grids drift by animating background-position exactly one cell, so the
// tiling stays seamless instead of sliding off and snapping back. Keyframes are
// self-contained here so the theme works wherever it is rendered.
function MinimalBackdrop() {
  return (
    <div style={{ position: "absolute", inset: 0, background: bgVar, overflow: "hidden" }}>
      <style>{`
        @keyframes slvh-grid-fine { from { background-position: 0 0; } to { background-position: 34px 34px; } }
        @keyframes slvh-grid-wide { from { background-position: 0 0; } to { background-position: -170px 170px; } }
        @keyframes slvh-scan { 0% { transform: translateY(-30%); } 100% { transform: translateY(130%); } }
        @keyframes slvh-glow-a { 0%,100% { transform: translate(0,0) scale(1); opacity: .55; } 50% { transform: translate(7%,5%) scale(1.15); opacity: .9; } }
        @keyframes slvh-glow-b { 0%,100% { transform: translate(0,0) scale(1.08); opacity: .45; } 50% { transform: translate(-6%,-4%) scale(.95); opacity: .8; } }
      `}</style>

      {/* soft colour, kept only as a wash so the grid has something to sit in */}
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "60%",
          left: "-14%",
          top: "-16%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${CYAN}2e, transparent 70%)`,
          filter: "blur(60px)",
          animation: "slvh-glow-a 15s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "50%",
          height: "50%",
          right: "-12%",
          bottom: "-14%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${AMBER}24, transparent 70%)`,
          filter: "blur(65px)",
          animation: "slvh-glow-b 19s ease-in-out infinite 1s",
        }}
      />

      {/* fine grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${CYAN}1f 1px, transparent 1px), linear-gradient(90deg, ${CYAN}1f 1px, transparent 1px)`,
          backgroundSize: "34px 34px",
          animation: "slvh-grid-fine 7s linear infinite",
        }}
      />
      {/* coarse grid, drifting the other way so the two never lock into a moiré */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${CYAN}33 1px, transparent 1px), linear-gradient(90deg, ${CYAN}33 1px, transparent 1px)`,
          backgroundSize: "170px 170px",
          animation: "slvh-grid-wide 26s linear infinite",
        }}
      />

      {/* CRT scanlines — static on purpose; animating them strobes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)",
          pointerEvents: "none",
        }}
      />

      {/* one slow sweep down the screen, the only thing that reads as "live" */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "22%",
          background: `linear-gradient(180deg, transparent, ${CYAN}14 45%, ${CYAN}22 55%, transparent)`,
          animation: "slvh-scan 11s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* vignette, so the grid fades out at the edges instead of being cut off */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 35%, rgba(8,8,6,0.85) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}

function ProjectRow({
  project,
  index,
  isActive,
  isAutoAdvancing,
  setRowRef,
  onSelect,
}: {
  project: Project
  index: number
  isActive: boolean
  isAutoAdvancing: boolean
  setRowRef: (i: number) => (el: HTMLDivElement | null) => void
  onSelect: () => void
}) {
  const bar = (name: string, duration: string) => (
    <span
      style={{
        width: 3,
        borderRadius: 2,
        background: project.colorA,
        animation: isAutoAdvancing ? `${name} ${duration} ease-in-out infinite` : "none",
        height: isAutoAdvancing ? undefined : 4,
      }}
    />
  )
  return (
    <div
      ref={setRowRef(index)}
      onClick={onSelect}
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        top: -ROW_HEIGHT / 2,
        height: ROW_HEIGHT,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 10px",
        borderRadius: 14,
        cursor: "pointer",
        // Only the centred project gets any backing at all — a soft glass pill
        // plus a coloured glow. Everything else sits directly on the video with
        // just a text-shadow for legibility.
        background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
        backdropFilter: isActive ? "blur(14px)" : "none",
        WebkitBackdropFilter: isActive ? "blur(14px)" : "none",
        boxShadow: isActive ? `inset 0 0 0 1px ${project.colorA}55, 0 0 26px ${project.colorA}33` : "none",
        transformOrigin: "center center",
        willChange: "transform, opacity",
        transition: "background 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 40,
          height: 40,
          borderRadius: 9,
          flexShrink: 0,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${project.colorA}, ${project.colorB})`,
          boxShadow: isActive
            ? `0 0 20px ${project.colorA}55, 0 2px 6px rgba(0,0,0,0.4)`
            : "0 2px 8px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)",
          }}
        />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: isActive ? 700 : 500,
            fontSize: isActive ? 15 : 13,
            color: isActive ? fgVar : fgMutedVar(0.68),
            textShadow: isActive ? "0 2px 12px rgba(0,0,0,0.5)" : "0 1px 6px rgba(0,0,0,0.85)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {project.title}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: "0.06em",
            color: isActive ? fgMutedVar(0.7) : fgMutedVar(0.4),
            textShadow: "0 1px 6px rgba(0,0,0,0.85)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {project.subtitle}
        </div>
      </div>
      {isActive && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 15 }}>
            {bar("slvh-eq1", "0.9s")}
            {bar("slvh-eq2", "0.75s")}
            {bar("slvh-eq3", "1.05s")}
          </div>
          {project.href && <ArrowUpRight size={15} color={project.colorA} />}
        </div>
      )}
    </div>
  )
}

// The bottom glass bar. Upstream's version paired a video-ambience toggle with
// a volume slider; the video here is silent, so the slider drives the detent
// click — the one sound this component actually makes — and it only appears
// while the click is unmuted, rather than sitting there doing nothing.
function PlayerControls({
  compact,
  project,
  index,
  total,
  isAutoAdvancing,
  onToggleAuto,
  onPrev,
  onNext,
  onOpen,
  soundOn,
  volume,
  onVolumeChange,
}: {
  compact?: boolean
  project: Project
  index: number
  total: number
  isAutoAdvancing: boolean
  onToggleAuto: () => void
  onPrev: () => void
  onNext: () => void
  onOpen: () => void
  soundOn: boolean
  volume: number
  onVolumeChange: (v: number) => void
}) {
  const iconBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    color: fgMutedVar(0.65),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 6,
  }
  const meta = [project.kind, project.year].filter(Boolean).join(" · ")

  return (
    <div
      style={{
        // In normal flow directly under the list: the deck container is what
        // bounds its width, and stacking it here is what guarantees the bar can
        // never land on top of the rows above it.
        position: "relative",
        marginTop: compact ? 10 : 12,
        zIndex: 4,
        borderRadius: 16,
        background: cardVar(0.6),
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        boxShadow: `inset 0 0 0 1px ${CYAN}2a`,
        padding: compact ? "10px 12px 12px" : "10px 16px 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: compact ? 36 : 44,
            height: compact ? 36 : 44,
            borderRadius: 9,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${project.colorA}, ${project.colorB})`,
            boxShadow: `0 0 16px ${project.colorA}55`,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: compact ? 13 : 13.5,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {project.title}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: fgMutedVar(0.58),
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {meta || project.subtitle}
          </div>
        </div>

        <button onClick={onPrev} aria-label="Previous project" className="slvh-btn slvh-focusable" style={iconBtn}>
          <ChevronUp size={18} />
        </button>
        <button
          onClick={onToggleAuto}
          aria-label={isAutoAdvancing ? "Pause auto-advance" : "Start auto-advance"}
          className="slvh-focusable"
          style={{
            ...iconBtn,
            width: compact ? 38 : 42,
            height: compact ? 38 : 42,
            borderRadius: 999,
            background: project.colorA,
            boxShadow: `0 0 18px ${project.colorA}66`,
            color: "#0a0a09",
          }}
        >
          {isAutoAdvancing ? <Pause size={15} fill="#0a0a09" /> : <Play size={15} fill="#0a0a09" />}
        </button>
        <button onClick={onNext} aria-label="Next project" className="slvh-btn slvh-focusable" style={iconBtn}>
          <ChevronDown size={18} />
        </button>
        {project.href && (
          <button
            onClick={onOpen}
            aria-label={`Open ${project.title}`}
            className="slvh-btn slvh-focusable"
            style={iconBtn}
          >
            <ArrowUpRight size={18} />
          </button>
        )}
      </div>

      {/* A real position readout, not a fake progress bar: the deck has no
          duration to run down, only a place in the list. */}
      <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 10 }}>
        {soundOn && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Scroll click volume"
            title="Scroll click volume"
            className="slvh-range slvh-focusable"
            style={
              {
                width: compact ? 56 : 72,
                flexShrink: 0,
                "--slvh-thumb": project.colorA,
              } as React.CSSProperties
            }
          />
        )}
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i === index ? project.colorA : "rgba(255,255,255,0.14)",
                boxShadow: i === index ? `0 0 8px ${project.colorA}88` : "none",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: "0.08em",
            color: fgMutedVar(0.5),
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  )
}
