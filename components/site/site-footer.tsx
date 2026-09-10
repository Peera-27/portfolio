import { profile } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 sm:flex-row sm:items-center">
        <p className="mono-label text-muted-foreground">
          © {new Date().getFullYear()} {profile.nameEn}
          <span aria-hidden className="mx-2 opacity-40">
            ·
          </span>
          {profile.location}
        </p>
        <p className="mono-label tabular-nums text-muted-foreground">
          {profile.coordinates}
        </p>
        <p className="mono-label normal-case tracking-normal text-muted-foreground">
          Built with Next.js · TypeScript · Tailwind · GSAP · Lenis
        </p>
      </div>
    </footer>
  )
}
