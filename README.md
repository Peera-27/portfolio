# Portfolio — Peeraphat Chompoosi

A personal portfolio built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui project structure**.
The hero is the `scroll-locked-video-hero` component, with the upstream music track list re-cast as a project deck.
The rest of the site is a terminal-flavoured layout: mono paths, a Bebas Neue display face, Lenis smooth scroll, and
GSAP for the line-by-line text reveals and the pinned horizontal project ribbon.

---

## Getting started

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # production build
bun start
```

`bun.lock` is the only lockfile in the repo, so a host reading the tree installs with Bun and gets the same dependency
versions this was built against. npm works too — just don't commit the `package-lock.json` it writes, because two
lockfiles leave the build platform to guess which one it should trust.

- `/` — the full site (hero + about + projects + skills + contact)
- `/demo` — the hero on its own, nothing else (the equivalent of `demo.tsx` in the brief), useful while tuning it.
  Nothing links to it and it is `noindex` + disallowed in `robots.txt`, so it stays a workbench rather than a page of the site

---

## Where the content lives

**Everything is in one file: `lib/site.ts`** — name, headline, project list, skills, contact links and asset
paths. No component code needs touching.

The profile and skills are kept in sync with [`app/config.ts`](https://github.com/Peera-27/Port) in the Port
repo, which is the source of truth for them. The per-project copy is written here, because neither GitHub
descriptions nor that config carry any.

Five projects are shown. Each can carry three optional fields, and every one of them degrades to nothing
rather than to something broken:

| Field | Renders | When absent |
|---|---|---|
| `href` | the repo button | button omitted — used by **Buffa**, whose repo is private, because a link that 404s for every visitor is worse than no link |
| `demo` | the **live** button | button omitted — an unfilled slot ships nothing rather than a link to nowhere |
| `status` | a small badge | no badge — so a finished solo project carries no extra chrome |

`status` describes how a project stands rather than what it is: **Albion Online Database** is a `collab`
(26 of that repository's 121 commits), **Buffa** is `in development`.

Adding or removing a project is a `lib/site.ts` edit and nothing else — the Projects section and the hero
deck both read the same array, and the section heading carries no count to keep in sync.

`profile.email` is intentionally blank, matching the Port config. While it is empty the contact section drops
the mail form and the email card and lets the social links carry the section, and the header hides its mail
icon — nothing points at an empty `mailto:`. Fill the field in and all three come back on their own.

```ts
export const media = {
  heroVideo:    "/media/hero-scrub.mp4",    // the hero's scroll-scrubbed track
  heroPoster:   "/media/hero-poster.jpg",   // first frame, so it is never a black box while loading
  heroBackdrop: "/media/hero-backdrop.jpg", // image behind the card (desktop only)
}
```

To swap the video or images: drop new files into `public/media/` and update the paths above.

### About the assets in this repo

The brief hardcoded its video and image to `raw.githubusercontent.com` on someone else's repo,
which breaks the moment that repo goes away. The assets here were rendered from scratch instead
(Canvas 2D → headless Chromium → ffmpeg) and committed to `public/` — no licensing questions and
no dependency on an external host.

The hero video is **scrubbed by scroll**, not played. That changes what the file has to be:

- **A keyframe every 4 frames.** Seeking into a clip with one keyframe forces a decode from the very
  start on every seek, which makes scrubbing unusable. `-g 4 -bf 0` fixes it.
- **No rain, smoke or particles.** Not a style choice — with dense keyframes there is no temporal
  redundancy left to exploit, so particle-heavy footage explodes in size. The same eight seconds of
  rain came to 10.4 MB; the current particle-free clip is 1.9 MB.
- **Every frame has to work as a still**, because the image stops dead whenever the visitor stops
  scrolling.
- **It does not need to loop.** Scrub runs the playhead back and forth, so the first and last frames
  are unrelated.

The encode used:

```bash
ffmpeg -i SOURCE.mp4   -vf "scale=1920:-2:flags=lanczos,eq=contrast=1.20:brightness=-0.09:saturation=0.72"   -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 25 -g 4 -bf 0 -preset slow   -an -movflags +faststart public/media/hero-scrub.mp4
```

> Note: the video carries no audio track, so the speaker button in the hero controls only the
> synthesized detent "click" produced by the Web Audio API while scrolling the deck. There are no
> audio files anywhere in the project.

---

## Project structure

```
app/
  layout.tsx          metadata / SEO / theme colour
  page.tsx            assembles the whole page
  demo/page.tsx       the hero alone
  globals.css         shadcn CSS variables + the Tailwind v4 theme
  icon.svg            favicon
