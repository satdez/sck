/**
 * Solo prototype domain: creators, brands, chats and the deals that live inside them.
 * Front-end only. Everything is mock data held in the browser (see store.ts).
 */

export type Role = "creator" | "brand" | "admin";

/** Brand trust levels from the PRD: basic (OTP only) → pending review → verified. */
export type Verification = "basic" | "pending" | "verified";

export interface Brand {
  id: string;
  name: string;
  initials: string;
  /** monogram tint */
  tint: string;
  /** logo image; falls back to the monogram */
  logo?: string;
  category: string;
  site: string;
  handle: string;
  contact: string;
  verification: Verification;
  /** deals paid on time; 3+ earns the "Pays on time" label */
  paidOnTime: number;
  /** filled in during verification */
  gst?: string;
  flagged?: boolean;
  /** new chats opened with creators in the last 7 days (unverified brands are capped, see WEEKLY_CHAT_LIMIT) */
  chatsThisWeek?: number;
}

export interface Creator {
  name: string;
  handle: string;
  slug: string;
  niche: string;
  followers: { instagram: number; youtube: number };
  engagement: number;
  plan: "free" | "pro";
  payoutTo: string;
  avatar: string;
  /** ID checked: needed for payouts, shown as "Verified creator" on the page */
  idVerified: boolean;
  /** sent once, automatically, when a brand opens a new chat */
  autoReply: { on: boolean; text: string };
  savedReplies: string[];
}

/**
 * Deal lifecycle (PRD "Collaboration lifecycle").
 * chat → brief → agreed → production → review → approved → live → paid
 * exits: declined · cancelled · dispute
 */
export type Stage =
  | "chat"
  | "brief"
  | "agreed"
  | "production"
  | "review"
  | "approved"
  | "live"
  | "paid"
  | "declined"
  | "cancelled"
  | "dispute";

export type DeliverablePlatform = "instagram" | "youtube";

export interface BriefItem {
  platform: DeliverablePlatform;
  kind: string; // "Reel", "Stories", "Integration"
  detail: string; // "45 to 60 s"
}

export interface Brief {
  version: number;
  by: "brand" | "creator";
  title: string;
  items: BriefItem[];
  keyMessages: string[];
  dos: string[];
  usage: string;
  draftDue: string; // ISO date
  liveDate: string; // ISO date
  budget: number; // INR
  product: boolean;
  note?: string;
}

export type DraftStatus = "todo" | "submitted" | "changes" | "approved" | "live";

export interface Draft {
  version: number;
  file: string;
  note?: string;
  at: number;
  feedback?: string;
  /** brand comments pinned to a moment in the video, e.g. { at: "0:12", text: "show the price" } */
  comments?: DraftComment[];
}

export interface DraftComment {
  at: string;
  text: string;
}

export interface Deliverable extends BriefItem {
  id: string;
  status: DraftStatus;
  drafts: Draft[];
  liveUrl?: string;
}

export type MessageKind = "text" | "brief" | "funded" | "draft" | "review" | "live" | "paid" | "system";

export interface Message {
  id: string;
  from: "brand" | "creator" | "solo";
  at: number;
  kind: MessageKind;
  text?: string;
  briefVersion?: number;
  deliverableId?: string;
  draftVersion?: number;
  amount?: number;
  /** timestamped draft comments carried by a "changes" review */
  comments?: DraftComment[];
  /** an automatic reply (creator auto-reply) */
  auto?: boolean;
}

export interface Thread {
  id: string;
  brandId: string;
  /** unverified brands land in Requests until the creator accepts */
  folder: "inbox" | "requests";
  stage: Stage;
  briefs: Brief[];
  /** index into briefs that both sides accepted */
  accepted?: number;
  deliverables: Deliverable[];
  messages: Message[];
  revisionsUsed: number;
  /** a Solo reviewer checks drafts on first deals or when asked */
  adminReview: "none" | "queued" | "passed";
  unread: { creator: number; brand: number };
  createdAt: number;
  paidAt?: number;
  /** when both sides accepted; the brand has 48 h from here to fund */
  agreedAt?: number;
  /** creator controls */
  muted?: boolean;
  blocked?: boolean;
  /** headline result shown as a case study on the creator's page, e.g. "310k views" */
  result?: string;
  rating?: number;
  dispute?: string;
}

