"use client";

import { ArrowUpRight, CalendarPlus, Check, ChevronDown, ImagePlus, MessageCircleQuestion, Paintbrush, Pencil, Plus, RotateCcw, ShoppingBag, Trash2, Video, X, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { fanFeeRate, fanNet, fmtSlot, fmtTime, fmtWhen, inr, offerUnit, settled } from "@/lib/solo/money";
import { T0 } from "@/lib/solo/seed";
import { addOffer, answerQuestion, completeCall, deleteOffer, refundOrder, updateOffer, useSolo } from "@/lib/solo/store";
import type { Offer, OfferKind, Order } from "@/lib/solo/types";
import { Segmented } from "../editor/ui";
import { OfferArt } from "./offer-art";
import { AppShell } from "./shell";
import { ShopDesigner } from "./shop-designer";
import { Field, fieldCls, Sheet } from "./sheet";
import { Btn, Card, Chip, Empty, Person, SectionTitle } from "./ui";

const KIND: Record<OfferKind, { label: string; plural: string; emoji: string; hint: string }> = {
  product: { label: "Digital product", plural: "Products", emoji: "📦", hint: "PDF, presets, templates. Buyers get an instant download." },
  call: { label: "Paid call", plural: "Calls", emoji: "📞", hint: "Fans pick a slot and pay up front. Video link sent automatically." },
  pdm: { label: "Priority DM", plural: "Questions", emoji: "⚡", hint: "Fans pay for a guaranteed reply. Late? Solo refunds them." },
  tip: { label: "Tip", plural: "Tips", emoji: "☕", hint: "One-tap support by UPI. Set a minimum." },
};

const STATUS: Partial<Record<Order["status"], { label: string; tone: "neutral" | "good" | "warn" | "accent" | "bad" }>> = {
  booked: { label: "Booked", tone: "accent" },
  done: { label: "Call done", tone: "good" },
  awaiting: { label: "Needs answer", tone: "warn" },
  answered: { label: "Answered", tone: "good" },
  refunded: { label: "Refunded", tone: "neutral" },
};

const H = 3_600_000;
/** demo "now" is fixed so the server prerender and the browser agree */
const NOW = T0;
const KPI_KEY = "solo.store.kpis";

/** "in 4 h", "in 2 days", "overdue" */
function dueIn(ms: number) {
  const h = Math.round((ms - NOW) / H);
  if (h < 0) return "Overdue";
  if (h < 1) return "Due within the hour";
  if (h < 36) return `Due in ${h} h`;
  return `Due in ${Math.round(h / 24)} days`;
}

/** Today / Yesterday / 24 Nov, for grouping orders */
function dayLabel(ms: number) {
  const startToday = Date.UTC(2026, 10, 25, 18, 30); // 26 Nov 00:00 IST
  if (ms >= startToday) return "Today";
  if (ms >= startToday - 24 * H) return "Yesterday";
  return fmtWhen(ms);
}

export function StoreScreen() {
  const s = useSolo((x) => x);
  const [editing, setEditing] = useState<Offer | "new" | null>(null);
  const [tab, setTab] = useState<"sales" | "design">("sales");
  const [todoOpen, setTodoOpen] = useState(true);
  const offerOf = (o: Order) => s.offers.find((x) => x.id === o.offerId);
  const pdmDue = (o: Order) => o.at + (offerOf(o)?.replyHours ?? 48) * H;

  const earned = s.orders.filter(settled);
  const gross = earned.reduce((n, o) => n + o.amount, 0);
  const net = earned.reduce((n, o) => n + fanNet(o, s.creator.plan), 0);
  const questions = s.orders.filter((o) => o.status === "awaiting");
  const calls = s.orders.filter((o) => o.status === "booked");
  // one to-do list, soonest deadline first
  const todo = [...questions.map((o) => ({ o, due: pdmDue(o) })), ...calls.map((o) => ({ o, due: Date.parse(o.slot!) }))].sort((a, b) => a.due - b.due);

  return (
    <AppShell role="creator">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-[clamp(1.75rem,4.5vw,2.25rem)] leading-tight font-semibold tracking-tight">Store</h1>
            <p className="mt-1 max-w-[56ch] text-sm text-pretty text-ui-muted">What fans buy from your shop. Paid into the same wallet as brand deals.</p>
          </div>
          <div className="flex gap-2">
            {/* phones: an icon, so New offer is the one big button; wider: the labelled link */}
            <Link
              href={`/${s.creator.slug}/shop`}
              aria-label="View shop"
              title="View shop"
              className="ui-press inline-flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ui-panel text-sm font-semibold shadow-[inset_0_0_0_1px_var(--ui-line)] sm:w-auto sm:px-4"
            >
              <span className="hidden sm:inline">View shop</span> <ArrowUpRight className="size-4" />
            </Link>
            <Btn className="h-10 flex-1 sm:flex-none" onClick={() => setEditing("new")}>
              <Plus className="size-4" /> New offer
            </Btn>
          </div>
        </div>

        <div className="w-full sm:max-w-xs">
          <Segmented
            id="store-tab"
            value={tab}
            onChange={setTab}
            options={[
              { value: "sales", label: <><ShoppingBag className="size-3.5" /> Sales</> },
              { value: "design", label: <><Paintbrush className="size-3.5" /> Shop page</> },
            ]}
          />
        </div>

        {tab === "design" ? (
          <ShopDesigner />
        ) : (
          <>
            <Earnings gross={gross} net={net} orders={earned.length} plan={s.creator.plan} byKind={(k) => earned.filter((o) => o.kind === k).reduce((n, o) => n + fanNet(o, s.creator.plan), 0)} />

            {/* 1. what needs you, in deadline order */}
            <section className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setTodoOpen((o) => !o)}
                aria-expanded={todoOpen}
                className="flex items-center gap-1.5 self-start text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase hover:text-ui-ink"
              >
                To do <span className="font-normal tracking-normal">· {todo.length}</span>
                <ChevronDown className={`size-3.5 transition-transform duration-200 ${todoOpen ? "" : "-rotate-90"}`} />
              </button>
              {!todoOpen ? null : todo.length === 0 ? (
                <Card>
                  <Empty icon={<MessageCircleQuestion className="size-5" />} title="You're all caught up" body="Paid questions and booked calls show up here with their deadline." />
                </Card>
              ) : (
                <Card className="divide-y divide-ui-line overflow-hidden">
                  {todo.map(({ o, due }) => (o.kind === "pdm" ? <QuestionRow key={o.id} o={o} due={due} net={fanNet(o, s.creator.plan)} /> : <CallRow key={o.id} o={o} title={offerOf(o)?.title} net={fanNet(o, s.creator.plan)} />))}
                </Card>
              )}
            </section>

            {/* 2. what you sell */}
            <section className="flex flex-col gap-3">
              <SectionTitle
                action={
                  <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-ui-muted hover:text-ui-ink">
                    <Plus className="size-3.5" /> Add
                  </button>
                }
              >
                Your offers <span className="font-normal text-ui-muted">· {s.offers.filter((o) => o.active).length} live</span>
              </SectionTitle>
              <Card className="divide-y divide-ui-line overflow-hidden">
                {s.offers.map((o) => (
                  <OfferLine key={o.id} o={o} sold={s.orders.filter((x) => x.offerId === o.id && settled(x)).length} onEdit={() => setEditing(o)} />
                ))}
              </Card>
            </section>

            {/* 3. what happened */}
            <Orders orders={s.orders} offerOf={offerOf} plan={s.creator.plan} />
          </>
        )}
      </div>

      {editing && <OfferSheet key={editing === "new" ? "new" : editing.id} offer={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </AppShell>
  );
}

/* ───────────── earnings: one line, opens into the breakdown ───────────── */

function Earnings({ gross, net, orders, plan, byKind }: { gross: number; net: number; orders: number; plan: "free" | "pro"; byKind: (k: OfferKind) => number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only preference, read after hydration
      if (localStorage.getItem(KPI_KEY) === "open") setOpen(true);
    } catch {}
  }, []);
  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(KPI_KEY, o ? "closed" : "open");
      } catch {}
      return !o;
    });
  };
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-ui-sunken/50">
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold text-ui-muted">You keep this month</span>
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-[24px] leading-tight font-semibold tracking-tight tabular-nums">{inr(net)}</span>
            <span className="text-[12.5px] text-ui-muted">
              from {orders} orders · {inr(gross)} in sales
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-ui-muted">
          <span className="hidden sm:inline">{open ? "Hide" : "Breakdown"}</span>
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-px border-t border-ui-line bg-ui-line sm:grid-cols-4">
          {(Object.keys(KIND) as OfferKind[]).map((k) => (
            <div key={k} className="flex flex-col gap-0.5 bg-ui-panel px-4 py-3">
              <span className="text-[12px] font-semibold text-ui-muted">
                {KIND[k].emoji} {KIND[k].plural}
              </span>
              <span className="font-heading text-[17px] font-semibold tabular-nums">{inr(byKind(k))}</span>
            </div>
          ))}
          <p className="col-span-2 bg-ui-panel px-4 py-2.5 text-[12px] text-ui-muted sm:col-span-4">
            After Solo&apos;s {plan === "pro" ? "5%" : "10%"} fee (5% on tips). Questions count once answered.
          </p>
        </div>
      )}
    </Card>
  );
}

