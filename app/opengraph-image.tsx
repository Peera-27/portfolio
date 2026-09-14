import { ImageResponse } from "next/og"

import { profile, skillGroups } from "@/lib/site"

/**
 * The card every scraper pulls when this link is pasted into LINE, Discord,
 * Facebook or a DM. Next picks this file up by convention: it fills in
 * `og:image` and `twitter:image` on every route, so there is nothing to wire up
 * in `layout.tsx` beyond `metadataBase`.
 *
 * Drawn rather than photographed, on purpose — the hero's video first frame is
 * a dark street, which turns to mud at 1200x630 behind a chat client's rounded
 * corners. Flat ink with the two accent colours survives that.
 *
 * Deliberately no custom webfont. Pulling Bebas Neue in here means fetching a
 * font file at build time, and a card that renders on a network hiccup is worth
 * more than one that matches the site's display face exactly.
 */
export const alt = `${profile.nameEn} — ${profile.role}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/* the same values as :root in globals.css, written out because ImageResponse
   has no stylesheet and no CSS variables */
const ink = "#0a0a09"
const paper = "#f5f4f1"
const cyan = "#74b9f1"
const amber = "#f3724c"
const muted = "#9e9a92"

export default function OpengraphImage() {
  const stack = skillGroups
    .flatMap((group) => group.items)
    .slice(0, 6)
    .join("   ·   ")

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: ink,
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* the hero's cyan glow, bled in from the top right */}
        <div
          style={{
            position: "absolute",
            top: -280,
            right: -180,
            width: 760,
            height: 760,
            borderRadius: 760,
            background: `radial-gradient(circle, ${cyan}2e 0%, ${cyan}00 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -320,
            left: -220,
            width: 700,
            height: 700,
            borderRadius: 700,
            background: `radial-gradient(circle, ${amber}24 0%, ${amber}00 70%)`,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: amber }} />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: cyan,
            }}
          >
            {profile.role}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.04,
              fontWeight: 700,
              color: paper,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            {profile.heroTitle}
          </div>
          <div style={{ fontSize: 34, color: muted, maxWidth: 900 }}>{profile.headline}</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: `1px solid ${paper}1f`,
            paddingTop: 32,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 40, fontWeight: 600, color: paper }}>{profile.nameEn}</div>
            <div style={{ fontSize: 24, color: muted, letterSpacing: 1 }}>{stack}</div>
          </div>
          {/* one interpolation, not `github.com/{handle}` — two children in a
              div is the one thing Satori refuses without an explicit display */}
          <div style={{ fontSize: 24, color: cyan, letterSpacing: 2 }}>
            {`github.com/${profile.githubHandle}`}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
