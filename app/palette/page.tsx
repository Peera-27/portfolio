"use client"

import { useState } from "react"

/**
 * A scratch route for choosing a background direction — not part of the site.
 * Delete `app/palette/` once a direction is picked.
 *
 * Each preset is the exact set of CSS variables that would go into
 * app/globals.css. They are applied to a wrapper div rather than :root, so all
 * of them render side by side against the real fonts and the real components'
 * styling without any one of them fighting the global theme.
 */

type Preset = {
  id: string
  name: string
  blurb: string
  /** what changes beyond the variables, if anything */
  extra: string
  cost: "drop-in" | "needs work"
  vars: Record<string, string>
  /** the minimal-theme backdrop that would go with it */
  backdrop: "grid" | "orbs" | "paper"
}

const CURRENT: Preset = {
  id: "current",
  name: "Now · Navy",
  blurb: "What the site ships today. Blue-black carrying a cyan and amber pair.",
  extra: "No change.",
  cost: "drop-in",
  backdrop: "orbs",
  vars: {
    "--background": "222 47% 5%",
    "--foreground": "210 40% 98%",
    "--card": "222 40% 9%",
    "--primary": "207 82% 70%",
    "--accent": "14 87% 63%",
    "--muted-foreground": "215 20% 68%",
    "--border": "217 33% 20%",
  },
}

const PRESETS: Preset[] = [
  {
    id: "ink",
    name: "A · Deep Ink",
    blurb:
      "Near-black with a faint warm cast — the same #0a0a09 the reference site uses behind its sidebar. Takes all the blue out of the base, so cyan and amber become the only colour on the page.",
    extra: "Minimal backdrop becomes a fine grid with scanlines instead of blurred orbs.",
    cost: "drop-in",
    backdrop: "grid",
    vars: {
      "--background": "60 5% 4%",
      "--foreground": "40 10% 96%",
      "--card": "60 4% 8%",
      "--primary": "207 82% 70%",
      "--accent": "14 87% 63%",
      "--muted-foreground": "40 5% 62%",
      "--border": "40 6% 18%",
    },
  },
  {
    id: "petrol",
    name: "B · Midnight Petrol",
    blurb:
      "Stays dark and blue but swings from navy toward teal, deeper and more saturated than today. Closer to the video's own colour, so the hero reads as part of the page rather than a bright rectangle sitting on it.",
    extra: "Minimal backdrop keeps its orbs, with a faint grid layered underneath.",
    cost: "drop-in",
    backdrop: "orbs",
    vars: {
      "--background": "197 60% 6%",
      "--foreground": "195 25% 96%",
      "--card": "197 45% 10%",
      "--primary": "187 78% 62%",
      "--accent": "14 87% 63%",
      "--muted-foreground": "197 15% 66%",
      "--border": "197 30% 20%",
    },
  },
  {
    id: "paper",
    name: "C · Paper",
    blurb:
      "The reference site's cream, with the hero left dark so it reads as a full-bleed break. By far the biggest change — and the only one that makes this look like a different site.",
    extra:
      "Every accent has to be re-picked: cyan on cream is nearly invisible, so primary becomes a deep mint and amber darkens. The hero hardcodes its own CYAN/AMBER constants and would need editing too.",
    cost: "needs work",
    backdrop: "paper",
    vars: {
      "--background": "38 35% 94%",
      "--foreground": "30 8% 12%",
      "--card": "38 25% 98%",
      "--primary": "152 45% 34%",
      "--accent": "14 70% 45%",
      "--muted-foreground": "30 5% 40%",
      "--border": "30 10% 82%",
    },
  },
]

function Backdrop({ kind }: { kind: Preset["backdrop"] }) {
  if (kind === "grid") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, hsl(var(--foreground) / 0.07) 0 1px, transparent 1px 3px)",
          }}
        />
      </div>
    )
  }

  if (kind === "paper") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-8 -top-10 h-40 w-40 rounded-full blur-2xl"
          style={{ background: "hsl(var(--primary) / 0.22)" }}
        />
        <div
          className="absolute -bottom-10 -right-6 h-32 w-32 rounded-full blur-2xl"
          style={{ background: "hsl(var(--accent) / 0.18)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-3/5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ borderColor: "hsl(var(--foreground) / 0.14)" }}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute -left-10 -top-12 h-44 w-44 rounded-full blur-3xl"
        style={{ background: "hsl(var(--primary) / 0.3)" }}
      />
      <div
        className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full blur-3xl"
        style={{ background: "hsl(var(--accent) / 0.22)" }}
      />
    </div>
  )
}