/* ───────────── to-do rows ───────────── */

function QuestionRow({ o, due, net }: { o: Order; due: number; net: number }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const urgent = due - NOW < 24 * H;
  return (
    <div className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="relative shrink-0">
          <Person name={o.buyer} src={o.avatar} size={40} />
          <span className="absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-ui-accent text-ui-accent-ink shadow-[0_0_0_2px_var(--ui-panel)]">
            <Zap className="size-2.5" strokeWidth={2.6} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          {/* same two-line head on every row: who and what, then the deadline */}
          <p className="flex min-w-0 items-baseline gap-2 text-[13.5px]">
            <span className="truncate font-semibold">{o.buyer}</span>
            <span className="shrink-0 text-ui-muted">Priority DM</span>
          </p>
          <p className={`text-[12px] font-semibold ${urgent ? "text-[#b45309] dark:text-[#fbbf24]" : "text-ui-muted"}`}>{dueIn(due)}</p>
          <p className="mt-1 text-[14px] leading-snug text-pretty">{o.note}</p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block text-[14px] font-semibold tabular-nums">{inr(net)}</span>
          <span className="block text-[11px] text-ui-muted">when answered</span>
        </span>
      </div>
      {open ? (
        <form
          className="flex flex-col gap-2 sm:pl-[52px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim().length >= 10) answerQuestion(o.id, text.trim());
          }}
        >
          <textarea rows={3} autoFocus className={fieldCls} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Answer ${o.buyer.split(" ")[0]}. It's emailed to them.`} />
          <div className="flex items-center gap-2">
            <Btn size="sm" variant="quiet" onClick={() => refundOrder(o.id)}>
              <RotateCcw className="size-3.5" /> Refund
            </Btn>
            <Btn size="sm" variant="quiet" className="ml-auto" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn size="sm" variant="solid" type="submit" disabled={text.trim().length < 10}>
              Send answer
            </Btn>
          </div>
        </form>
      ) : (
        <div className="flex gap-2 sm:pl-[52px]">
          <Btn size="sm" variant="ghost" className="flex-1 sm:flex-none" onClick={() => refundOrder(o.id)}>
            <RotateCcw className="size-3.5" /> Refund
          </Btn>
          <Btn size="sm" variant="solid" className="flex-1 sm:flex-none" onClick={() => setOpen(true)}>
            Answer
          </Btn>
        </div>
      )}
    </div>
  );
}

