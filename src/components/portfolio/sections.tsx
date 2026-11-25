"use client";

import {
  ArrowUpRight,
  Award,
  Copy,
  Check,
  Flame,
  Flag,
  Mail,
  Newspaper,
  Play,
  Quote,
  TrendingUp,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { contactTarget, embedSrc, fmtCompact, fmtInsight } from "@/lib/format";
import type { Section, SectionOf, FeaturedItem } from "@/lib/types";
import { PLATFORM_COLOR, PLATFORM_LABEL, PlatformIcon } from "../platform-icon";
import { useLayout } from "./layout-context";
import { Tile } from "./tile";

/* ───────── registry: add a section type = add one entry ───────── */

export function SectionTiles({ section, all }: { section: Section; all: Section[] }) {
  switch (section.type) {
    case "socials":
      return <Socials s={section} />;
    case "insights":
      return <Insights s={section} featured={all.find((x) => x.type === "featured") as SectionOf<"featured"> | undefined} />;
    case "audience":
      return <Audience s={section} />;
    case "brands":
      return <Brands s={section} />;
    case "testimonials":
      return <Testimonials s={section} />;
    case "moments":
      return <Moments s={section} />;
    case "featured":
      return <Featured s={section} />;
    case "links":
      return <Links s={section} />;
    case "timeline":
      return <Timeline s={section} />;
    case "contact":
      return <Contact s={section} />;
  }
}

/* ───────── shared bits ───────── */

function Chip({ children, tone = "soft" }: { children: ReactNode; tone?: "soft" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-none font-medium whitespace-nowrap ${
        tone === "accent" ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink"
      }`}
    >
      {children}
    </span>
  );
}

const Num = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`font-display tabular-nums tracking-tight ${className}`}>{children}</span>
);

/* ───────── socials ───────── */

function Socials({ s }: { s: SectionOf<"socials"> }) {
  const { layout } = useLayout();
  return (
    <>
      {s.items.map((it, i) =>
        layout === "bento" ? (
          <Tile key={i} index={i} size="s" href={it.url} className="flex flex-col justify-between p-4" label={`${PLATFORM_LABEL[it.platform]} ${it.handle}`}>
            <span
              className="grid size-10 place-items-center rounded-xl text-white"
              style={{ background: PLATFORM_COLOR[it.platform], color: it.platform === "snapchat" ? "#000" : "#fff" }}
            >
              <PlatformIcon platform={it.platform} size={20} />
            </span>
            <ArrowUpRight className="absolute top-4 right-4 size-4 text-muted" />
            <div>
              <Num className="block text-2xl">{fmtCompact(it.followers)}</Num>
              <span className="block truncate text-sm text-muted">{it.handle}</span>
            </div>
          </Tile>
        ) : (
          <Tile key={i} index={i} size="s" href={it.url} className="flex items-center gap-3 p-3" label={`${PLATFORM_LABEL[it.platform]} ${it.handle}`}>
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg"
              style={{ background: PLATFORM_COLOR[it.platform], color: it.platform === "snapchat" ? "#000" : "#fff" }}
            >
              <PlatformIcon platform={it.platform} size={17} />
            </span>
            <span className="min-w-0">
              <Num className="block text-lg leading-tight">{fmtCompact(it.followers)}</Num>
              <span className="block truncate text-xs text-muted">{PLATFORM_LABEL[it.platform]}</span>
            </span>
          </Tile>
        ),
      )}
    </>
  );
}

/* ───────── insights ───────── */

function Insights({ s, featured }: { s: SectionOf<"insights">; featured?: SectionOf<"featured"> }) {
  const top = featured?.items.reduce<FeaturedItem | undefined>((a, b) => (!a || b.views > a.views ? b : a), undefined);
  return (
    <>
      {top && <TopPost top={top} />}
      {s.items.map((it, i) => (
        <Tile key={i} index={i + 1} size="s" className="flex flex-col justify-between gap-3 p-4">
          <span className="p-label">{it.label}</span>
          {/* own size container: the number scales to the tile, so "860.1k" never clips */}
          <div className="@container">
            <Num className="block text-[clamp(1.25rem,27cqw,2.5rem)] leading-none whitespace-nowrap">{fmtInsight(it)}</Num>
            {it.note && <span className="mt-1.5 block text-xs text-muted">{it.note}</span>}
          </div>
        </Tile>
      ))}
    </>
  );
}

/** Hero tile for the insights grid: the single best post, 2×2 so four stats sit beside it. */
function TopPost({ top }: { top: FeaturedItem }) {
  const { layout } = useLayout();
  return (
    <Tile
      size={{ bento: "l", list: "w", cards: "w" }}
      href={top.url}
      className={`text-white ${layout === "bento" ? "" : "aspect-[16/10]"}`}
      label="Top performing post"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={top.thumbnail} alt="" className="lift-img absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md">
        <TrendingUp className="size-3.5" /> Top performing post
      </span>
      <div className="absolute right-4 bottom-4 left-4">
        <Num className="block text-5xl leading-none">{fmtCompact(top.views)}</Num>
        <span className="mt-1 inline-flex items-center gap-1.5 text-xs opacity-80">
          <PlatformIcon platform={top.platform} size={12} /> views on {PLATFORM_LABEL[top.platform]}
        </span>
        <p className="mt-2 line-clamp-2 text-sm font-semibold">{top.caption}</p>
      </div>
    </Tile>
  );
}

/* ───────── audience ───────── */

function Audience({ s }: { s: SectionOf<"audience"> }) {
  const groups = ["Top locations", "Age", "Gender"] as const;
  let bar = 0;
  return (
    <Tile size="f" className="grid content-center gap-5 p-5 [[data-layout=bento]_&]:row-span-3 @2xl:grid-cols-3 @2xl:gap-8 [[data-layout=bento]_&]:@2xl:row-span-1">
      {groups.map((g) => {
        const rows = s.items.filter((x) => x.group === g);
        if (!rows.length) return null;
        if (g === "Gender") {
          return (
            <div key={g}>
              <span className="p-label">{g}</span>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
                {rows.map((r, i) => (
                  <span
                    key={i}
                    className="bar-fill h-full"
                    style={{ width: `${r.pct}%`, background: i === 0 ? "var(--p-accent)" : "color-mix(in oklab, var(--p-ink) 30%, transparent)", ["--i" as string]: bar++ }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted">
                {rows.map((r, i) => (
                  <span key={i} className="tabular-nums">
                    {r.label} {r.pct}%
                  </span>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={g}>
            <span className="p-label">{g}</span>
            <ul className="mt-2 flex flex-col gap-2">
              {rows.map((r, i) => (
                <li key={i} className="flex flex-col gap-1 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate">{r.label}</span>
                    <span className="text-xs text-muted tabular-nums">{r.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--p-ink)_10%,transparent)]">
                    {/* bars are scaled to the group's largest value so the leader fills the track */}
                    <div
                      className="bar-fill h-full rounded-full bg-accent"
                      style={{ width: `${(r.pct / Math.max(...rows.map((x) => x.pct))) * 100}%`, ["--i" as string]: bar++ }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </Tile>
  );
}

/* ───────── brands ───────── */

function BrandMark({ brand, color, logo, size = 44 }: { brand: string; color: string; logo: string; size?: number }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={brand} width={size} height={size} className="rounded-xl object-contain" />;
  }
  const initials = brand
    .split(/\s|&/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
      style={{ width: size, height: size, background: color }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function Brands({ s }: { s: SectionOf<"brands"> }) {
  return (
    <>
      {s.items.map((b, i) => {
        // split on ", " only, so "4,800 orders" stays one result
        const results = b.results.split(/,\s+/).map((x) => x.trim()).filter(Boolean);
        return (
          <Tile key={i} index={i} size={{ bento: "l", list: "w", cards: "w" }} className="brand-tile flex flex-col">
            <div
              className="brand-head relative flex min-h-24 flex-1 items-end justify-between gap-3 p-5"
              style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${b.color} 22%, var(--p-surface)), color-mix(in oklab, ${b.color} 6%, var(--p-surface)))` }}
            >
              <div className="flex items-center gap-3">
                <BrandMark brand={b.brand} color={b.color} logo={b.logo} size={52} />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{b.brand}</div>
                  <div className="text-xs text-muted">{b.deliverables}</div>
                </div>
              </div>
              <span className="p-label shrink-0 tabular-nums">{b.year}</span>
            </div>
            <div className="brand-body flex flex-col gap-3 p-5">
              <h3 className="font-display text-xl leading-snug text-balance @2xl:text-2xl">{b.campaign}</h3>
              <div className="flex flex-wrap gap-1.5">
                {results.map((r, j) => (
                  <Chip key={j} tone={j === 0 ? "accent" : "soft"}>
                    {r}
                  </Chip>
                ))}
              </div>
              {b.note && <p className="text-sm text-muted">{b.note}</p>}
            </div>
          </Tile>
        );
      })}
    </>
  );
}

