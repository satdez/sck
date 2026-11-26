"use client";

import { OfferArt } from "./offer-art";
import { ArrowRight, CalendarCheck, Check, Download, Lock, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { fmtSlot, fmtTime, inr, offerUnit } from "@/lib/solo/money";
import { buyOffer, orderedOffers, useSolo } from "@/lib/solo/store";
import type { Offer } from "@/lib/solo/types";
import { SoloLogo } from "../solo-logo";
import { Field, fieldCls, Sheet } from "./sheet";
import { Btn } from "./ui";

const TIP_AMOUNTS = [50, 100, 200, 500];

/** Next four days from the demo's "today" (26 Nov 2026), three slots each. */
const SLOT_DAYS = ["2026-11-27", "2026-11-28", "2026-11-29", "2026-11-30"];
const SLOT_TIMES = ["11:00", "18:00", "20:00"];

/** One offer as a themed row (main-page preview and the list layout). */
export function OfferRow({ o, onOpen }: { o: Offer; onOpen?: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="tile group flex w-full items-center gap-3.5 p-3.5 text-left">
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[calc(var(--p-radius)*0.55)] bg-surface-2 text-2xl">
        <OfferArt o={o} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug text-pretty">{o.title}</span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{o.blurb}</span>
        <span className="mt-1 block text-[11.5px] font-medium text-muted">{offerUnit(o)}</span>
      </span>
      <span className="p-btn h-9 shrink-0 px-3.5 text-[13px] tabular-nums">{o.kind === "tip" ? "Tip" : inr(o.price)}</span>
    </button>
  );
}

/**
 * Shop preview on the creator's main sck.bio page: the first three offers and a link to
 * the full shop at /shop. The main page stays brand-first; the shop page is for fans.
 * Renders only for the creator whose Solo store this is.
 */
export function FanShop({ slug, name, wide }: { slug: string; name: string; wide?: boolean }) {
  const creatorSlug = useSolo((s) => s.creator.slug);
  const shop = useSolo((s) => s.shop);
  const offers = useSolo((s) => orderedOffers(s));
  const [open, setOpen] = useState<Offer | null>(null);
  if (slug !== creatorSlug || offers.length === 0 || !shop.homePreview) return null;

  const first = name.split(" ")[0];
  const top = offers.filter((o) => o.kind !== "tip").slice(0, 3);

  return (
    <section id="shop" className={`mx-auto flex w-full scroll-mt-6 flex-col gap-3 px-4 pb-8 ${wide ? "max-w-[1080px] @3xl:px-8" : "max-w-[560px]"}`}>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="font-display text-lg font-semibold tracking-tight">Shop &amp; ask {first}</h2>
        <Link href={`/${slug}/shop`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-ink">
          See all {offers.length} <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className={`grid gap-2.5 ${wide ? "@3xl:grid-cols-3" : ""}`}>
        {top.map((o) => (
          <OfferRow key={o.id} o={o} onOpen={() => setOpen(o)} />
        ))}
      </div>
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted">
        <Lock className="size-3" /> Secure checkout by Solo
      </p>
      {open && <Checkout key={open.id} offer={open} creator={first} onClose={() => setOpen(null)} />}
    </section>
  );
}

export function Checkout({ offer, creator, onClose }: { offer: Offer; creator: string; onClose: () => void }) {
  const taken = useSolo((s) => s.orders.filter((o) => o.slot && o.status !== "refunded").map((o) => o.slot!));
  const [stage, setStage] = useState<"form" | "paying" | "done">("form");
  const [buyer, setBuyer] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [tip, setTip] = useState(100);
  const amount = offer.kind === "tip" ? tip : offer.price;

  const valid =
    buyer.trim().length > 1 &&
    (offer.kind === "tip" || /\S+@\S+\.\S+/.test(email)) &&
    (offer.kind !== "pdm" || note.trim().length > 8) &&
    (offer.kind !== "call" || !!slot) &&
    amount >= offer.price;

  const pay = () => {
    setStage("paying");
    setTimeout(() => {
      buyOffer({ offerId: offer.id, buyer, email: email || "—", amount, note, slot: slot ?? undefined });
      setStage("done");
    }, 900);
  };

  const fill = () => {
    setBuyer("Neel Shah");
    setEmail("neel@example.com");
    if (offer.kind === "pdm") setNote("Moving from Android to iPhone: is the iPhone 17 worth it over a used 16 Pro at the same price?");
    if (offer.kind === "call") setNote("Want a ₹60k vlogging kit for travel");
    if (offer.kind === "tip") setNote("Thanks for the honest reviews!");
  };

  if (stage === "done")
    return (
      <Sheet
        open
        onOpenChange={(o) => !o && onClose()}
        title={offer.kind === "product" ? "It's yours" : offer.kind === "call" ? "You're booked" : offer.kind === "pdm" ? "Question sent" : `${creator} got your tip`}
        description={
          offer.kind === "product"
            ? `We've also emailed the download to ${email}.`
            : offer.kind === "call"
              ? `${fmtSlot(slot!)} · ${offer.minutes} min. A calendar invite and video link are on their way to ${email}.`
              : offer.kind === "pdm"
                ? `${creator} replies within ${offer.replyHours} hours. If not, Solo refunds you automatically.`
                : "Thank you for supporting independent creators."
        }
        footer={
          <Btn size="lg" className="w-full" onClick={onClose}>
            Done
          </Btn>
        }
      >
        <div className="flex flex-col items-center gap-4 pb-2">
          <span className="grid size-16 place-items-center rounded-full bg-[#22c55e]/15 text-[#16a34a]">
            {offer.kind === "call" ? <CalendarCheck className="size-7" /> : offer.kind === "pdm" ? <MailCheck className="size-7" /> : <Check className="size-7" />}
          </span>
          {offer.kind === "product" && (
            <div className="flex w-full items-center gap-3 rounded-xl bg-ui-sunken p-3">
              <span className="text-2xl">{offer.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{offer.file}</span>
              <Btn size="sm" variant="ghost">
                <Download className="size-3.5" /> Download
              </Btn>
            </div>
          )}
          <p className="text-center text-[12px] text-ui-muted">Paid {inr(amount)} · receipt sent by email</p>
        </div>
      </Sheet>
    );

  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={offer.title}
      description={offer.blurb}
      footer={
        <div className="flex flex-col gap-2">
          <Btn size="lg" className="w-full" disabled={!valid || stage === "paying"} onClick={pay}>
            <Smartphone className="size-4" /> {stage === "paying" ? "Confirming UPI payment…" : `Pay ${inr(amount)} with UPI`}
          </Btn>
          <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-ui-muted">
            <ShieldCheck className="size-3.5" /> Checkout by
            <span className="grid h-5 place-items-center rounded-[6px] bg-[#0b0b0b] px-1.5">
              <SoloLogo height={9} />
            </span>
            · prototype, no money moves
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {offer.kind === "tip" && (
          <div className="grid grid-cols-4 gap-2">
            {TIP_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setTip(a)}
                className={`ui-press h-12 rounded-xl text-sm font-semibold tabular-nums ${tip === a ? "bg-ui-ink text-ui-bg" : "bg-ui-panel shadow-[0_0_0_1px_var(--ui-line)]"}`}
              >
                ₹{a}
              </button>
            ))}
          </div>
        )}

        {offer.kind === "call" && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ui-muted">Pick a time · {offer.minutes} min video call</span>
            {SLOT_DAYS.map((d) => (
              <div key={d} className="flex items-center gap-2">
                <span className="w-[86px] shrink-0 text-[12.5px] font-semibold whitespace-nowrap">{fmtSlot(`${d}T12:00:00+05:30`).split(", ").slice(0, 2).join(", ")}</span>
                <div className="grid flex-1 grid-cols-3 gap-1.5">
                  {SLOT_TIMES.map((t) => {
                    const iso = `${d}T${t}:00+05:30`;
                    const busy = taken.includes(iso);
                    const on = slot === iso;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={busy}
                        onClick={() => setSlot(iso)}
                        className={`h-9 rounded-lg text-[12.5px] font-semibold tabular-nums transition-colors disabled:line-through disabled:opacity-35 ${on ? "bg-ui-ink text-ui-bg" : "bg-ui-panel shadow-[0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken"}`}
                      >
                        {fmtTime(iso)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {offer.kind === "pdm" && (
          <Field label="Your question" hint={`${creator} answers personally within ${offer.replyHours} h, or you're refunded.`}>
            <textarea rows={4} className={fieldCls} placeholder="Be specific: budget, what you use it for, what you have now" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Your name">
            <input className={fieldCls} value={buyer} onChange={(e) => setBuyer(e.target.value)} autoComplete="name" />
          </Field>
          {offer.kind !== "tip" ? (
            <Field label="Email">
              <input className={fieldCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
          ) : (
            <Field label="Amount (₹)">
              <input inputMode="numeric" className={`${fieldCls} tabular-nums`} value={tip} onChange={(e) => setTip(Number(e.target.value.replace(/\D/g, "")) || 0)} />
            </Field>
          )}
        </div>

        {(offer.kind === "call" || offer.kind === "tip") && (
          <Field label={offer.kind === "call" ? "What should we cover?" : "Note (optional)"}>
            <input className={fieldCls} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        )}

        <button type="button" onClick={fill} className="self-start text-[12px] font-semibold text-ui-muted underline underline-offset-2 hover:text-ui-ink">
          Fill an example
        </button>
      </div>
    </Sheet>
  );
}
