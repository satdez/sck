"use client";

import { ArrowUpRight, BadgeCheck, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { contactTarget, fmtCompact, fmtInsight, sum } from "@/lib/format";
import type { Portfolio, Section, SectionOf } from "@/lib/types";
import { PLATFORM_LABEL, PlatformIcon } from "../platform-icon";
import { LayoutContext } from "./layout-context";
import { Actions, Availability, Avatar, Banner } from "./profile";
import { SectionTiles } from "./sections";

const pad = (n: number) => String(n).padStart(2, "0");

/** "01 — Brand collaborations" over a hairline. */
function Head({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-baseline gap-4 border-t pt-3" style={{ borderColor: "color-mix(in oklab, var(--p-ink) 70%, transparent)" }}>
      <span className="p-label tabular-nums">{pad(n)}</span>
      <h2 className="font-display text-[clamp(1.6rem,4cqw,2.4rem)] leading-none tracking-tight">{title}</h2>
    </div>
  );
}

function Stats({ s, reach }: { s?: SectionOf<"insights">; reach: number }) {
  const cells: { label: string; value: string; note?: string }[] = [];
  if (reach) cells.push({ label: "Total reach", value: fmtCompact(reach), note: "followers" });
  for (const it of s?.items ?? []) {
    if (cells.length >= 4) break;
    if (it.label.toLowerCase().includes("total followers") && reach) continue;
    cells.push({ label: it.label, value: fmtInsight(it), note: it.note });
  }
  if (!cells.length) return null;
  return (
    <dl className="grid grid-cols-2 @3xl:grid-cols-4">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className={`enter flex flex-col gap-2 border-line py-5 @3xl:px-5 @3xl:first:pl-0 ${i % 2 ? "border-l pl-4" : "pr-4"} @3xl:border-l @3xl:first:border-l-0`}
          style={{ ["--i" as string]: 2 + i }}
        >
          <dt className="p-label">{c.label}</dt>
          <dd className="font-display text-[clamp(2.4rem,7cqw,4.25rem)] leading-[0.9] tracking-[-0.03em] tabular-nums">{c.value}</dd>
          {c.note && <dd className="text-xs text-muted">{c.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

function BrandRows({ s }: { s: SectionOf<"brands"> }) {
  return (
    <ol className="flex flex-col">
      {s.items.map((b, i) => {
        const results = b.results.split(/,\s+/).filter(Boolean);
        return (
          <li
            key={i}
            className="enter grid gap-3 border-b border-line py-6 @3xl:grid-cols-[72px_minmax(0,1fr)_minmax(0,1.6fr)_minmax(140px,auto)] @3xl:gap-8"
            style={{ ["--i" as string]: 6 + i }}
          >
            <span className="p-label tabular-nums @3xl:pt-1.5">{b.year}</span>
            <div className="flex items-center gap-3 @3xl:items-start">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-[calc(var(--p-radius)*0.6)] text-xs font-bold text-white"
                style={{ background: b.color }}
              >
                {b.brand
                  .split(/\s|&/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{b.brand}</p>
                <p className="text-xs text-muted">{b.deliverables}</p>
              </div>
            </div>
            <div>
              <p className="font-display text-[clamp(1.4rem,3.2cqw,2rem)] leading-tight tracking-tight text-balance">{b.campaign}</p>
              {b.note && <p className="mt-1.5 text-sm text-muted">{b.note}</p>}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 @3xl:flex-col @3xl:items-end @3xl:text-right">
              {results.map((r, j) => (
                <li key={j} className={`text-sm tabular-nums ${j === 0 ? "font-semibold" : "text-muted"}`}>
                  {r}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function PullQuotes({ s }: { s: SectionOf<"testimonials"> }) {
  return (
    <div className="grid gap-10 @3xl:grid-cols-2">
      {s.items.map((t, i) => (
        <figure key={i} className="enter flex flex-col gap-4" style={{ ["--i" as string]: 8 + i }}>
          <blockquote className="font-display text-[clamp(1.5rem,3.4cqw,2.25rem)] leading-[1.15] tracking-tight text-balance [text-indent:-0.42em]">
            <span className="text-[var(--p-accent)]">“</span>
            {t.quote}
            <span className="text-[var(--p-accent)]">”</span>
          </blockquote>
          <figcaption className="text-sm text-muted">
            <span className="font-semibold text-ink">{t.name}</span> · {t.role}, {t.brand}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function IndexList({ s }: { s: SectionOf<"socials"> }) {
  return (
    <ul className="grid @3xl:grid-cols-2 @3xl:gap-x-10">
      {s.items.map((it, i) => (
        <li key={i}>
          <a href={it.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border-b border-line py-4">
            <PlatformIcon platform={it.platform} size={18} />
            <span className="flex-1 text-lg font-medium">{PLATFORM_LABEL[it.platform]}</span>
            <span className="font-display text-2xl tabular-nums">{fmtCompact(it.followers)}</span>
            <ArrowUpRight className="size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function Closing({ s }: { s: SectionOf<"contact"> }) {
  const c = s.items[0];
  if (!c) return null;
  const t = contactTarget(c);
  return (
    <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
      <p className="max-w-[16ch] font-display text-[clamp(2.4rem,8cqw,5.5rem)] leading-[0.92] tracking-[-0.035em]">{s.title}.</p>
      <div className="flex flex-col gap-3 @3xl:items-end">
        <p className="max-w-[40ch] text-[15px] text-muted @3xl:text-right">{c.note}</p>
        <a href={t.href} {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : null)} className="p-btn h-12 px-6 text-[15px]">
          <Mail className="size-4" /> {t.label}
        </a>
        <p className="text-xs text-muted">{c.responseTime}</p>
      </div>
    </div>
  );
}

/**
 * Editorial: a magazine spread. Masthead, full-bleed cover, the name set huge,
 * a stats strip in big numerals, then numbered sections with type-led treatments.
 */
export function EditorialLayout({ portfolio }: { portfolio: Portfolio }) {
  const p = portfolio.profile;
  const visible = portfolio.sections.filter((s) => s.visible && s.items.length > 0);
  const socials = visible.find((s) => s.type === "socials") as SectionOf<"socials"> | undefined;
  const insights = visible.find((s) => s.type === "insights") as SectionOf<"insights"> | undefined;
  const reach = socials ? sum(socials.items.map((x) => x.followers)) : 0;
  const body = visible.filter((s) => s.type !== "insights");

  const render = (s: Section, i: number): ReactNode => {
    switch (s.type) {
      case "brands":
        return <BrandRows s={s} />;
      case "testimonials":
        return <PullQuotes s={s} />;
      case "socials":
        return <IndexList s={s} />;
      case "contact":
        return <Closing s={s} />;
      default:
        return (
          <LayoutContext.Provider value={{ layout: "editorial", base: 6 + i * 2 }}>
            <div
              className={`grid grid-cols-2 gap-3 ${s.type === "featured" ? "@3xl:grid-cols-[repeat(var(--n),minmax(0,1fr))]" : ""}`}
              style={{
                ["--n" as string]:
                  s.type === "featured" && s.items.every((x) => (x as { platform: string }).platform === "youtube")
                    ? 3
                    : Math.min(4, Math.max(2, s.items.length)),
              }}
            >
              <SectionTiles section={s} all={portfolio.sections} />
            </div>
          </LayoutContext.Provider>
        );
    }
  };

  return (
    <div className="mx-auto flex max-w-[1160px] flex-col gap-14 px-4 py-6 @3xl:gap-20 @3xl:px-10 @3xl:py-10">
      <header className="flex flex-col gap-6">
        {/* masthead */}
        <div className="enter flex items-center justify-between border-b border-line pb-3" style={{ ["--i" as string]: 0 }}>
          <span className="p-label flex items-center gap-1.5">
            {p.handle}
            {p.verified && <BadgeCheck className="size-3.5 text-[var(--p-accent)]" aria-label="Stats synced from platforms" />}
          </span>
          <span className="p-label hidden @xl:block">{p.tags.slice(0, 3).join(" · ")}</span>
          <span className="p-label">{p.location}</span>
        </div>

        <div className="enter tile aspect-[16/10] w-full @3xl:aspect-[21/8]" style={{ ["--i" as string]: 1 }}>
          <Banner p={p} className="absolute inset-0 size-full" />
        </div>

        <h1
          className="enter font-display text-[clamp(3.25rem,14cqw,10rem)] leading-[0.86] tracking-[-0.045em] text-balance"
          style={{ ["--i" as string]: 1 }}
        >
          {p.name}
        </h1>

        <div className="grid gap-6 @3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] @3xl:gap-12">
          <p className="font-display text-[clamp(1.35rem,3cqw,1.9rem)] leading-[1.25] tracking-tight text-pretty">{p.bio}</p>
          <div className="flex flex-col gap-4 @3xl:items-end">
            <div className="flex items-center gap-3">
              <Avatar src={p.avatar} name={p.name} className="size-12 ring-0" />
              <Availability on={p.available} />
            </div>
            <Actions slug={portfolio.slug} />
          </div>
        </div>

        <Stats s={insights} reach={reach} />
      </header>

      {body.map((s, i) => (
        <section key={s.id} id={s.type === "contact" ? "work-with-me" : s.id} className="flex scroll-mt-6 flex-col gap-6">
          <Head n={i + 1} title={s.title} />
          {render(s, i)}
        </section>
      ))}
    </div>
  );
}