function CallRow({ o, title, net }: { o: Order; title?: string; net: number }) {
  // the video link opens 15 minutes before the slot; until then the row offers the calendar
  const soon = Date.parse(o.slot!) - NOW <= 15 * 60_000;
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
      <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-ui-sunken leading-none">
        <span className="text-[10px] font-semibold text-ui-muted uppercase">{fmtSlot(o.slot!).split(",")[0]}</span>
        <span className="text-[15px] font-bold tabular-nums">{fmtSlot(o.slot!).split(",")[1]?.trim().split(" ")[0]}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-[13.5px]">
          <span className="font-semibold">{o.buyer}</span>
          <span className="text-ui-muted">Call at {fmtTime(o.slot!)}</span>
        </p>
        <p className="truncate text-[13px] text-ui-muted">{o.note ?? title}</p>
      </div>
      <span className="text-[14px] font-semibold tabular-nums">{inr(net)}</span>
      <div className="flex w-full gap-2 sm:w-auto sm:pl-0">
        {soon ? (
          <>
            <Btn size="sm" variant="ghost" className="flex-1 sm:flex-none" onClick={() => completeCall(o.id)}>
              Mark done
            </Btn>
            <Btn size="sm" variant="solid" className="flex-1 sm:flex-none">
              <Video className="size-3.5" /> Join
            </Btn>
          </>
        ) : (
          <>
            <Btn size="sm" variant="ghost" className="flex-1 sm:flex-none" onClick={() => toast.success("Added to your calendar", { description: `${o.buyer}, ${fmtSlot(o.slot!)}` })}>
              <CalendarPlus className="size-3.5" /> Add to calendar
            </Btn>
            <Btn size="sm" variant="solid" disabled className="flex-1 sm:flex-none">
              <Video className="size-3.5" /> Join at {fmtTime(o.slot!)}
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────── offers ───────────── */

function OfferLine({ o, sold, onEdit }: { o: Offer; sold: number; onEdit: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-opacity ${o.active ? "" : "opacity-55"}`}>
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-ui-sunken text-xl">
        <OfferArt o={o} />
      </span>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className="line-clamp-2 block text-[14px] leading-snug font-semibold text-pretty">{o.title}</span>
        <span className="block truncate text-[12.5px] text-ui-muted">
          {KIND[o.kind].label} · {o.kind === "tip" ? `from ${inr(o.price)}` : inr(o.price)} · {sold} sold
        </span>
      </button>
      <button type="button" aria-label={`Edit ${o.title}`} onClick={onEdit} className="hidden size-8 place-items-center rounded-lg text-ui-muted hover:bg-ui-sunken hover:text-ui-ink sm:grid">
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={o.active}
        aria-label={`${o.active ? "Hide" : "Show"} ${o.title} on your shop`}
        onClick={() => updateOffer(o.id, { active: !o.active })}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${o.active ? "bg-ui-ink" : "bg-ui-line"}`}
      >
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-ui-panel shadow transition-transform duration-200" style={{ transform: o.active ? "translateX(16px)" : "none", transitionTimingFunction: "var(--ease-out)" }} />
      </button>
    </div>
  );
}

/* ───────────── orders: grouped by day, filter by kind ───────────── */

function Orders({ orders, offerOf, plan }: { orders: Order[]; offerOf: (o: Order) => Offer | undefined; plan: "free" | "pro" }) {
  const [filter, setFilter] = useState<OfferKind | "all">("all");
  const [all, setAll] = useState(false);
  const list = [...orders].sort((a, b) => b.at - a.at).filter((o) => filter === "all" || o.kind === filter);
  const shown = all ? list : list.slice(0, 6);
  const groups = shown.reduce<{ day: string; rows: Order[] }[]>((acc, o) => {
    const day = dayLabel(o.at);
    const g = acc.at(-1);
    if (g && g.day === day) g.rows.push(o);
    else acc.push({ day, rows: [o] });
    return acc;
  }, []);

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Recent orders</SectionTitle>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {(["all", "product", "call", "pdm", "tip"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            aria-pressed={filter === k}
            className={`h-8 shrink-0 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${filter === k ? "bg-ui-ink text-ui-bg" : "bg-ui-panel text-ui-muted shadow-[inset_0_0_0_1px_var(--ui-line)] hover:text-ui-ink"}`}
          >
            {k === "all" ? "All" : KIND[k].plural}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Card>
          <Empty icon={<ShoppingBag className="size-5" />} title="No orders here yet" body="Share your page link to get your first sale." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {groups.map((g) => (
            <div key={g.day}>
              <p className="border-b border-ui-line bg-ui-sunken/50 px-4 py-1.5 text-[11.5px] font-semibold text-ui-muted">{g.day}</p>
              <div className="divide-y divide-ui-line">
                {g.rows.map((o) => {
                  const off = offerOf(o);
                  const st = STATUS[o.status];
                  return (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                      <Person name={o.buyer} src={o.avatar} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px]">
                          <span className="font-semibold">{o.buyer}</span> <span className="text-ui-muted">{o.kind === "tip" ? "sent a tip" : o.kind === "call" ? "booked" : o.kind === "pdm" ? "asked" : "bought"}</span>
                        </p>
                        <p className="truncate text-[12.5px] text-ui-muted">
                          {o.kind === "tip" ? (o.note ? `“${o.note}”` : "Tip") : (off?.title ?? "Removed offer")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`text-[13.5px] font-semibold tabular-nums ${o.status === "refunded" ? "text-ui-muted line-through" : ""}`}>+{inr(fanNet(o, plan))}</span>
                        {st ? <Chip tone={st.tone}>{st.label}</Chip> : <span className="text-[11px] text-ui-muted">{fmtTime(o.at)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {list.length > 6 && (
            <button type="button" onClick={() => setAll((a) => !a)} className="w-full border-t border-ui-line px-4 py-2.5 text-[13px] font-semibold text-ui-muted hover:bg-ui-sunken/50 hover:text-ui-ink">
              {all ? "Show less" : `Show all ${list.length}`}
            </button>
          )}
        </Card>
      )}
    </section>
  );
}

/* ───────────── new / edit offer ───────────── */

const EMOJIS = ["📦", "📱", "🎛️", "🎧", "💻", "📸", "🎬", "📚", "🧠", "📞", "⚡", "☕", "🎁", "✨"];

/** Shrinks an uploaded image to a small square cover, so it fits in the demo's local storage. */
function toCover(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 320;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const r = Math.max(size / img.width, size / img.height);
      ctx.drawImage(img, (size - img.width * r) / 2, (size - img.height * r) / 2, img.width * r, img.height * r);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function OfferSheet({ offer, onClose }: { offer: Offer | null; onClose: () => void }) {
  const plan = useSolo((s) => s.creator.plan);
  const [kind, setKind] = useState<OfferKind>(offer?.kind ?? "product");
  const [title, setTitle] = useState(offer?.title ?? "");
  const [blurb, setBlurb] = useState(offer?.blurb ?? "");
  const [price, setPrice] = useState(offer?.price ?? 299);
  const [minutes, setMinutes] = useState(offer?.minutes ?? 30);
  const [hours, setHours] = useState(offer?.replyHours ?? 48);
  const [file, setFile] = useState(offer?.file ?? "");
  const [emoji, setEmoji] = useState(offer?.emoji ?? KIND[offer?.kind ?? "product"].emoji);
  const [image, setImage] = useState<string | undefined>(offer?.image);
  const [emojiTouched, setEmojiTouched] = useState(!!offer);
  const fee = Math.round(price * fanFeeRate(kind, plan));

  const save = () => {
    const data = {
      kind,
      title: title.trim(),
      blurb: blurb.trim(),
      price,
      emoji,
      image,
      ...(kind === "product" ? { file: file || "download.pdf" } : {}),
      ...(kind === "call" ? { minutes } : {}),
      ...(kind === "pdm" ? { replyHours: hours } : {}),
    };
    if (offer) updateOffer(offer.id, data);
    else addOffer(data);
    onClose();
  };

  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={offer ? "Edit offer" : "New offer"}
      description={KIND[kind].hint}
      footer={
        <div className="flex items-center gap-2">
          {offer && (
            <Btn
              variant="danger"
              aria-label="Delete offer"
              onClick={() => {
                deleteOffer(offer.id);
                onClose();
              }}
            >
              <Trash2 className="size-4" />
            </Btn>
          )}
          <Btn size="lg" className="flex-1" disabled={title.trim().length < 3 || price <= 0} onClick={save}>
            {offer ? "Save" : "Add to my shop"}
          </Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {!offer && (
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {(Object.keys(KIND) as OfferKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  if (!emojiTouched) setEmoji(KIND[k].emoji);
                }}
                aria-pressed={kind === k}
                className={`ui-press flex h-12 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${kind === k ? "bg-ui-sunken shadow-[inset_0_0_0_2px_var(--ui-ink)]" : "text-ui-muted shadow-[inset_0_0_0_1px_var(--ui-line)] hover:text-ui-ink"}`}
              >
                <span className="text-lg">{KIND[k].emoji}</span>
                <span className="min-w-0 flex-1 truncate">{KIND[k].label}</span>
                {kind === k && <Check className="size-4 shrink-0" strokeWidth={2.4} />}
              </button>
            ))}
          </div>
        )}

        {/* cover: optional image, or an icon */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ui-muted">
            Cover <span className="font-normal">· optional</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-ui-sunken text-3xl shadow-[inset_0_0_0_1px_var(--ui-line)]">
              <OfferArt o={{ emoji, image }} />
              {image && (
                <button type="button" aria-label="Remove image" onClick={() => setImage(undefined)} className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/60 text-white">
                  <X className="size-3" />
                </button>
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label className="ui-press inline-flex h-9 cursor-pointer items-center gap-1.5 self-start rounded-lg px-3 text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken">
                <ImagePlus className="size-4" /> {image ? "Change image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setImage(await toCover(f).catch(() => undefined));
                  }}
                />
              </label>
              <p className="text-[11.5px] text-ui-muted">{image ? "Shown on your shop instead of the icon." : "No image? Pick an icon instead."}</p>
            </div>
          </div>
          {!image && (
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Use ${e}`}
                  aria-pressed={emoji === e}
                  onClick={() => {
                    setEmoji(e);
                    setEmojiTouched(true);
                  }}
                  className={`grid aspect-square place-items-center rounded-lg text-lg transition-colors ${emoji === e ? "bg-ui-sunken shadow-[inset_0_0_0_2px_var(--ui-ink)]" : "hover:bg-ui-sunken"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <Field label="Title">
          <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "call" ? "1:1 setup consult" : kind === "pdm" ? "Ask me anything" : kind === "tip" ? "Buy me a chai" : "My Lightroom presets"} />
        </Field>
        <Field label="One line for fans">
          <input className={fieldCls} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={kind === "tip" ? "Minimum (₹)" : "Price (₹)"} hint={`Solo fee ${inr(fee)} · you get ${inr(price - fee)}`}>
            <input inputMode="numeric" className={`${fieldCls} tabular-nums`} value={price || ""} onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, "")) || 0)} />
          </Field>
          {kind === "call" && (
            <Field label="Length">
              <select className={fieldCls} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                {[15, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </Field>
          )}
          {kind === "pdm" && (
            <Field label="Reply within">
              <select className={fieldCls} value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                {[24, 48, 72].map((h) => (
                  <option key={h} value={h}>
                    {h} hours
                  </option>
                ))}
              </select>
            </Field>
          )}
          {kind === "product" && (
            <Field label="File">
              <label className={`${fieldCls} flex cursor-pointer items-center truncate`}>
                <span className="truncate">{file || "Choose a file"}</span>
                <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0].name)} />
              </label>
            </Field>
          )}
        </div>
        <p className="text-[12px] text-ui-muted">{offerUnit({ kind, minutes, replyHours: hours })}</p>
      </div>
    </Sheet>
  );
}
