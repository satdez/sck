"use client";

import { ArrowUpRight, BadgeCheck, Mail, MapPin, Share, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { fmtCompact, sum } from "@/lib/format";
import type { Portfolio, SectionOf } from "@/lib/types";
import { PLATFORM_COLOR, PLATFORM_LABEL, PlatformIcon } from "../platform-icon";
import { ShareSheet } from "../share-sheet";
import { LayoutContext } from "./layout-context";
import { Avatar, Banner } from "./profile";
import { SectionTiles } from "./sections";
import { ReachOut } from "../solo/reach-out";

/** Luma-style label with a hairline under it ("Hosted By", "About Event"). */
function Label({ children }: { children: ReactNode }) {
  return <h2 className="p-label border-b border-line pb-2.5">{children}</h2>;
}

/** The rounded icon square Luma uses beside the date and place rows. */
function InfoRow({ icon, title, sub }: { icon: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-[calc(var(--p-radius)*0.55)] bg-surface shadow-[inset_0_0_0_1px_var(--p-line)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[17px] leading-tight font-semibold">{title}</p>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
    </div>
  );
}

/**
 * Split: the creator on the left (cover, identity, socials), the pitch on the right
 * (name, reach, a booking card, then the work). Reverse-engineered from Luma event pages.
 */
export function SplitLayout({ portfolio }: { portfolio: Portfolio }) {
  const p = portfolio.profile;
  const visible = portfolio.sections.filter((s) => s.visible && s.items.length > 0);
  const socials = visible.find((s) => s.type === "socials") as SectionOf<"socials"> | undefined;
  const contact = visible.find((s) => s.type === "contact") as SectionOf<"contact"> | undefined;
  const main = visible.filter((s) => s.type !== "socials" && s.type !== "contact");
  const reach = socials ? sum(socials.items.map((x) => x.followers)) : 0;
  const c = contact?.items[0];

  return (
    // Phones: the two columns dissolve (display: contents) and each block takes an order, so the
    // name and the booking card come right after the cover instead of after the socials list.
    <div className="mx-auto grid max-w-[1080px] gap-7 px-4 py-6 @3xl:grid-cols-[minmax(280px,340px)_1fr] @3xl:gap-14 @3xl:px-8 @3xl:py-14">
      {/* ── left: the creator ── */}
      <aside className="contents @3xl:sticky @3xl:top-10 @3xl:flex @3xl:flex-col @3xl:gap-7 @3xl:self-start">
        <div className="enter tile order-1 aspect-[4/3] w-full shadow-[0_24px_60px_-30px_rgb(0_0_0/0.45)] @3xl:aspect-square" style={{ ["--i" as string]: 0 }}>
          <Banner p={p} className="absolute inset-0 size-full" />
        </div>

        <div className="order-3 flex items-center gap-3">
          <Avatar src={p.avatar} name={p.name} className="size-10 ring-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Creator</p>
            <p className="flex items-center gap-1 truncate font-semibold">
              {p.handle}
              {p.verified && <BadgeCheck className="size-4 shrink-0 text-[var(--p-accent)]" aria-label="Stats synced from platforms" />}
            </p>
          </div>
          <ShareSheet
            slug={portfolio.slug}
            trigger={
              <button type="button" className="p-btn p-btn--ghost h-9 gap-1.5 px-3.5 text-sm">
                <Share className="size-3.5" /> Share
              </button>
            }
          />
        </div>

        <p className="order-4 -mt-3 text-[15px] leading-relaxed text-pretty text-muted @3xl:-mt-2">{p.bio}</p>

        {socials && (
          <div className="order-6 flex flex-col gap-1">
            <Label>{socials.title}</Label>
            <ul className="flex flex-col">
              {socials.items.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 py-2.5">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-md"
                      style={{ background: PLATFORM_COLOR[s.platform], color: s.platform === "snapchat" ? "#000" : "#fff" }}
                    >
                      <PlatformIcon platform={s.platform} size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{PLATFORM_LABEL[s.platform]}</span>
                    <span className="font-display text-[15px] tabular-nums">{fmtCompact(s.followers)}</span>
                    <ArrowUpRight className="size-3.5 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.tags.length > 0 && (
          <div className="order-7 flex flex-col gap-3">
            <Label>Niches</Label>
            <div className="flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── right: the pitch, then the work ── */}
      <main className="contents @3xl:flex @3xl:min-w-0 @3xl:flex-col @3xl:gap-10">
        <header className="enter order-2 flex flex-col gap-5 @3xl:gap-6" style={{ ["--i" as string]: 1 }}>
          {p.available && (
            <span className="inline-flex w-fit items-center gap-2 rounded-[calc(var(--p-radius)*0.5)] bg-surface px-3 py-1.5 text-sm shadow-[inset_0_0_0_1px_var(--p-line)]">
              <span className="live-dot size-2 rounded-full bg-[#22c55e]" />
              <span className="text-muted">Open to collabs</span>
              {p.location && <span className="font-medium">{p.location.split(",")[0]}</span>}
            </span>
          )}
          <h1 className="font-display text-[clamp(2.5rem,7cqw,4rem)] leading-[1.02] font-semibold tracking-[-0.025em] text-balance">{p.name}</h1>
          <div className="flex flex-col gap-4">
            {reach > 0 && (
              <InfoRow
                icon={<TrendingUp className="size-5" strokeWidth={1.75} />}
                title={`${fmtCompact(reach)} followers`}
                sub={`Across ${socials?.items.length} platforms`}
              />
            )}
            {p.location && <InfoRow icon={<MapPin className="size-5" strokeWidth={1.75} />} title={p.location} sub={c?.responseTime} />}
          </div>
        </header>

        {/* booking card, Luma's registration box */}
        <section
          id="work-with-me"
          className="enter order-5 scroll-mt-6 overflow-hidden rounded-[var(--p-radius)] bg-surface shadow-[inset_0_0_0_1px_var(--p-line),0_20px_50px_-36px_rgb(0_0_0/0.4)]"
          style={{ ["--i" as string]: 2 }}
        >
          <p className="bg-surface-2 px-5 py-3 text-sm font-medium text-muted">{contact?.title ?? "Work with me"}</p>
          <div className="flex flex-col gap-4 p-5">
            <p className="text-[15px] leading-relaxed text-pretty">{c?.note ?? "Brand partnerships, launches and long-term collabs."}</p>
            <ReachOut
              name={p.name}
              trigger={
                <button type="button" className="p-btn h-12 w-full text-[15px]" style={{ borderRadius: "calc(var(--p-radius) * 0.6)" }}>
                  <Mail className="size-4" /> Reach out
                </button>
              }
            />
            {c?.email && <p className="text-center text-xs text-muted select-all">{c.email}</p>}
          </div>
        </section>

        {main.map((s, i) => (
          <section key={s.id} id={s.id} className="order-8 flex scroll-mt-6 flex-col gap-4">
            <Label>{s.title}</Label>
            <LayoutContext.Provider value={{ layout: "split", base: 3 + i * 2 }}>
              <div className="grid grid-cols-2 gap-3">
                <SectionTiles section={s} all={portfolio.sections} />
              </div>
            </LayoutContext.Provider>
          </section>
        ))}
      </main>
    </div>
  );
}