components/
  ui/                 ← primitive components (where shadcn puts things)
    scroll-locked-video-hero.tsx
  site/               ← pieces specific to this site
    site-nav.tsx  about.tsx  projects.tsx  skills.tsx  contact.tsx
    site-footer.tsx  section.tsx
    smooth-scroll.tsx   Lenis + GSAP ticker, and anchor links routed through it
    reveal.tsx          SplitText line reveal on scroll
lib/
  site.ts             all site content
  utils.ts            cn() = clsx + tailwind-merge
public/media/         video + images
components.json       shadcn CLI config
```

### Why it has to be `components/ui/`

`components.json` declares the alias `"ui": "@/components/ui"`. When you run
`npx shadcn@latest add <component>`, the CLI writes files into that folder because of the alias.
Move the folder without updating `components.json` and `add` will simply recreate it, leaving every
generated import path pointing at the wrong place.

Keeping `ui/` (portable primitives) separate from `site/` (content-bound pieces) also makes it
obvious at a glance which files `shadcn add` is allowed to overwrite and which are hand-written.

---

## Setting this up from scratch

```bash
# 1) Next.js + TypeScript + Tailwind
npx create-next-app@latest my-portfolio \
  --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

cd my-portfolio

# 2) shadcn project structure
npx shadcn@latest init          # creates components.json + lib/utils.ts + CSS variables

# 3) the dependencies
npm i clsx tailwind-merge class-variance-authority lucide-react   # the hero needs only these
npm i gsap lenis                                                  # the site-wide motion

