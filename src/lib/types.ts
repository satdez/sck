/**
 * The Portfolio document is the single source of truth.
 * The editor mutates it, the public page renders it, presets/layouts only
 * change *how* it looks — never what it contains.
 */

export type Platform =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "x"
  | "linkedin"
  | "snapchat"
  | "twitch"
  | "threads"
  | "spotify"
  | "pinterest"
  | "website";

export interface Profile {
  name: string;
  handle: string; // display handle, e.g. "@satish"
  avatar: string;
  banner: { type: "image" | "video"; url: string };
  bio: string; // one-liner
  tags: string[]; // niches
  location: string;
  verified: boolean; // data synced from platforms (future: real OAuth sync)
  available: boolean; // "open to collabs"
}

/* ---------- section items ---------- */

export interface SocialItem {
  platform: Platform;
  handle: string;
  url: string;
  followers: number;
}

export interface InsightItem {
  label: string;
  value: number;
  format: "compact" | "percent" | "plain" | "currency";
  note: string; // e.g. "last 90 days"
}

export interface AudienceItem {
  group: "Top locations" | "Age" | "Gender";
  label: string;
  pct: number;
}

export interface BrandItem {
  brand: string;
  color: string; // monogram/logo tint
  logo: string; // optional logo url
  campaign: string;
  year: string;
  deliverables: string; // "2 Reels · 3 Stories"
  results: string; // comma separated: "2.1M views, 8.4% ER, 3.2k orders"
  note: string;
}

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  brand: string;
}

export interface MomentItem {
  kind: "award" | "milestone" | "press" | "viral";
  title: string;
  detail: string;
  date: string;
  url: string;
}

export interface FeaturedItem {
  platform: Platform;
  url: string; // original post url — used to derive the embed
  thumbnail: string;
  caption: string;
  views: number;
}

export interface LinkItem {
  label: string;
  url: string;
  emoji: string;
}

export interface TimelineItem {
  year: string;
  title: string;
  detail: string;
}

export interface ContactItem {
  email: string;
  /** where to send people when there's no public email (e.g. a YouTube About page) */
  url?: string;
  note: string;
  responseTime: string;
}

export interface SectionItemMap {
  socials: SocialItem;
  insights: InsightItem;
  audience: AudienceItem;
  brands: BrandItem;
  testimonials: TestimonialItem;
  moments: MomentItem;
  featured: FeaturedItem;
  links: LinkItem;
  timeline: TimelineItem;
  contact: ContactItem;
}

export type SectionType = keyof SectionItemMap;

export type Section = {
  [K in SectionType]: {
    id: string;
    type: K;
    title: string;
    visible: boolean;
    items: SectionItemMap[K][];
  };
}[SectionType];

export type SectionOf<K extends SectionType> = Extract<Section, { type: K }>;

/* ---------- theme ---------- */

/** bento = tile grid · split = Luma-style two columns · editorial = magazine · list = link-in-bio · cards = grouped */
export type LayoutId = "bento" | "split" | "editorial" | "list" | "cards";
export type ButtonStyle = "pill" | "rounded" | "square" | "brutal";
export type TileStyle = "outline" | "glass" | "flat" | "brutal";
export type DisplayMode = "light" | "dark" | "auto";
export type FontKey =
  | "gilroy"
  | "geist"
  | "inter"
  | "grotesk"
  | "bricolage"
  | "serif"
  | "dmsans"
  | "mono";

/** Page background families, after Luma's event themes. `style` is the per-theme variant. */
export type BackdropKind = "minimal" | "quantum" | "ambient" | "texture" | "emoji" | "confetti" | "pattern" | "seasonal";
export interface BackdropSpec {
  kind: BackdropKind;
  /** pattern / texture / confetti / seasonal / quantum / ambient variant id, or the emoji for "emoji" */
  style?: string;
  grain?: boolean;
}

export interface ThemeSettings {
  preset: string;
  mode: DisplayMode;
  layout: LayoutId;
  /** overrides: undefined means "use the preset's value" */
  color?: string;
  backdrop?: BackdropSpec;
  font?: string; // font pair id
  accent?: string;
  displayFont?: FontKey;
  bodyFont?: FontKey;
  button?: ButtonStyle;
  tile?: TileStyle;
  radius?: number;
}

export interface Portfolio {
  slug: string; // subdomain: slug.sck.bio
  profile: Profile;
  sections: Section[];
  theme: ThemeSettings;
  publishedAt?: string;
}
