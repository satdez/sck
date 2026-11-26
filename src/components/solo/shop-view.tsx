"use client";

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { inr, offerUnit } from "@/lib/solo/money";
import { orderedOffers, useSolo } from "@/lib/solo/store";
import type { Offer, ShopDesign } from "@/lib/solo/types";
import type { Portfolio } from "@/lib/types";
import { SoloLogo } from "../solo-logo";
import { Checkout, OfferRow } from "./fan-shop";
import { OfferArt } from "./offer-art";

/** Big featured card for the spotlight layout. */
function Spotlight({ o, onOpen }: { o: Offer; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="tile group flex w-full flex-col overflow-hidden text-left">
      <span className="relative grid aspect-[16/9] w-full place-items-center overflow-hidden bg-surface-2 text-[64px]">
        <OfferArt o={o} className="transition-transform duration-500 group-hover:scale-110" />
      </span>
      <span className="flex flex-col gap-3 p-4">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">Featured · {offerUnit(o)}</span>
        <span className="font-display text-[1.5rem] leading-tight text-balance">{o.title}</span>
        <span className="text-[14px] leading-relaxed text-pretty text-muted">{o.blurb}</span>
        <span className="p-btn mt-1 h-12 w-full text-[15px] tabular-nums">{o.kind === "tip" ? "Send a tip" : `Get it · ${inr(o.price)}`}</span>
      </span>
    </button>
  );
}

/** Square card for the grid layout. */
function GridCard({ o, onOpen }: { o: Offer; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="tile group flex flex-col overflow-hidden text-left">
      <span className="relative grid aspect-square w-full place-items-center overflow-hidden bg-surface-2 text-[44px]">
        <OfferArt o={o} className="transition-transform duration-500 group-hover:scale-110" />
      </span>
      <span className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-[14px] leading-snug font-semibold text-pretty">{o.title}</span>
        <span className="text-[11.5px] text-muted">{offerUnit(o)}</span>
        <span className="mt-auto pt-2 font-display text-lg tabular-nums">{o.kind === "tip" ? `from ${inr(o.price)}` : inr(o.price)}</span>
      </span>
    </button>
  );
}

/**
 * The creator's shop page (name.sck.bio/shop). Uses the page theme, so it feels like the
 * same site. `design` overrides the saved design (live preview in the Store designer);
 * `preview` turns off links and checkout.
 */
export function ShopView({ portfolio, design, preview }: { portfolio: Portfolio; design?: ShopDesign; preview?: boolean }) {
  const saved = useSolo((s) => s.shop);
  const creatorSlug = useSolo((s) => s.creator.slug);
  const offersState = useSolo((s) => (s.creator.slug === portfolio.slug ? s.offers : []));
  const d = design ?? saved;
  const offers = orderedOffers({ offers: offersState, shop: d });
  const [open, setOpen] = useState<Offer | null>(null);
  const p = portfolio.profile;
  const first = p.name.split(" ")[0];
  const go = (o: Offer) => !preview && setOpen(o);

  const featured = d.layout === "spotlight" ? (offers.find((o) => o.id === d.featured) ?? offers.find((o) => o.kind !== "tip")) : undefined;
  const rest = offers.filter((o) => o !== featured);

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 pt-5 pb-12">
      {/* back to the main page */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${portfolio.slug}`}
          onClick={(e) => preview && e.preventDefault()}
          className="p-btn p-btn--ghost h-9 gap-1.5 px-3 text-[13px]"
        >
          <ArrowLeft className="size-3.5" /> {portfolio.slug}.sck.bio
        </Link>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
          <Lock className="size-3" /> Secure checkout
        </span>
      </div>

      <header className="enter flex flex-col gap-4" style={{ ["--i" as string]: 0 }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.avatar} alt="" className="size-12 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{p.name}</p>
            <p className="truncate text-[13px] text-muted">{p.handle}</p>
          </div>
        </div>
        <h1 className="font-display text-[2.1rem] leading-[1.05] tracking-tight text-balance">{d.headline || `${first}'s shop`}</h1>
        {d.intro && <p className="text-[15px] leading-relaxed text-pretty text-muted">{d.intro}</p>}
      </header>

      {offers.length === 0 && <p className="tile p-6 text-center text-sm text-muted">{creatorSlug === portfolio.slug ? "Nothing for sale right now." : `${first} hasn't opened a shop yet.`}</p>}

      {featured && (
        <div className="enter" style={{ ["--i" as string]: 1 }}>
          <Spotlight o={featured} onOpen={() => go(featured)} />
        </div>
      )}

      {rest.length > 0 && (
        <div className="enter" style={{ ["--i" as string]: 2 }}>
          {d.layout === "grid" ? (
            <div className="grid grid-cols-2 gap-3">
              {rest.map((o) => (
                <GridCard key={o.id} o={o} onOpen={() => go(o)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {rest.map((o) => (
                <OfferRow key={o.id} o={o} onOpen={() => go(o)} />
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="flex justify-center pt-4">
        <span className="inline-flex items-baseline gap-1.5 rounded-full bg-surface px-3.5 py-2 text-xs font-medium leading-none shadow-[inset_0_0_0_1px_var(--p-line)]">
          <span className="text-muted">Shop powered by</span>
          <SoloLogo height={12} color="currentColor" />
        </span>
      </footer>

      {open && <Checkout key={open.id} offer={open} creator={first} onClose={() => setOpen(null)} />}
    </div>
  );
}
