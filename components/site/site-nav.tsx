"use client"

import { useEffect, useState } from "react"
import { Code2, Mail } from "lucide-react"
import { profile } from "@/lib/site"
import { cn } from "@/lib/utils"

const links = [
  { href: "#about", label: "about" },
  { href: "#projects", label: "work" },
  { href: "#skills", label: "skills" },
  { href: "#contact", label: "contact" },
]

/**
 * A running clock, rendered only after mount. Server-rendering a time would
 * hydrate to a different value and blow up, and there is nothing meaningful to
 * show before the client knows the visitor's timezone anyway.
 */
function Clock() {
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="mono-label hidden tabular-nums text-muted-foreground lg:inline">
      {now ?? "--:--:--"}
    </span>
  )
}

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled && "border-b border-white/10 bg-background/80 backdrop-blur-xl"
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <a
          href="#top"
          className="mono-label text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {profile.nickname}
          <span className="text-primary">.</span>
          <span className="ml-2 hidden normal-case tracking-normal text-muted-foreground sm:inline">
            {profile.nameEn}
          </span>
        </a>

        <div className="flex items-center gap-1">
          <Clock />
          <span aria-hidden className="mx-3 hidden h-3 w-px bg-white/15 lg:inline-block" />
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="mono-path mono-label rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Code2 size={17} />
          </a>
          {/* Rendered only when there is an address: a bare `mailto:` opens an
              empty draft, which reads as a broken link rather than a missing one. */}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              aria-label="Email me"
              className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Mail size={17} />
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
