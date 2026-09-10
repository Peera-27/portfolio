import { Section } from "./section"
import { skillGroups } from "@/lib/site"

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="skills"
      index="03"
      title="What I work with"
      lead="The stack behind the projects above — grouped the same way I keep it in my own config."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
          >
            <h3 className="mono-label text-primary">{group.title}</h3>
            <ul className="mt-5 space-y-3">
              {group.items.map((item) => (
                <li key={item} className="flex items-center gap-3 font-mono text-[13px] text-muted-foreground">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
