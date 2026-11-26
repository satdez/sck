import { fmtDay } from "./money";
import type { Stage, Thread } from "./types";

export type Tone = "neutral" | "accent" | "good" | "warn" | "bad";

/** The happy path, in order, for progress rails. */
export const RAIL: { key: Stage; label: string }[] = [
  { key: "brief", label: "Brief" },
  { key: "agreed", label: "Agreed" },
  { key: "production", label: "Funded" },
  { key: "review", label: "Drafts" },
  { key: "approved", label: "Approved" },
  { key: "live", label: "Live" },
  { key: "paid", label: "Paid" },
];

export function railIndex(stage: Stage) {
  if (stage === "chat") return -1;
  const i = RAIL.findIndex((r) => r.key === stage);
  return i === -1 ? -1 : i;
}

export const STAGE_LABEL: Record<Stage, string> = {
  chat: "Chatting",
  brief: "Brief",
  agreed: "Awaiting funds",
  production: "In production",
  review: "Draft review",
  approved: "Ready to post",
  live: "Live · checking",
  paid: "Paid",
  declined: "Declined",
  cancelled: "Cancelled",
  dispute: "Dispute",
};

export const STAGE_TONE: Record<Stage, Tone> = {
  chat: "neutral",
  brief: "accent",
  agreed: "warn",
  production: "accent",
  review: "warn",
  approved: "accent",
  live: "accent",
  paid: "good",
  declined: "neutral",
  cancelled: "neutral",
  dispute: "bad",
};

/** One line saying what happens next and whether it's on you. */
export function nextStep(t: Thread, role: "creator" | "brand", names: { brand: string; creator: string }): { text: string; yours: boolean } {
  const other = role === "creator" ? names.brand : names.creator;
  const last = t.briefs.at(-1);
  const brief = t.accepted !== undefined ? t.briefs[t.accepted] : last;
  switch (t.stage) {
    case "chat": {
      if (role === "creator" && t.folder === "requests") return { text: "New request. Reply to accept it.", yours: true };
      const lastSpoke = t.messages.filter((m) => m.from !== "solo").at(-1)?.from;
      if (role === "brand") return lastSpoke === "creator" ? { text: `${other} replied. Send a brief when you're ready.`, yours: true } : { text: `Waiting for ${other} to reply. You can send a brief any time.`, yours: false };
      return lastSpoke === "brand" ? { text: `${other} is waiting for your reply.`, yours: true } : { text: `Waiting for ${other}.`, yours: false };
    }
    case "brief":
      return last?.by === role ? { text: `Waiting for ${other} to respond to v${last.version}.`, yours: false } : { text: `Respond to ${other}'s brief v${last?.version}.`, yours: true };
    case "agreed":
      return role === "brand" ? { text: "Fund the deal to start production.", yours: true } : { text: `Waiting for ${other} to fund the deal.`, yours: false };
    case "production":
      return role === "creator" ? { text: `Submit drafts by ${brief ? fmtDay(brief.draftDue) : "the due date"}.`, yours: true } : { text: `${other} is creating. Drafts due ${brief ? fmtDay(brief.draftDue) : "soon"}.`, yours: false };
    case "review": {
      const todo = t.deliverables.some((d) => d.status === "todo" || d.status === "changes");
      const toReview = t.deliverables.some((d) => d.status === "submitted");
      if (role === "brand") return toReview ? { text: "Review the drafts within 72 h.", yours: true } : { text: `${other} is revising.`, yours: false };
      return todo ? { text: "Finish the remaining drafts.", yours: true } : { text: `Waiting for ${other} to review.`, yours: false };
    }
    case "approved":
      return role === "creator" ? { text: `Post on ${brief ? fmtDay(brief.liveDate) : "the agreed date"} and paste the links.`, yours: true } : { text: `${other} posts on ${brief ? fmtDay(brief.liveDate) : "the agreed date"}.`, yours: false };
    case "live":
      return { text: "Solo is checking the posts. Payment is released next.", yours: false };
    case "paid":
      return { text: "Deal complete.", yours: false };
    case "declined":
      return { text: "Declined. The chat stays open.", yours: false };
    case "cancelled":
      return { text: "Cancelled and refunded.", yours: false };
    case "dispute":
      return { text: "A Solo admin is reviewing the dispute.", yours: false };
  }
}