/* ───────── testimonials ───────── */

function Testimonials({ s }: { s: SectionOf<"testimonials"> }) {
  return (
    <>
      {s.items.map((t, i) => (
        <Tile key={i} index={i} size="w" className="flex flex-col justify-between gap-4 p-5">
          <Quote className="size-5 text-accent" style={{ color: "var(--p-accent)" }} />
          <p className="font-display text-lg leading-snug text-balance">{t.quote}</p>
          <p className="text-xs text-muted">
            <span className="font-semibold text-ink">{t.name}</span> · {t.role}, {t.brand}
          </p>
        </Tile>
      ))}
    </>
  );
}

/* ───────── moments ───────── */

const MOMENT_ICON = { award: Award, viral: Flame, press: Newspaper, milestone: Flag } as const;
const MOMENT_LABEL = { award: "Award", viral: "Viral", press: "Press", milestone: "Milestone" } as const;

function Moments({ s }: { s: SectionOf<"moments"> }) {
  const { layout } = useLayout();
  return (
    <>
      {s.items.map((m, i) => {
        const Icon = MOMENT_ICON[m.kind];
        // bento rows are a fixed height: lay the moment out sideways in a wide tile so it never clips
        if (layout === "bento")
          return (
            <Tile key={i} index={i} size="w" href={m.url || undefined} className="flex items-center gap-4 p-4 @2xl:p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="p-label">{MOMENT_LABEL[m.kind]}</span>
                  <span className="p-label tabular-nums">{m.date}</span>
                </div>
                <p className="mt-1 line-clamp-2 leading-snug font-semibold text-balance">{m.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{m.detail}</p>
              </div>
            </Tile>
          );
        return (
          <Tile key={i} index={i} size="s" href={m.url || undefined} className="flex flex-col justify-between gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-full bg-surface-2">
                <Icon className="size-4" />
              </span>
              <span className="p-label tabular-nums">{m.date}</span>
            </div>
            <div className="min-w-0">
              <span className="p-label">{MOMENT_LABEL[m.kind]}</span>
              <p className="mt-0.5 leading-snug font-semibold text-balance">{m.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{m.detail}</p>
            </div>
          </Tile>
        );
      })}
    </>
  );
}

/* ───────── featured ───────── */

function FeaturedTile({ item, index }: { item: FeaturedItem; index: number }) {
  const { layout } = useLayout();
  const [playing, setPlaying] = useState(false);
  const src = embedSrc(item.platform, item.url);
  const inner = playing && src ? (
    <iframe
      src={src}
      title={item.caption}
      className="absolute inset-0 size-full border-0"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      loading="lazy"
    />
  ) : (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.thumbnail} alt="" className="lift-img absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
        <PlatformIcon platform={item.platform} size={12} />
        {fmtCompact(item.views)} views
      </span>
      <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg">
        <Play className="size-5 translate-x-px fill-current" />
      </span>
      <p className="absolute right-3 bottom-3 left-3 line-clamp-2 text-sm leading-snug font-semibold text-white">{item.caption}</p>
    </>
  );
  // YouTube is 16:9: wide in bento, video-shaped elsewhere. Reels/TikToks stay tall.
  const wide = item.platform === "youtube";
  return (
    <Tile
      size={wide ? { bento: "w", split: "s", editorial: "s", list: "s", cards: "s" } : "t"}
      index={index}
      className={`bg-black text-white ${layout === "bento" ? "" : wide ? "aspect-video" : "aspect-[9/16]"}`}
      onClick={src && !playing ? () => setPlaying(true) : undefined}
      href={!src ? item.url : undefined}
      label={`Play: ${item.caption}`}
    >
      {inner}
    </Tile>
  );
}

function Featured({ s }: { s: SectionOf<"featured"> }) {
  return (
    <>
      {s.items.map((it, i) => (
        <FeaturedTile key={i} index={i} item={it} />
      ))}
    </>
  );
}

/* ───────── links ───────── */

function Links({ s }: { s: SectionOf<"links"> }) {
  const { layout } = useLayout();
  // bento: square cards, or double-width cards when any label is long, so no word breaks mid-way
  const wide = s.items.some((l) => l.label.length > 16);
  return (
    <>
      {s.items.map((l, i) =>
        layout === "bento" ? (
          <Tile key={i} index={i} size={wide ? "w" : "s"} href={l.url} className="flex flex-col justify-between p-4 @2xl:p-5">
            <span className="text-3xl leading-none">{l.emoji}</span>
            <ArrowUpRight className="absolute top-4 right-4 size-4 text-muted" />
            <span className="leading-snug font-semibold text-balance">{l.label}</span>
          </Tile>
        ) : (
          <Tile key={i} index={i} size="w" href={l.url} className="flex min-h-14 items-center gap-3 px-4 py-3 [[data-layout=bento]_&]:px-5">
            <span className="text-xl">{l.emoji}</span>
            <span className="min-w-0 flex-1 font-semibold">{l.label}</span>
            <ArrowUpRight className="size-4 text-muted" />
          </Tile>
        ),
      )}
    </>
  );
}

/* ───────── timeline ───────── */

function Timeline({ s }: { s: SectionOf<"timeline"> }) {
  const years = [...new Set(s.items.map((x) => x.year))];
  return (
    <Tile size="f" rows={Math.max(1, Math.ceil(s.items.length / 2))} className="p-5">
      <ol className="grid gap-5 @2xl:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {years.map((y) => (
          <li key={y}>
            <Num className="text-2xl">{y}</Num>
            <ul className="mt-2 flex flex-col gap-2 border-l border-line pl-3">
              {s.items
                .filter((x) => x.year === y)
                .map((x, i) => (
                  <li key={i}>
                    <p className="text-sm font-semibold">{x.title}</p>
                    <p className="text-xs text-muted">{x.detail}</p>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ol>
    </Tile>
  );
}

/* ───────── contact ───────── */

function Contact({ s }: { s: SectionOf<"contact"> }) {
  const c = s.items[0];
  const [copied, setCopied] = useState(false);
  if (!c) return null;
  const t = contactTarget(c);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(c.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — email stays visible & selectable */
    }
  };
  return (
    <Tile size="w" className="flex flex-col justify-between gap-4 bg-accent p-5" style={{ background: "var(--p-accent)", color: "var(--p-accent-ink)" }}>
      <div>
        <p className="font-display text-2xl leading-tight">{s.title}</p>
        <p className="mt-1 text-sm opacity-80">{c.note}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={t.href}
          {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
          className="ui-press inline-flex items-center gap-2 rounded-full bg-[var(--p-accent-ink)] px-4 py-2 text-sm font-semibold text-[var(--p-accent)]"
        >
          <Mail className="size-4" /> {t.label}
        </a>
        {c.email && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy email"
            className="ui-press grid size-9 place-items-center rounded-full border border-current/25"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        )}
        <span className="text-xs opacity-75">{c.responseTime}</span>
      </div>
    </Tile>
  );
}
