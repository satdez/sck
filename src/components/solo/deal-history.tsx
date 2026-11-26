"use client";

import { BadgeCheck, Clock, Star } from "lucide-react";
import { agreedBrief, fmtDay } from "@/lib/solo/money";
import { useSolo } from "@/lib/solo/store";

/**
 * "Collabs on Solo" on the creator's sck.bio page (PRD proof loop): every paid deal
 * becomes a case study, plus the trust numbers brands look for. Uses the page theme.
 */
export function DealHistory({ slug, wide }: { slug: string; wide?: boolean }) {
  const s = useSolo((x) => x);
  if (slug !== s.creator.slug) return null;
  const done = s.threads.filter((t) => t.stage === "paid").sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));
  if (!done.length) return null;
  const rated = done.filter((t) => t.rating);
  const avg = rated.length ? rated.reduce((n, t) => n + (t.rating ?? 0), 0) / rated.length : 0;

  return (
    <section id="collabs" className={`mx-auto flex w-full scroll-mt-6 flex-col gap-3 px-4 pb-8 ${wide ? "max-w-[1080px] @3xl:px-8" : "max-w-[560px]"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
        <h2 className="font-display text-lg font-semibold tracking-tight">Collabs on Solo</h2>
        {s.creator.idVerified && (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-muted">
            <BadgeCheck className="size-4 text-[var(--p-accent)]" /> Verified creator
          </span>
        )}
      </div>

      {/* the numbers a brand checks before reaching out */}
      <div className="tile grid grid-cols-3 divide-x divide-[color-mix(in_oklab,var(--p-ink)_10%,transparent)] py-3 text-center">
        <span>
          <span className="block font-display text-[19px] font-semibold tabular-nums">{done.length}</span>
          <span className="block text-[11.5px] text-muted">Completed</span>
        </span>
        <span>
          <span className="flex items-center justify-center gap-1 font-display text-[19px] font-semibold tabular-nums">
            <Clock className="size-4 text-muted" />
            100%
          </span>
          <span className="block text-[11.5px] text-muted">On time</span>
        </span>
        <span>
          <span className="flex items-center justify-center gap-1 font-display text-[19px] font-semibold tabular-nums">
            <Star className="size-4 fill-current text-[#f5b301]" />
            {avg ? avg.toFixed(1) : "–"}
          </span>
          <span className="block text-[11.5px] text-muted">Brand rating</span>
        </span>
      </div>

      <div className={`grid gap-2.5 ${wide ? "@3xl:grid-cols-2" : ""}`}>
        {done.map((t) => {
          const b = s.brands.find((x) => x.id === t.brandId)!;
          const brief = agreedBrief(t)!;
          return (
            <article key={t.id} className="tile flex items-center gap-3.5 p-3.5">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[calc(var(--p-radius)*0.55)] bg-white">
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo} alt="" className="size-8 object-contain" />
                ) : (
                  <span className="text-sm font-bold text-black">{b.initials}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-muted">
                  {b.name} · {fmtDay(t.paidAt ?? t.createdAt)}
                </span>
                <span className="block font-semibold leading-snug text-pretty">{brief.title}</span>
                <span className="mt-0.5 block text-[12.5px] text-muted">{brief.items.map((i) => i.kind).join(" + ")}</span>
              </span>
              {t.result && (
                <span className="shrink-0 text-right">
                  <span className="block font-display text-[15px] font-semibold tabular-nums">{t.result.split(" · ")[0]}</span>
                  {t.result.includes(" · ") && <span className="block text-[11.5px] text-muted">{t.result.split(" · ")[1]}</span>}
                </span>
              )}
            </article>
          );
        })}
      </div>
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted">
        <BadgeCheck className="size-3" /> Deals paid through Solo escrow
      </p>
    </section>
  );
}
