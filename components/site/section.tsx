import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Reveal } from "./reveal"

/**
 * The shared section header: a mono terminal path, a rule that runs to the
 * section index, then a Bebas headline. Every section on the page is framed the
 * same way, which is what makes the terminal voice read as a system rather than
 * as decoration applied one-off.
 */
export function Section({
  id,
  eyebrow,
  index,
  title,
  lead,
  children,
  bleed = false,
  className,
}: {
  /** anchor id, also the path shown after `~/` */
  id: string
  /** the path segment, lowercase — `~/` is prepended in CSS */
  eyebrow: string
  /** two-digit section number shown at the end of the rule */
  index?: string
  title: string
  lead?: string
  children: ReactNode
  /** render children outside the max-width container, for full-bleed content */
  bleed?: boolean
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn("relative scroll-mt-20 border-t border-white/[0.06] py-20 sm:py-28", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="flex items-center gap-4">
          <span className="mono-label mono-path text-primary">{eyebrow}</span>
          <span aria-hidden className="h-px flex-1 bg-white/10" />
          {index && <span className="mono-label text-muted-foreground">{index}</span>}
        </div>

        <Reveal
          as="h2"
          className="mt-6 max-w-4xl text-[clamp(2.5rem,7vw,4.75rem)] text-foreground"
        >
          {title}
        </Reveal>

        {lead && (
          <Reveal
            as="p"
            delay={0.12}
            className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground"
          >
            {lead}
          </Reveal>
        )}

        {!bleed && <div className="mt-14">{children}</div>}
      </div>
      {bleed && <div className="mt-14">{children}</div>}
    </section>
  )
}
