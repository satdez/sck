"use client";

import { createElement, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/solo/whatsapp-icon";
import { dealMoney } from "./money";
import { SEED, T0 } from "./seed";
import type { Brief, DmRule, DraftComment, Message, Offer, OfferKind, Order, OrderStatus, Role, SoloState, Stage, Thread } from "./types";

/**
 * Prototype store: one object in memory, mirrored to localStorage so every page
 * (and every role) sees the same deals. Swap for real APIs later; components only
 * call useSolo() and the actions below.
 */
const KEY = "solo-proto";
let state: SoloState = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as SoloState;
      if (s.v === SEED.v) state = s;
    }
  } catch {
    /* private mode: stay on the seed */
  }
}

function commit(next: SoloState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    hydrated = false;
    state = SEED;
    load();
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => SEED;

export function useSolo<T>(select: (s: SoloState) => T): T {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return select(s);
}
export const readSolo = () => getSnapshot();

/* ───────────── helpers ───────────── */

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;
/** seeded chats sit at T0; anything new happens after the newest message */
const now = () => Math.max(Date.now(), T0 + 60_000);

function updateThread(id: string, fn: (t: Thread) => Thread, extra?: (s: SoloState) => Partial<SoloState>) {
  const s = getSnapshot();
  const threads = s.threads.map((t) => (t.id === id ? fn(t) : t));
  commit({ ...s, threads, ...(extra ? extra({ ...s, threads }) : {}) });
}

function push(t: Thread, m: Omit<Message, "id" | "at">, unreadFor?: "creator" | "brand"): Thread {
  return {
    ...t,
    messages: [...t.messages, { ...m, id: uid("m"), at: now() }],
    unread: unreadFor ? { ...t.unread, [unreadFor]: t.unread[unreadFor] + 1 } : t.unread,
  };
}

const brandOf = (t: Thread) => getSnapshot().brands.find((b) => b.id === t.brandId)!;
const findThread = (id: string) => getSnapshot().threads.find((t) => t.id === id)!;

/** The PRD's doorbell: important events go out on WhatsApp with one link back to the chat. */
function whatsapp(to: "creator" | "brand", t: Thread, text: string) {
  const s = getSnapshot();
  const who = to === "creator" ? s.creator.name.split(" ")[0] : brandOf(t).name;
  toast(`WhatsApp sent to ${who}`, { description: text, icon: createElement(WhatsAppIcon), duration: 3600 });
}

/* ───────────── navigation-ish ───────────── */

export function setRole(role: Role) {
  commit({ ...getSnapshot(), role });
}

export function openThread(role: "creator" | "brand", id: string | null) {
  const s = getSnapshot();
  commit({
    ...s,
    open: { ...s.open, [role]: id },
    threads: id ? s.threads.map((t) => (t.id === id ? { ...t, unread: { ...t.unread, [role]: 0 } } : t)) : s.threads,
  });
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  commit(SEED);
}

export function dismissAppNudge() {
  commit({ ...getSnapshot(), appNudgeSeen: true });
}

/* ───────────── chat ───────────── */

export function sendText(id: string, from: "creator" | "brand", text: string) {
  const t = findThread(id);
  if (t.blocked && from === "brand") return;
  const firstCreatorReply = from === "creator" && !t.messages.some((m) => m.from === "creator");
  updateThread(id, (t) => ({
    ...push(t, { from, kind: "text", text }, from === "creator" ? "brand" : "creator"),
    // replying to a request accepts it into the inbox
    folder: from === "creator" ? "inbox" : t.folder,
  }));
  if (firstCreatorReply && !t.muted) whatsapp("brand", t, `${getSnapshot().creator.name.split(" ")[0]} replied: "${text.slice(0, 60)}"`);
}

export function acceptRequest(id: string) {
  updateThread(id, (t) => push({ ...t, folder: "inbox" }, { from: "solo", kind: "system", text: "Request accepted. You can reply now." }));
}

export function declineThread(id: string) {
  updateThread(id, (t) => push({ ...t, stage: "declined", folder: "inbox" }, { from: "solo", kind: "system", text: "Declined. The chat stays open for future offers." }, "brand"));
}

export function reportThread(id: string) {
  const t = findThread(id);
  const s = getSnapshot();
  commit({
    ...s,
    brands: s.brands.map((b) => (b.id === t.brandId ? { ...b, flagged: true } : b)),
    threads: s.threads.filter((x) => x.id !== id),
    open: { ...s.open, creator: s.open.creator === id ? null : s.open.creator },
  });
  toast.success("Reported and removed", { description: "The Solo team will review this brand." });
}

export function toggleMute(id: string) {
  const t = findThread(id);
  updateThread(id, (t) => ({ ...t, muted: !t.muted }));
  toast(t.muted ? "Notifications on" : "Muted", { description: t.muted ? `You'll get WhatsApp alerts from ${brandOf(t).name} again.` : `No WhatsApp alerts from ${brandOf(t).name}. Messages still land here.` });
}

export function toggleBlock(id: string) {
  updateThread(id, (t) => push({ ...t, blocked: !t.blocked }, { from: "solo", kind: "system", text: t.blocked ? "Unblocked. You can message each other again." : "You blocked this brand. They can't message you or send briefs." }));
}

export function setAutoReply(patch: Partial<SoloState["creator"]["autoReply"]>) {
  const s = getSnapshot();
  commit({ ...s, creator: { ...s.creator, autoReply: { ...s.creator.autoReply, ...patch } } });
}

export function addSavedReply(text: string) {
  const s = getSnapshot();
  commit({ ...s, creator: { ...s.creator, savedReplies: [...s.creator.savedReplies, text] } });
}

export function deleteSavedReply(i: number) {
  const s = getSnapshot();
  commit({ ...s, creator: { ...s.creator, savedReplies: s.creator.savedReplies.filter((_, j) => j !== i) } });
}

/** PRD: the brand pays within 48 h of agreeing, or the deal lapses (the demo triggers it by hand). */
export function lapseDeal(id: string) {
  updateThread(id, (t) => push({ ...t, stage: "cancelled" }, { from: "solo", kind: "system", text: "No funds within 48 h, so the deal lapsed. Nobody was charged and the chat stays open." }, "creator"));
}

/* ───────────── briefs ───────────── */

export type BriefDraft = Omit<Brief, "version" | "by">;

export function sendBrief(id: string, by: "brand" | "creator", draft: BriefDraft) {
  const t = findThread(id);
  const version = t.briefs.length + 1;
  const isCounter = version > 1;
  updateThread(id, (t) =>
    push(
      { ...t, folder: "inbox", stage: "brief", briefs: [...t.briefs, { ...draft, version, by }] },
      { from: by, kind: "brief", briefVersion: version },
      by === "brand" ? "creator" : "brand",
    ),
  );
  whatsapp(
    by === "brand" ? "creator" : "brand",
    t,
    isCounter
      ? `${by === "brand" ? brandOf(t).name : getSnapshot().creator.name.split(" ")[0]} sent a counter: ₹${draft.budget.toLocaleString("en-IN")}`
      : `${brandOf(t).name} sent a brief: ₹${draft.budget.toLocaleString("en-IN")} for ${draft.items.length} deliverables`,
  );
}

export function acceptBrief(id: string, by: "brand" | "creator") {
  const t = findThread(id);
  const b = t.briefs.at(-1)!;
  updateThread(id, (t) =>
    push(
      {
        ...t,
        stage: "agreed",
        agreedAt: now(),
        accepted: t.briefs.length - 1,
        deliverables: b.items.map((it, i) => ({ ...it, id: `${t.id}-d${i + 1}`, status: "todo", drafts: [] })),
      },
      { from: "solo", kind: "system", text: `Both sides accepted brief v${b.version}. ${brandOf(t).name} has 48 h to fund the deal, or it lapses.` },
      by === "brand" ? "creator" : "brand",
    ),
  );
  whatsapp(by === "brand" ? "creator" : "brand", t, `Brief v${b.version} accepted. ${by === "creator" ? "Fund the deal to start." : "Waiting for funds."}`);
}

export function declineBrief(id: string, by: "brand" | "creator") {
  updateThread(id, (t) => push({ ...t, stage: "declined" }, { from: "solo", kind: "system", text: `${by === "brand" ? brandOf(t).name : "Arun"} declined the brief. The chat stays open.` }));
}

/* ───────────── money + work ───────────── */

export function fundDeal(id: string) {
  const t = findThread(id);
  const s = getSnapshot();
  const b = t.briefs[t.accepted!];
  const m = dealMoney(b.budget, s.creator.plan);
  updateThread(id, (t) => push({ ...t, stage: "production" }, { from: "solo", kind: "funded", amount: b.budget }, "creator"));
  whatsapp("creator", t, `₹${m.budget.toLocaleString("en-IN")} secured in escrow for ${brandOf(t).name}. Start creating.`);
}

export function submitDraft(id: string, deliverableId: string, file: string, note: string) {
  const t = findThread(id);
  // first deal with a brand gets a Solo check too (PRD: review first deals and disputes)
  const firstDeal = !getSnapshot().threads.some((x) => x.brandId === t.brandId && x.id !== t.id && x.stage === "paid");
  updateThread(id, (t) => {
    const deliverables = t.deliverables.map((d) =>
      d.id === deliverableId ? { ...d, status: "submitted" as const, drafts: [...d.drafts, { version: d.drafts.length + 1, file, note, at: now() }] } : d,
    );
    const v = deliverables.find((d) => d.id === deliverableId)!.drafts.length;
    return push(
      { ...t, stage: "review", deliverables, adminReview: firstDeal && t.adminReview === "none" ? "queued" : t.adminReview },
      { from: "creator", kind: "draft", deliverableId, draftVersion: v },
      "brand",
    );
  });
  const d = t.deliverables.find((x) => x.id === deliverableId)!;
  whatsapp("brand", t, `Arun submitted the ${d.kind.toLowerCase()} draft. Review it within 72 h.`);
}

function stageFromDeliverables(t: Thread): Stage {
  const ds = t.deliverables;
  if (ds.every((d) => d.status === "live")) return "live";
  if (ds.every((d) => d.status === "approved" || d.status === "live")) return "approved";
  if (ds.some((d) => d.status === "submitted")) return "review";
  return "production";
}

export function reviewDraft(id: string, deliverableId: string, decision: "approve" | "changes", feedback = "", comments: DraftComment[] = []) {
  const t = findThread(id);
  updateThread(id, (t) => {
    const deliverables = t.deliverables.map((d) => {
      if (d.id !== deliverableId) return d;
      const drafts = d.drafts.map((dr, i) => (i === d.drafts.length - 1 ? { ...dr, feedback: feedback || undefined, comments: comments.length ? comments : undefined } : dr));
      return { ...d, status: decision === "approve" ? ("approved" as const) : ("changes" as const), drafts };
    });
    const next = { ...t, deliverables, revisionsUsed: t.revisionsUsed + (decision === "changes" ? 1 : 0) };
    return push({ ...next, stage: stageFromDeliverables(next) }, { from: "brand", kind: "review", deliverableId, text: decision === "approve" ? "approved" : feedback || "Please make a few changes.", comments: decision === "changes" && comments.length ? comments : undefined }, "creator");
  });
  const d = t.deliverables.find((x) => x.id === deliverableId)!;
  whatsapp("creator", t, decision === "approve" ? `${brandOf(t).name} approved your ${d.kind.toLowerCase()}.` : `${brandOf(t).name} asked for changes on your ${d.kind.toLowerCase()}.`);
}

export function markLive(id: string, deliverableId: string, url: string) {
  updateThread(id, (t) => {
    const deliverables = t.deliverables.map((d) => (d.id === deliverableId ? { ...d, status: "live" as const, liveUrl: url } : d));
    const next = { ...t, deliverables };
    const stage = stageFromDeliverables(next);
    let out = push({ ...next, stage }, { from: "creator", kind: "live", deliverableId }, "brand");
    if (stage === "live") out = push(out, { from: "solo", kind: "system", text: "All posts are live. Solo is checking them against the approved drafts, then releases payment." });
    return out;
  });
}

export function releasePayment(id: string) {
  const t = findThread(id);
  const s = getSnapshot();
  const m = dealMoney(t.briefs[t.accepted!].budget, s.creator.plan);
  updateThread(
    id,
    (t) => push({ ...t, stage: "paid", paidAt: now(), adminReview: "passed", result: t.result ?? `${Math.round(t.briefs[t.accepted!].budget / 260)}k views` }, { from: "solo", kind: "paid", amount: m.payout }, "creator"),
    (s) => ({ brands: s.brands.map((b) => (b.id === t.brandId ? { ...b, paidOnTime: b.paidOnTime + 1 } : b)) }),
  );
  whatsapp("creator", t, `₹${m.payout.toLocaleString("en-IN")} sent to your UPI for the ${brandOf(t).name} deal.`);
}

export function passAdminReview(id: string, ok: boolean, note = "") {
  updateThread(id, (t) =>
    push(
      { ...t, adminReview: ok ? "passed" : "none" },
      { from: "solo", kind: "system", text: ok ? "Solo checked the draft against the brief: deliverables, brand mentions and #ad are all in." : `Solo review: ${note || "the draft is missing the #ad disclosure. Please fix before posting."}` },
      "creator",
    ),
  );
}

export function rateDeal(id: string, stars: number) {
  updateThread(id, (t) => ({ ...t, rating: stars }));
}

export function openDispute(id: string, by: "brand" | "creator", reason: string) {
  updateThread(id, (t) => push({ ...t, stage: "dispute", dispute: reason }, { from: "solo", kind: "system", text: `${by === "brand" ? brandOf(t).name : "Arun"} opened a dispute: "${reason}". A Solo admin will decide using the brief and this chat.` }));
}

export function resolveDispute(id: string, outcome: "pay" | "refund") {
  if (outcome === "pay") return releasePayment(id);
  updateThread(id, (t) => push({ ...t, stage: "cancelled" }, { from: "solo", kind: "system", text: "Admin decision: full refund to the brand." }));
}

export function cancelDeal(id: string) {
  updateThread(id, (t) => push({ ...t, stage: "cancelled" }, { from: "solo", kind: "system", text: "Deal cancelled before drafts. The brand gets a full refund." }));
}

/* ───────────── brands ───────────── */

const KNOWN_LOGOS: Record<string, string> = { minimalist: "/demo/brands/minimalist.png" };

export function reachOut(input: { brand: string; email: string; phone: string; note: string; creatorName: string }) {
  const s = getSnapshot();
  const known = s.brands.find((b) => b.name.toLowerCase() === input.brand.trim().toLowerCase());
  const brandId = known?.id ?? uid("b");
  const brands = known
    ? s.brands
    : [
        ...s.brands,
        {
          id: brandId,
          name: input.brand.trim(),
          initials: input.brand.trim().slice(0, 2).replace(/^./, (c) => c.toUpperCase()),
          tint: "#5b5bd6",
          category: "New brand",
          site: input.email.split("@")[1] ?? "",
          handle: "",
          contact: input.email,
          verification: "basic" as const,
          paidOnTime: 0,
          logo: KNOWN_LOGOS[input.brand.trim().toLowerCase()],
        },
      ];
  const verified = (known?.verification ?? "basic") === "verified";
  if (!verified && (known?.chatsThisWeek ?? 0) >= WEEKLY_CHAT_LIMIT) {
    toast.error("Weekly limit reached", { description: `Unverified brands can open ${WEEKLY_CHAT_LIMIT} new chats a week. Get Verified by Solo to remove the limit.` });
    return null;
  }
  const id = uid("t");
  const auto = s.creator.autoReply;
  const t: Thread = {
    id,
    brandId,
    folder: verified ? "inbox" : "requests",
    stage: "chat",
    briefs: [],
    deliverables: [],
    revisionsUsed: 0,
    adminReview: "none",
    unread: { creator: 1, brand: 0 },
    createdAt: now(),
    messages: [
      { id: uid("m"), from: "solo", kind: "system", at: now(), text: `${input.brand.trim()} reached out from your sck.bio page` },
      { id: uid("m"), from: "brand", kind: "text", at: now(), text: input.note.trim() },
      ...(auto.on && auto.text.trim() ? [{ id: uid("m"), from: "creator" as const, kind: "text" as const, at: now() + 1, text: auto.text.trim(), auto: true }] : []),
    ],
  };
  const counted = brands.map((b) => (b.id === brandId ? { ...b, chatsThisWeek: (b.chatsThisWeek ?? 0) + 1 } : b));
  commit({ ...s, brands: counted, threads: [t, ...s.threads], brandSelf: brandId, role: "brand", open: { ...s.open, brand: id } });
  if (verified) whatsapp("creator", t, `New collab request from ${input.brand.trim()} (Verified). Open chat.`);
  return id;
}

/** PRD quality gate: unverified brands can open this many new chats a week. */
export const WEEKLY_CHAT_LIMIT = 5;

export function submitVerification(brandId: string, gst: string) {
  const s = getSnapshot();
  commit({ ...s, brands: s.brands.map((b) => (b.id === brandId ? { ...b, verification: "pending", gst } : b)) });
}

export function decideVerification(brandId: string, approve: boolean) {
  const s = getSnapshot();
  commit({
    ...s,
    brands: s.brands.map((b) => (b.id === brandId ? { ...b, verification: approve ? "verified" : "basic" } : b)),
    // verified brands skip Requests from now on
    threads: approve ? s.threads.map((t) => (t.brandId === brandId ? { ...t, folder: "inbox" } : t)) : s.threads,
  });
}

/* ───────────── tools ───────────── */

export function toggleDmRule(id: string) {
  const s = getSnapshot();
  commit({ ...s, dmRules: s.dmRules.map((r) => (r.id === id ? { ...r, on: !r.on } : r)) });
}

/** Create or update an automation from the builder. */
export function saveDmRule(rule: DmRule) {
  const s = getSnapshot();
  const exists = s.dmRules.some((r) => r.id === rule.id);
  commit({ ...s, dmRules: exists ? s.dmRules.map((r) => (r.id === rule.id ? rule : r)) : [rule, ...s.dmRules] });
}

export const newDmRuleId = () => uid("r");

export function setInstagramConnected(connected: boolean) {
  const s = getSnapshot();
  commit({ ...s, instagram: { ...s.instagram, connected } });
}

export function deleteDmRule(id: string) {
  const s = getSnapshot();
  commit({ ...s, dmRules: s.dmRules.filter((r) => r.id !== id) });
}

/* ───────────── fan sales (Phase 1 tools) ───────────── */

const KIND_WORD: Record<OfferKind, string> = { product: "bought", call: "booked", pdm: "asked", tip: "tipped" };

/** A fan pays on the creator's sck.bio page. Money lands in the same wallet as brand deals. */
export function buyOffer(input: { offerId: string; buyer: string; email: string; amount: number; note?: string; slot?: string }) {
  const s = getSnapshot();
  const offer = s.offers.find((o) => o.id === input.offerId)!;
  const status: OrderStatus = offer.kind === "call" ? "booked" : offer.kind === "pdm" ? "awaiting" : "paid";
  const order: Order = { id: uid("f"), offerId: offer.id, kind: offer.kind, buyer: input.buyer.trim(), email: input.email.trim(), amount: input.amount, at: now(), status, note: input.note?.trim() || undefined, slot: input.slot };
  commit({ ...s, orders: [order, ...s.orders] });
  const first = order.buyer.split(" ")[0] || "A fan";
  toast(`WhatsApp sent to ${s.creator.name.split(" ")[0]}`, {
    description: `${first} ${KIND_WORD[offer.kind]} ${offer.kind === "tip" ? `₹${input.amount}` : `“${offer.title}”`}${offer.kind === "tip" ? "" : ` · ₹${input.amount.toLocaleString("en-IN")}`}`,
    icon: createElement(WhatsAppIcon),
    duration: 3600,
  });
  return order.id;
}

export function answerQuestion(orderId: string, answer: string) {
  const s = getSnapshot();
  const o = s.orders.find((x) => x.id === orderId)!;
  commit({ ...s, orders: s.orders.map((x) => (x.id === orderId ? { ...x, status: "answered" as const, answer } : x)) });
  toast.success(`Answer sent to ${o.buyer}`, { description: `Emailed to ${o.email}. ₹${o.amount} is now yours.` });
}

export function refundOrder(orderId: string) {
  const s = getSnapshot();
  const o = s.orders.find((x) => x.id === orderId)!;
  commit({ ...s, orders: s.orders.map((x) => (x.id === orderId ? { ...x, status: "refunded" as const } : x)) });
  toast(`Refunded ₹${o.amount} to ${o.buyer}`);
}

export function completeCall(orderId: string) {
  const s = getSnapshot();
  commit({ ...s, orders: s.orders.map((x) => (x.id === orderId ? { ...x, status: "done" as const } : x)) });
}

export function updateOffer(id: string, patch: Partial<Offer>) {
  const s = getSnapshot();
  commit({ ...s, offers: s.offers.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
}

export function addOffer(o: Omit<Offer, "id" | "active">) {
  const s = getSnapshot();
  commit({ ...s, offers: [...s.offers, { ...o, id: uid("o"), active: true }] });
}

export function deleteOffer(id: string) {
  const s = getSnapshot();
  commit({ ...s, offers: s.offers.filter((o) => o.id !== id) });
}

/* ───────────── shop page design ───────────── */

/** Active offers in the creator's chosen order; new offers go last. */
export function orderedOffers(s: Pick<SoloState, "offers" | "shop">, includeHidden = false) {
  const pos = (id: string) => {
    const i = s.shop.order.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return s.offers.filter((o) => includeHidden || o.active).sort((a, b) => pos(a.id) - pos(b.id));
}

export function updateShop(patch: Partial<SoloState["shop"]>) {
  const s = getSnapshot();
  commit({ ...s, shop: { ...s.shop, ...patch } });
}

export function moveOffer(id: string, dir: -1 | 1) {
  const s = getSnapshot();
  const ids = orderedOffers(s, true).map((o) => o.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  commit({ ...s, shop: { ...s.shop, order: ids } });
}