# 4) drop the component in
#    components/ui/scroll-locked-video-hero.tsx
```

The hero component itself depends on **no Radix, no shadcn primitive, and neither GSAP nor Lenis** — only
`lucide-react` for icons. Everything else in it is React, the Web Audio API and plain CSS, so it can be lifted into
another project on its own. GSAP and Lenis belong to the surrounding site, not to the component.

> `shadcn init` could not run in the sandbox this was built in (no outbound network), so
> `components.json` and `lib/utils.ts` were written by hand against the same schema. The result is
> identical, and `npx shadcn@latest add ...` works normally.

### ⚠️ The CSS variables must stay HSL triplets

The component reads theme colours like this:

```ts
const bgVar = "hsl(var(--background, 60 5% 4%))"
```

So `globals.css` stores **`60 5% 4%`**, not a full `hsl(...)` or `oklch(...)` value. Storing an
`oklch()` colour — the newer shadcn default — would produce `hsl(oklch(...))`, which is invalid CSS.
The browser skips it silently, the colour disappears, and **nothing reports an error**.

If you do move to oklch, update `bgVar` / `fgVar` / `cardVar` in the component to match.

---

## What was changed from the upstream component, and why

| Upstream | Here | Why |
|---|---|---|
| `wheel` / `touchmove` bound to `window` with `preventDefault()` | `wheel` captured only while the pointer is over the deck; `touch` bound to the list | Upstream seized scrolling for the whole page — you could never reach the sections below |
| Mobile used `position: fixed; inset: 0` | A normal `100dvh` block | Same reason: fixed covers the viewport permanently |
| Fullscreen card was `position: fixed` over the viewport | Wide view is `position: absolute` inside the hero section | Identical on load, but the page still scrolls past the hero |
| Play meant playing music (there is no music) | Play means auto-advance through projects, pausing on hover | The control does something real instead of decorating |
| A 28-second progress bar looping forever | A real position readout plus `01 / 07` | The upstream bar was fake progress |
| Shuffle / repeat buttons | Removed; an "open project" button took their place | Neither means anything for a project list |
| `perspective` set on the card that itself rotates | Moved to the parent | `perspective` only affects *children*, so upstream's card flattened into a 2D skew |
| Volume slider drove the video's ambience | It drives the detent click | The video has no audio track |
| Hand-written `<svg>` for every icon | `lucide-react` | Required by the brief |
| `prefers-reduced-motion` ignored | Disables auto-advance, tilt and drift | Accessibility |
| — | The deck is one element carrying `data-lenis-prevent` | Only used in the non-scrub fallback, but there the wheel zone and the smooth-scroll exclusion have to be the *same* set, or a gutter appears where both answer one wheel event |
| Video played on its own; wheel drove the deck | Scroll position drives both, with the section pinned | Scrolling over a full-bleed hero has to *do* something — and one progress value keeps the video and the deck from disagreeing |

---

## Using the hero

| Action | Result |
|---|---|
| Scroll anywhere over the hero | Scrubs the video and walks the project deck together, with a click at each detent |
| Keep scrolling past the end | The hero releases and the page carries on to the next section |
| Drag the list (touch) | Moves through projects — touch keeps the old momentum behaviour |
| Click a project that is not centred | Snaps to it |
| Click the centred project / Enter / the ↗ button | Opens the project link |
| ↑ ↓ ← → | Change project |
| Space | Toggle auto-advance |
| ⟳ button (top right) | Switch between the video theme and the minimal, video-less one |
| Speaker button | Mute or unmute the click; the slider sets its volume |
| Expand button | Toggle between wide view and the floating tilted card |

**Responsive:** switches to the compact layout when `pointer: coarse` **or** the window is narrower
than 760px. The width check matters because shrinking a desktop browser window does not change the
pointer type — going by `pointer: coarse` alone leaves the desktop layout stuck on narrow windows.

**Accessibility:** `role="application"` with an `aria-label` explaining the controls, `aria-live`
announcing the selected project (debounced 400ms so a fast flick does not fire per row), an
`aria-label` on every button, and a visible focus ring.

---

## Deploy

Every route is static (`○ Static`), so Vercel / Netlify / Cloudflare Pages all work as-is.

```bash
bun run build && bun start
```

**Set `NEXT_PUBLIC_SITE_URL` to the final domain.** `metadataBase`, `robots.txt` and `sitemap.xml` all read it through
`siteUrl` in `lib/site.ts`. On Vercel it falls back to the production domain the platform injects, so the site is
correct without any env var; anywhere else, an unset value means the Open Graph card is advertised at `localhost:3000`
and no scraper can fetch it.

## Type

Three faces, self-hosted through `next/font`, matching the reference site:

| Role | Face | Used for |
|---|---|---|
| display | **Bebas Neue** | every `h1`/`h2`/`h3`, set uppercase in `globals.css` |
| body | **DM Sans** | prose |
| mono | **Geist Mono** | `~/paths`, eyebrows, tags, meta, readouts, the contact form |

They are exposed as `--ff-display` / `--ff-body` / `--ff-mono` on `<html>`, then mapped onto Tailwind's
`font-display` / `font-sans` / `font-mono` utilities in `@theme`. The names differ on purpose: a `--font-display`
entry inside `@theme` *is* the `font-display` utility, so pointing it at a `--font-display` of our own would make the
variable reference itself.

The hero reads `var(--ff-body)` and friends directly rather than using Tailwind classes, because it styles itself
inline and has to survive being dropped into a project with no Tailwind at all.

---

## Colour

The base is **Deep Ink** — `#0a0a09`, a near-black with a faint warm cast rather than a blue one.
Pulling the blue out of the ground is the point: it leaves cyan `#74b9f1` and amber `#f3724c` as the
only colour anywhere, so they read as signal instead of competing with a navy that was already
halfway to cyan.

