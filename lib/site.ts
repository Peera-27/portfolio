import type { Project } from "@/components/ui/scroll-locked-video-hero"

/**
 * ─────────────────────────────────────────────────────────────
 * The single file to edit when the site's content changes
 * ─────────────────────────────────────────────────────────────
 * Kept in sync with https://github.com/Peera-27/Port — `app/config.ts` there is
 * the source of truth for the profile and the skills. The per-project copy is
 * written here, because neither GitHub descriptions nor that config carry any.
 */

export const media = {
  /**
   * The hero's scrub track. Its playhead is driven by scroll position, which
   * only stays smooth because it was encoded with a keyframe every 4 frames —
   * a normal one-keyframe clip has to decode from frame 0 on every seek.
   * Ship .mp4 h264 + yuv420p so every browser can play it.
   */
  heroVideo: "/media/hero-scrub.mp4",
  /** first frame, so the hero is never a black rectangle while loading */
  heroPoster: "/media/hero-poster.jpg",
  /** immersive image behind the hero card (desktop card view only) */
  heroBackdrop: "/media/hero-backdrop.jpg",
  /** portrait shown beside the About copy */
  profile: "/media/profile.jpg",
}

export const profile = {
  name: "Peeraphat Chompoosi",
  nameEn: "Peeraphat Chompoosi",
  nickname: "Pee",
  role: "Full-stack Developer",
  headline: "Computer Science student, Faculty of Information Technology.",
  heroTitle: "From schema to the last pixel",
  /** Carried over from the Port config. Nothing renders these two today. */
  status: "Open to internships",
  education: "CS · Year 3 — Faculty of IT",
  location: "Bangkok, TH",
  coordinates: "13.7563° N · 100.5018° E",
  /**
   * TODO(you): put your email address here.
   *
   * Left blank on purpose, matching `app/config.ts` in the Port repo. While it
   * is empty the contact section drops the mail form and the email card and
   * lets the social links carry the section, and the header hides its mail
   * icon — nothing points at an empty `mailto:`. Fill this in and all three
   * come back on their own.
   */
  email: "peeraphat.chompoo@gmail.com",
  github: "https://github.com/Peera-27",
  githubHandle: "Peera-27",
}

export const socials = [
  { label: "GitHub", href: "https://github.com/Peera-27", handle: "Peera-27" },
  { label: "Instagram", href: "https://www.instagram.com/_peezx/", handle: "_peezx" },
  {
    label: "Facebook",
    href: "https://www.facebook.com/peerphat.chompoosi.5/",
    handle: "peerphat.chompoosi",
  },
  { label: "Discord", href: "https://discord.com/users/857976414183227492", handle: "Discord" },
]

/** Verbatim from `app/config.ts` in the Port repo. */
export const about = [
  "I'm a full-stack developer in the making. I like building things end to end — from the database schema up to the last pixel — and I care about the parts users never see as much as the ones they do.",
  "Right now I work mostly with TypeScript, React and Next.js on the front, Go and Node on the back. I'm always looking for the next thing to break and rebuild properly.",
]

/**
 * Feeds both the hero deck and the cards in the Projects section. The copy is
 * drawn from each repository's README and source, since GitHub carries no
 * descriptions.
 *
 * ─────────────────────────────────────────────────────────────
 * TODO(you): the `demo` links
 * ─────────────────────────────────────────────────────────────
 * `demo` is where a live deployment goes. Each card shows a "live" button only
 * when its `demo` is a non-empty string, so an unfilled slot simply leaves the
 * button off rather than shipping a link to nowhere. Paste the URL in and the
 * button appears — no other file needs touching.
 *
 * `href` is the repository, and all three are already correct.
 */
