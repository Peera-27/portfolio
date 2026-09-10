"use client"

import { useRef, useState } from "react"
import { ArrowUpRight, Code2, Mail, MessageCircle } from "lucide-react"
import { Section } from "./section"
import { profile, socials } from "@/lib/site"

const FIELDS = [
  { key: "name", label: "name", type: "text", autoComplete: "name", placeholder: "your name" },
  { key: "email", label: "email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
] as const

/**
 * A terminal-styled contact form built on real form controls.
 *
 * The field-by-field ENTER flow is enhancement layered on top: every row is a
 * genuine <label> + <input>, the whole thing is a <form>, and submitting opens a
 * prefilled mail draft. So it still works with a screen reader, with autofill,
 * and with the keyboard alone.
 *
 * The form only renders when `profile.email` is set. With no address there is
 * nothing for a `mailto:` to point at, and shipping a send button that silently
 * does nothing is worse than not shipping one — so the social links carry the
 * whole section until an address exists.
 */
function MailForm({ email }: { email: string }) {
  const [values, setValues] = useState({ name: "", email: "", message: "" })
  const [step, setStep] = useState(0)
  const refs = useRef<(HTMLInputElement | HTMLTextAreaElement | null)[]>([])

  const advance = (i: number) => {
    setStep((s) => Math.max(s, i + 1))
    refs.current[i + 1]?.focus()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Portfolio enquiry — ${values.name || "no name"}`)
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name}\n${values.email}`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
      <p className="mono-label text-muted-foreground">
        <span className="text-primary">~/contact</span> $ new message
      </p>

      <div className="mt-6 space-y-4">
        {FIELDS.map((f, i) => (
          <label key={f.key} className="flex items-baseline gap-3">
            <span className="mono-label w-20 flex-shrink-0 text-muted-foreground">{f.label}</span>
            <span aria-hidden className="mono-label text-primary">
              ›
            </span>
            <input
              ref={(el) => {
                refs.current[i] = el
              }}
              type={f.type}
              name={f.key}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  advance(i)
                }
              }}
              className="min-w-0 flex-1 border-b border-white/10 bg-transparent pb-1 font-mono text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary"
            />
          </label>
        ))}

        <label className="flex items-baseline gap-3">
          <span className="mono-label w-20 flex-shrink-0 text-muted-foreground">message</span>
          <span aria-hidden className="mono-label text-primary">
            ›
          </span>
          <textarea
            ref={(el) => {
              refs.current[2] = el
            }}
            name="message"
            rows={5}
            placeholder="what are you building?"
            value={values.message}
            onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
            className="min-w-0 flex-1 resize-none border-b border-white/10 bg-transparent pb-1 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary"
          />
        </label>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="mono-label text-muted-foreground" aria-hidden>
          {step >= 2 ? "ready" : `${step + 1} / 3`}
          <span className="caret ml-2 text-primary" />
        </p>
        <button
          type="submit"
          className="mono-label rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          send ↵
        </button>
      </div>
      <p className="mono-label mt-3 normal-case tracking-normal text-muted-foreground/60">
        Opens a prefilled draft in your mail app — nothing is sent from this page.
      </p>
    </form>
  )
}

const socialIcons: Record<string, typeof Code2> = {
  GitHub: Code2,
  Instagram: ArrowUpRight,
  Facebook: ArrowUpRight,
  Discord: MessageCircle,
}

export function Contact() {
  const hasEmail = profile.email.length > 0

  return (
    <Section
      id="contact"
      eyebrow="contact"
      index="04"
      title="Got something you want built?"
      lead={
        hasEmail
          ? "I'm open to internships and freelance work — send over the details and let's talk."
          : "I'm open to internships and freelance work. The fastest way to reach me is any of these."
      }
    >
      <div className={hasEmail ? "grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:gap-8" : "grid gap-5"}>
        {hasEmail && <MailForm email={profile.email} />}

        <div
          className={
            hasEmail
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
              : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          }
        >
          {hasEmail && (
            <a
              href={`mailto:${profile.email}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-primary">
                  <Mail size={18} />
                </span>
                <span className="min-w-0">
                  <span className="mono-label block text-foreground">Email</span>
                  <span className="mt-1 block truncate font-mono text-[13px] text-muted-foreground">
                    {profile.email}
                  </span>
                </span>
              </span>
              <ArrowUpRight
                size={18}
                className="flex-shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </a>
          )}

          {socials.map(({ label, href, handle }) => {
            const Icon = socialIcons[label] ?? ArrowUpRight
            return (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-primary">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="mono-label block text-foreground">{label}</span>
                    <span className="mt-1 block truncate font-mono text-[13px] text-muted-foreground">
                      {handle}
                    </span>
                  </span>
                </span>
                <ArrowUpRight
                  size={18}
                  className="flex-shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </a>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
