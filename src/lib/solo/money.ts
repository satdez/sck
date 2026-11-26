import type { Creator, Offer, OfferKind, Order, Thread } from "./types";

/** PRD starting proposal: 6% on top for brands, 8% (free) or 5% (Pro) off the creator payout. */
export const BRAND_FEE = 0.06;
export const creatorFeeRate = (plan: Creator["plan"]) => (plan === "pro" ? 0.05 : 0.08);

/** Fan sales: 10% (5% on Pro) like Topmate and Exly's free plans; tips 5%. */
export const fanFeeRate = (kind: OfferKind, plan: Creator["plan"]) => (kind === "tip" ? 0.05 : plan === "pro" ? 0.05 : 0.1);
export const fanNet = (o: Pick<Order, "amount" | "kind">, plan: Creator["plan"]) => o.amount - Math.round(o.amount * fanFeeRate(o.kind, plan));
/** orders that earned money (not refunded, not still waiting on an answer) */
export const settled = (o: Order) => o.status !== "refunded" && o.status !== "awaiting";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function dealMoney(budget: number, plan: Creator["plan"]) {
  const brandFee = Math.round(budget * BRAND_FEE);
  const creatorFee = Math.round(budget * creatorFeeRate(plan));
  return { budget, brandFee, brandPays: budget + brandFee, creatorFee, payout: budget - creatorFee, soloEarns: brandFee + creatorFee };
}

export const agreedBrief = (t: Thread) => (t.accepted !== undefined ? t.briefs[t.accepted] : undefined);
export const latestBrief = (t: Thread) => t.briefs.at(-1);

/*
 * Dates are formatted by hand in IST (no Intl): Node and browsers ship different ICU data
 * ("pm" vs "PM", narrow spaces), which breaks hydration of prerendered pages.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ist = (ms: number) => new Date(ms + 330 * 60_000); // read with getUTC*
const toMs = (v: number | string) => (typeof v === "string" ? Date.parse(v) : v);

export const fmtTime = (v: number | string) => {
  const d = ist(toMs(v));
  const h = d.getUTCHours();
  return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
const dayMonth = (ms: number) => {
  const d = ist(ms);
  return `${d.getUTCDate()} ${MONTHS.at(d.getUTCMonth())}`;
};
/** "4 Jan"; an ISO date (yyyy-mm-dd) is read as that day in IST */
export const fmtDay = (msOrIso: number | string) => dayMonth(typeof msOrIso === "string" ? Date.parse(`${msOrIso.slice(0, 10)}T12:00:00+05:30`) : msOrIso);
/** time for today's messages (demo "today" = 26 Nov 2026), date for older ones */
export const fmtWhen = (ms: number) => (ms < Date.UTC(2026, 10, 25, 18, 30) ? dayMonth(ms) : fmtTime(ms));
/** "Fri, 27 Nov, 6:00 pm" */
export const fmtSlot = (v: number | string) => {
  const ms = toMs(v);
  return `${DAYS.at(ist(ms).getUTCDay())}, ${dayMonth(ms)}, ${fmtTime(ms)}`;
};
export const fmtDue = (ms: number) => `${dayMonth(ms)}, ${fmtTime(ms)}`;
export const offerUnit = (o: Pick<Offer, "kind" | "minutes" | "replyHours">) =>
  o.kind === "call" ? `${o.minutes} min call` : o.kind === "pdm" ? `Reply in ${o.replyHours} h` : o.kind === "tip" ? "Any amount" : "Instant download";