Two things do **not** follow the CSS variables and have to be edited by hand if the palette changes
again:

- the hero's `CYAN` / `AMBER` constants, which are brand accents rather than theme colours;
- the scrims layered over the video (`rgba(9,9,7, …)` and friends) — they are the darkening applied
  *on top of* the footage, so no host theme can reach them.

The minimal theme's backdrop is a drifting cyan grid with CRT scanlines. Both grids animate
`background-position` by exactly one cell, so the tiling stays seamless rather than sliding off and
snapping back.

---

## The hero's scroll-scrub

The hero section is made taller than the viewport and its contents `position: sticky` to the top.
Scrolling through that extra height produces one progress value from 0 to 1, and that single value
drives both the video playhead and the project deck. Past 1, the section stops sticking and the page
continues normally — there is no scroll trap.

The runway is `projects - 1` times `scrubPerProject`, with a 1400px floor. Without the floor a short list
would scrub the whole video away in less than one screen of scrolling — three projects at the default 340
is 680px, and the hero would be gone before a visitor noticed it was interactive.

Pinning is done with `position: sticky` rather than GSAP ScrollTrigger, for two reasons: the hero
component stays free of GSAP so it can still be dropped into a project that has none, and there is
never a second library that also wants to own the scroll position.

One consequence worth knowing: `overflow: hidden` on any ancestor between the sticky element and the
scroll root silently kills stickiness. That is why the hero's clipping lives on the sticky child
itself and not on the section around it.

### Why the hero is a flex column

The title band, a spacer and the deck are flex items sharing one column, and the
video sits behind them absolutely. They used to be positioned from opposite edges
— title from the top, deck from the bottom at a fixed 62% — with nothing relating
the two, so as soon as their natural heights exceeded the viewport they grew into
each other. That was not an edge case: at 942x658 they overlapped by 69px, and
even at 1900x1000 by 27px.

Flex makes the collision impossible by construction. When the window is genuinely
too short, things give way in a deliberate order: the spacer collapses first, then
the list shrinks (its rows fade at the edges anyway), and the headline is capped
against viewport height as well as width (`min(clamp(40px, 6.4vw, 92px), 11vh)`) so
three lines of Bebas can never eat the whole screen. The control bar and the title
never shrink.

Header clearance is reserved as `padding-top` rather than a `top` offset, so the
fixed 64px site header and the eyebrow cannot end up on one row — on the title band
in the full-bleed modes, and on the container itself in card view, whose content is
in normal flow.

Card view centres its column with `margin: auto 0` and **not** `justify-content:
center`. A flex container centring an item taller than itself overflows in *both*
directions, which is precisely how the headline ended up sliding underneath the
header. Auto margins centre when there is room and collapse to zero when there is
not, so the content can never overflow upward.

Scrub is desktop-only. Compact widths and `prefers-reduced-motion` fall back to the original
behaviour — the video loops on its own through the crossfade pair, and the deck is driven by wheel
and drag inside its own zone. Pinning a phone for two viewport-heights is hostile, and scrubbing is
motion bound to input, which is the thing reduced motion is asking to be spared.

---

## Motion

| Effect | How |
|---|---|
| Smooth scroll | Lenis, driven by the GSAP ticker so ScrollTrigger shares its clock |
| In-page links | Intercepted and handed to `lenis.scrollTo` — a native jump would desync Lenis |
| Text reveal | GSAP `SplitText` (`mask: "lines"`), split only after `document.fonts.ready` so line breaks are measured against the real face |
| Project ribbon | A pinned ScrollTrigger translating the track horizontally, with `invalidateOnRefresh` so a resize re-measures |

Every one of these degrades to something usable: the reveal never hides text from CSS, the ribbon is a plain
`overflow-x: auto` strip until GSAP actually pins it, and `prefers-reduced-motion` skips Lenis, the reveals and the
pinning altogether.

## Stack

Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 · GSAP · Lenis · lucide-react · clsx · tailwind-merge