/**
 * One preset applied to a slice of the real site: nav strip, section header,
 * project card, minimal-theme backdrop, footer. The wrapper carries the preset's
 * variables, so the frame itself is already wearing what it previews.
 */
function Sample({ preset }: { preset: Preset }) {
  return (
    <div
      style={preset.vars as React.CSSProperties}
      className="overflow-hidden rounded-2xl border"
    >
      <div className="bg-background text-foreground">
        <div className="flex items-center justify-between gap-4 border-b px-5 py-3">
          <span className="mono-label">
            Peera<span className="text-primary">.</span>
          </span>
          <span className="flex gap-3">
            {["about", "work", "skills"].map((l) => (
              <span key={l} className="mono-label mono-path text-muted-foreground">
                {l}
              </span>
            ))}
          </span>
        </div>

        <div className="px-5 pb-6 pt-7">
          <div className="flex items-center gap-3">
            <span className="mono-label mono-path text-primary">work</span>
            <span aria-hidden className="h-px flex-1" style={{ background: "hsl(var(--border))" }} />
            <span className="mono-label text-muted-foreground">02</span>
          </div>
          <h2 className="mt-4 text-[2.4rem] leading-[0.92]">Projects that taught me something</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Each one had its own problem to solve — the hardest part of each, not a list of
            technologies.
          </p>
        </div>

        <div className="px-5 pb-6">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <span className="mono-label text-muted-foreground">01</span>
              <span className="mono-label text-primary">↗</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1 h-9 w-9 flex-shrink-0 rounded-lg"
                style={{ background: "linear-gradient(135deg, #5cd0ff, #0e3a56)" }}
              />
              <div>
                <h3 className="text-xl leading-none">Chef Kub</h3>
                <p className="mono-label mt-2 text-muted-foreground">Computer Vision · 2026</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Next.js", "YOLO11n", "TensorFlow.js"].map((t) => (
                <span
                  key={t}
                  className="mono-label rounded-full border px-2.5 py-1 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <p className="mono-label mb-2 text-muted-foreground">minimal theme backdrop</p>
          <div className="relative h-36 overflow-hidden rounded-xl border bg-background">
            <Backdrop kind={preset.backdrop} />
            <div className="absolute inset-x-4 bottom-4">
              <div
                className="rounded-lg border px-3 py-2 backdrop-blur"
                style={{ background: "hsl(var(--card) / 0.6)" }}
              >
                <p className="mono-label text-muted-foreground">01 / 07</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
          <span className="mono-label text-muted-foreground">13.7563° N · 100.5018° E</span>
          <span
            className="mono-label rounded-full border px-3 py-1.5 text-primary"
            style={{
              borderColor: "hsl(var(--primary) / 0.4)",
              background: "hsl(var(--primary) / 0.1)",
            }}
          >
            send ↵
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PalettePage() {
  const [sideBySide, setSideBySide] = useState(true)
  const all = [CURRENT, ...PRESETS]

  return (
    <main className="mx-auto w-full max-w-[110rem] px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label mono-path text-primary">palette</p>
          <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.4rem)]">Pick a background direction</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            Each panel is the real components with one set of CSS variables applied. This is a
            scratch route — delete{" "}
            <code className="font-mono text-foreground">app/palette/</code> once you have chosen.
          </p>
        </div>
        <button
          onClick={() => setSideBySide((s) => !s)}
          className="mono-label rounded-full border border-white/15 px-4 py-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {sideBySide ? "stack full width" : "compare side by side"}
        </button>
      </div>

      <div
        className={
          sideBySide ? "mt-10 grid gap-8 lg:grid-cols-2 2xl:grid-cols-4" : "mt-10 space-y-12"
        }
      >
        {all.map((p) => (
          <section key={p.id}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-2xl leading-none">{p.name}</h2>
              <span className={`mono-label ${p.cost === "drop-in" ? "text-primary" : "text-accent"}`}>
                {p.cost}
              </span>
            </div>
            <p className="mb-2 text-[13px] leading-relaxed text-muted-foreground">{p.blurb}</p>
            <p className="mb-4 text-[12.5px] leading-relaxed text-muted-foreground/70">{p.extra}</p>

            <Sample preset={p} />

            <details className="mt-3">
              <summary className="mono-label cursor-pointer text-muted-foreground">
                globals.css values
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {Object.entries(p.vars)
                  .map(([k, v]) => `${k}: ${v};`)
                  .join("\n")}
              </pre>
            </details>
          </section>
        ))}
      </div>
    </main>
  )
}