export type DmTrigger = "comment" | "story" | "dm" | "live";

/** What the automation finally hands over: a plain link, a store product (pay in the DM), or a brand deal's tracked link. */
export type DmDeliver =
  | { kind: "link"; url: string; label: string }
  | { kind: "product"; offerId: string }
  | { kind: "deal"; threadId: string; url: string; label: string };

export interface DmStats {
  sent: number;
  /** tapped the button / link in the DM */
  tapped: number;
  follows: number;
  emails: number;
  sales: number;
  /** INR from sales (product) or attributed to the deal */
  revenue: number;
}

export interface DmRule {
  id: string;
  name: string;
  trigger: DmTrigger;
  /** comment trigger: an Instagram post id, "any" for every post, or "next" for the next one published */
  postId: string;
  /** empty with anyWord=true means every comment counts */
  keywords: string[];
  anyWord: boolean;
  /** Pro: typo and Hinglish tolerant matching */
  smartMatch: boolean;
  /** comment trigger: public replies under the comment, rotated */
  publicReply: { on: boolean; texts: string[] };
  /** the first DM, with a button the follower taps to get the goods */
  opener: { text: string; button: string };
  followGate: boolean;
  collectEmail: boolean;
  message: string;
  deliver: DmDeliver;
  on: boolean;
  /** kept for the Kit home tile */
  sent: number;
  stats: DmStats;
}

/** A post or reel on the connected Instagram account (mocked). */
export interface IgPost {
  id: string;
  kind: "reel" | "post";
  image: string;
  caption: string;
  comments: number;
  ago: string;
}

/* ───────────── selling to fans (Phase 1 tools) ───────────── */

export type OfferKind = "product" | "call" | "pdm" | "tip";

export interface Offer {
  id: string;
  kind: OfferKind;
  title: string;
  blurb: string;
  /** INR; for tips this is the minimum */
  price: number;
  active: boolean;
  emoji: string;
  /** optional cover image (data URL or path); falls back to the emoji */
  image?: string;
  /** product: the file buyers get */
  file?: string;
  /** call: length in minutes */
  minutes?: number;
  /** priority DM: reply promise in hours */
  replyHours?: number;
}

export type OrderStatus = "paid" | "booked" | "done" | "awaiting" | "answered" | "refunded";

export interface Order {
  id: string;
  offerId: string;
  kind: OfferKind;
  buyer: string;
  email: string;
  /** buyer photo, when we have one */
  avatar?: string;
  amount: number;
  at: number;
  status: OrderStatus;
  /** pdm question, call topic or tip note */
  note?: string;
  answer?: string;
  /** call slot, ISO date-time in IST */
  slot?: string;
}

/** The creator's shop page at name.sck.bio/shop, designed in the Store tab. */
export type ShopLayout = "spotlight" | "grid" | "list";

export interface ShopDesign {
  layout: ShopLayout;
  headline: string;
  intro: string;
  /** offer shown big at the top in the spotlight layout */
  featured: string | null;
  /** offer ids in display order */
  order: string[];
  /** a small shop preview on the main sck.bio page */
  homePreview: boolean;
}

export interface SoloState {
  v: number;
  role: Role;
  creator: Creator;
  brands: Brand[];
  threads: Thread[];
  /** which brand "you" are when viewing as a brand */
  brandSelf: string;
  /** open chat per role, so switching roles keeps your place */
  open: { creator: string | null; brand: string | null };
  dmRules: DmRule[];
  instagram: { connected: boolean; posts: IgPost[] };
  appNudgeSeen: boolean;
  offers: Offer[];
  orders: Order[];
  shop: ShopDesign;
}