export const projects: Project[] = [
  {
    id: "dreamviz",
    title: "DreamViz AI",
    subtitle: "A dream journal that reads the mood",
    year: "2026",
    kind: "Web / AI",
    stack: ["Next.js 16", "React 19", "Tailwind 4", "Web Speech API"],
    description:
      "Tell it a dream by typing or speaking, and it offers a psychological reading, scores a stress level from 1 to 10, and keeps a back-catalogue so emotional trends become visible over time.",
    highlights: [
      "Voice input through the Web Speech API, Thai included, so a dream can be recorded before it fades",
      "Entries live in localStorage — no account, and nothing about a dream leaves the device",
      "Framed as an educational self-check throughout, never as a diagnosis",
    ],
    href: "https://github.com/Peera-27/dreamviz",
    demo: "", // TODO(you): live URL
    colorA: "#8fa8ff",
    colorB: "#2c1a5c",
  },
  {
    id: "tinnerapp",
    title: "TinnerApp",
    subtitle: "A dating app, written end to end",
    year: "2026",
    kind: "Full-stack",
    stack: ["Angular", "Elysia", "Bun", "Drizzle ORM", "PostgreSQL", "Cloudinary"],
    description:
      "A Tinder-style dating app with both halves hand-written: an Angular client for swiping, matching and messaging, and a Bun + Elysia API behind it carrying JWT auth, image uploads, presence, notifications and reporting.",
    highlights: [
      "Swipe, matches, messaging, followers and blocking — each backed by its own service on the API rather than one catch-all controller",
      "Moved the data layer off MongoDB onto PostgreSQL with Drizzle, and kept the migration script in the repo instead of doing it by hand",
      "Rate limiting, JWT interceptors, Swagger docs, and a Docker plus Render deployment setup",
    ],
    href: "https://github.com/Peera-27/TinnerApp",
    demo: "https://tinnerapp.onrender.com/", // TODO(you): live URL
    colorA: "#ff7a9c",
    colorB: "#5c1830",
  },
  {
    id: "albion-api",
    title: "Albion Online Database",
    subtitle: "Market data and price analytics",
    year: "2026",
    kind: "Full-stack",
    status: "collab",
    stack: ["Next.js", "Elysia", "Bun", "MongoDB", "OAuth", "Docker"],
    description:
      "A market tool for Albion Online: item prices, historical trends and gold tracking, with search, filtering and charts on top. Built with Bannawat01 — 26 of the repository's commits are mine, second only to its author.",
    highlights: [
      "The API is layered controller to service to repository, with the pricing rules kept in their own advisory service rather than smeared through the route handlers",
      "Connection pooling, pagination and a performance monitor on the server side, because market data is read far more often than it changes",
      "OAuth login, protected routes, and an in-app chatbot for asking about items in words instead of filters",
    ],
    href: "https://github.com/Bannawat01/albion-api",
    demo: "https://albion-api-seven.vercel.app",
    colorA: "#ffc46b",
    colorB: "#7a5410",
  },
  {
    id: "chef-kub",
    title: "Chef Kub",
    subtitle: "Scan your ingredients, get a recipe",
    year: "2026",
    kind: "Computer Vision",
    stack: ["Next.js", "YOLO11n", "TensorFlow.js", "Gemini", "Cloudflare D1", "R2"],
    description:
      "A final-year project that photographs what you have, works out the ingredients, and walks you through a recipe step by step. It also remembers labels you corrected, so the same photo — or a similar one — loads them again without re-scanning.",
    highlights: [
      "YOLO guesses, Gemini decides: YOLO11n runs in the browser for fast bounding boxes, then Gemini looks at the real photo and rules on which boxes are right",
      "That split covers both weaknesses — YOLO knows only ~122 classes and can be confidently wrong, while Gemini understands the image but returns no coordinates",
      "Corrections are stored in D1 and R2 as a dataset for the next YOLO training round, so the model needs Gemini less over time",
    ],
    href: "https://github.com/Peera-27/chef_kub",
    // Taken from the repository's own homepage field. Replace if it moves.
    demo: "https://chef-kub.crbrsonline.workers.dev/",
    colorA: "#5cd0ff",
    colorB: "#0e3a56",
  },
  {
    id: "buffa",
    title: "Buffa",
    subtitle: "An Umamusume-style raising sim",
    year: "2026",
    kind: "Game",
    status: "in development",
    stack: ["Godot", "GDScript", "QTE System"],
    description:
      "An indie game still being built — a quick-time-event system, a character training loop, and team planning, aimed at a Steam release.",
    highlights: [
      "Designed the QTE system for tight timing windows and tunable difficulty",
      "Set up the project structure and asset pipeline for a multi-person team",
    ],
    // No `href` on purpose: github.com/buffa-dev/buffa-game is private, and a
    // link that 404s for every visitor is worse than no link at all. Every place
    // a project link is rendered already checks for `href` first, so the card
    // and the deck simply omit the button. Add the URL once the repo is public.
    colorA: "#5ce0a0",
    colorB: "#0e4a30",
  },
]

/** Verbatim from `app/config.ts` in the Port repo. */
export const skillGroups = [
  { title: "Languages", items: ["TypeScript", "JavaScript", "Go"] },
  { title: "Frontend", items: ["Next.js", "React", "Tailwind CSS"] },
  { title: "Backend", items: ["Node.js", "Bun"] },
  { title: "Data", items: ["MySQL", "MongoDB", "Supabase"] },
  { title: "Tools", items: ["Git", "Postman", "Figma", "Gemini"] },
]
