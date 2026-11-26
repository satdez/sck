"use client";

import { ArrowDown, ArrowUp, ArrowUpRight, Copy, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SAMPLE } from "@/lib/sample";
import { inr } from "@/lib/solo/money";
import { moveOffer, orderedOffers, updateOffer, updateShop, useSolo } from "@/lib/solo/store";
import type { ShopLayout } from "@/lib/solo/types";
import { ThemeScope } from "../portfolio/theme-scope";
import { IPhoneFrame } from "../editor/iphone-frame";
import { resolveTheme } from "@/lib/themes";
import { Field, fieldCls } from "./sheet";
import { ShopView } from "./shop-view";
import { OfferArt } from "./offer-art";
import { Card } from "./ui";

const LAYOUTS: { id: ShopLayout; name: string; hint: string }[] = [
  { id: "spotlight", name: "Spotlight", hint: "One hero item, the rest below" },
  { id: "grid", name: "Grid", hint: "Product cards, two per row" },
  { id: "list", name: "List", hint: "Compact rows, like links" },
];

/** Tiny schematic of each layout, drawn with boxes. */
function Schematic({ id }: { id: ShopLayout }) {
  const box = "rounded-[4px] bg-ui-ink/15 dark:bg-white/20";
  if (id === "spotlight")
    return (
      <div className="flex w-full flex-col gap-1">
        <div className={`h-7 ${box}`} />
        <div className={`h-2 ${box}`} />
        <div className={`h-2 ${box}`} />
      </div>
    );
  if (id === "grid")
    return (
      <div className="grid w-full grid-cols-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-[18px] ${box}`} />
        ))}
      </div>
    );
  return (
    <div className="flex w-full flex-col gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`h-[9px] ${box}`} />
      ))}
    </div>
  );
}

/**
 * Store › Shop page: design the fan storefront at name.sck.bio/shop.
 * Edits save as you go; the phone on the right is the live page.
 */
export function ShopDesigner() {
  const s = useSolo((x) => x);
  const d = s.shop;
  const all = orderedOffers(s, true);
  const url = `${s.creator.slug}.sck.bio/shop`;
  const tint = resolveTheme(SAMPLE.theme).palette;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* address */}
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-ui-muted">Your shop lives at</p>
            <p className="truncate font-mono text-[15px] font-semibold">{url}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(`https://${url}`).catch(() => {});
              toast.success("Shop link copied", { description: url });
            }}
            className="ui-press inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--ui-line)]"
          >
            <Copy className="size-3.5" /> Copy
          </button>
          <Link href={`/${s.creator.slug}/shop`} className="ui-press inline-flex h-9 items-center gap-1.5 rounded-lg bg-ui-ink px-3 text-[13px] font-semibold text-ui-bg">
            Open <ArrowUpRight className="size-3.5" />
          </Link>
        </Card>

        {/* layout */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">Layout</p>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => updateShop({ layout: l.id })}
                aria-pressed={d.layout === l.id}
                className={`ui-press flex flex-col gap-2.5 rounded-xl bg-ui-panel p-2.5 text-left ${d.layout === l.id ? "shadow-[0_0_0_2px_var(--ui-ink)]" : "shadow-[0_0_0_1px_var(--ui-line)]"}`}
              >
                <span className="flex h-14 items-center rounded-lg bg-ui-sunken p-2">
                  <Schematic id={l.id} />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold">{l.name}</span>
                  <span className="block text-[11.5px] leading-snug text-ui-muted">{l.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Headline">
          <input className={fieldCls} value={d.headline} maxLength={70} onChange={(e) => updateShop({ headline: e.target.value })} />
        </Field>
        <Field label="Intro">
          <textarea rows={2} className={fieldCls} value={d.intro} maxLength={180} onChange={(e) => updateShop({ intro: e.target.value })} />
        </Field>
        {d.layout === "spotlight" && (
          <Field label="Featured item" hint="Shown big at the top. Pick your best seller or newest drop.">
            <select className={fieldCls} value={d.featured ?? ""} onChange={(e) => updateShop({ featured: e.target.value || null })}>
              {all
                .filter((o) => o.active)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.emoji} {o.title}
                  </option>
                ))}
            </select>
          </Field>
        )}

        {/* order + visibility */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">Items and order</p>
          <Card className="divide-y divide-ui-line overflow-hidden">
            {all.map((o, i) => (
              <div key={o.id} className={`flex items-center gap-3 px-3 py-2.5 ${o.active ? "" : "opacity-50"}`}>
                <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-ui-sunken text-lg">
                  <OfferArt o={o} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{o.title}</p>
                  <p className="text-[12px] text-ui-muted">{o.kind === "tip" ? `from ${inr(o.price)}` : inr(o.price)}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button type="button" aria-label={`Move ${o.title} up`} disabled={i === 0} onClick={() => moveOffer(o.id, -1)} className="grid size-8 place-items-center rounded-lg text-ui-muted hover:bg-ui-sunken hover:text-ui-ink disabled:opacity-30">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" aria-label={`Move ${o.title} down`} disabled={i === all.length - 1} onClick={() => moveOffer(o.id, 1)} className="grid size-8 place-items-center rounded-lg text-ui-muted hover:bg-ui-sunken hover:text-ui-ink disabled:opacity-30">
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" aria-label={o.active ? `Hide ${o.title}` : `Show ${o.title}`} onClick={() => updateOffer(o.id, { active: !o.active })} className="grid size-8 place-items-center rounded-lg text-ui-muted hover:bg-ui-sunken hover:text-ui-ink">
                    {o.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-xl bg-ui-panel px-4 py-3 shadow-[0_0_0_1px_var(--ui-line)]">
          <span>
            <span className="block text-sm font-semibold">Preview on my main page</span>
            <span className="block text-[12.5px] text-ui-muted">Shows your top 3 items on {s.creator.slug}.sck.bio with a link here.</span>
          </span>
          <input type="checkbox" className="size-4 shrink-0 accent-[var(--ui-ink)]" checked={d.homePreview} onChange={(e) => updateShop({ homePreview: e.target.checked })} />
        </label>
        <p className="text-[12px] text-ui-muted">Colours and fonts follow your page theme. Changes save as you go.</p>
      </div>

      {/* live phone: the editor's iPhone frame on its canvas */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">Live preview</p>
        <div className="ed-canvas h-[720px] max-h-[78dvh] overflow-hidden rounded-2xl border border-ui-line bg-ui-sunken p-4">
          <IPhoneFrame barBg={tint.bg} barInk={tint.ink}>
            <ThemeScope theme={SAMPLE.theme} className="min-h-full" glowSrc={SAMPLE.profile.avatar}>
              <ShopView portfolio={SAMPLE} design={d} preview />
            </ThemeScope>
          </IPhoneFrame>
        </div>
      </div>
    </div>
  );
}
