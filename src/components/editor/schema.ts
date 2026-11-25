import {
  AtSign,
  ChartNoAxesColumn,
  Clapperboard,
  Handshake,
  History,
  Link,
  Mail,
  MessageSquareQuote,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SectionItemMap, SectionType } from "@/lib/types";

/**
 * Field schema per section type. The editor renders forms generically from
 * this, so adding a new block = types.ts + one renderer + one entry here.
 */
export type Field =
  | { key: string; label: string; type: "text" | "url" | "textarea" | "color"; placeholder?: string; hint?: string }
  | { key: string; label: string; type: "number"; placeholder?: string; hint?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; hint?: string };

const PLATFORMS = [
  "instagram", "youtube", "tiktok", "x", "linkedin", "snapchat", "twitch", "threads", "spotify", "pinterest", "website",
].map((p) => ({ value: p, label: p === "x" ? "X" : p[0].toUpperCase() + p.slice(1) }));

interface Meta<K extends SectionType> {
  label: string;
  why: string; // why brands care, shown as helper text
  icon: LucideIcon;
  fields: Field[];
  blank: () => SectionItemMap[K];
  summary: (i: SectionItemMap[K]) => string;
  single?: boolean;
}

export const SECTION_META: { [K in SectionType]: Meta<K> } = {
  socials: {
    label: "Social links",
    why: "Where to find you, with live audience size.",
    icon: AtSign,
    fields: [
      { key: "platform", label: "Platform", type: "select", options: PLATFORMS },
      { key: "handle", label: "Handle", type: "text", placeholder: "@you" },
      { key: "url", label: "Profile link", type: "url", placeholder: "https://" },
      { key: "followers", label: "Followers", type: "number" },
    ],
    blank: () => ({ platform: "instagram", handle: "", url: "", followers: 0 }),
    summary: (i) => `${i.platform} · ${i.handle || "untitled"}`,
  },
  insights: {
    label: "Key insights",
    why: "Your best numbers. Brands look at engagement before followers.",
    icon: ChartNoAxesColumn,
    fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Engagement rate" },
      { key: "value", label: "Value", type: "number" },
      {
        key: "format", label: "Show as", type: "select",
        options: [
          { value: "compact", label: "Compact (1.2M)" },
          { value: "percent", label: "Percent (6.8%)" },
          { value: "currency", label: "Currency (₹1.2M)" },
          { value: "plain", label: "Plain (1,234)" },
        ],
      },
      { key: "note", label: "Context", type: "text", placeholder: "last 90 days" },
    ],
    blank: () => ({ label: "", value: 0, format: "compact", note: "" }),
    summary: (i) => i.label || "New insight",
  },
  audience: {
    label: "Audience",
    why: "Who watches you. This is how brands match you to their customer.",
    icon: Users,
    fields: [
      {
        key: "group", label: "Group", type: "select",
        options: ["Top locations", "Age", "Gender"].map((v) => ({ value: v, label: v })),
      },
      { key: "label", label: "Label", type: "text", placeholder: "Mumbai / 18–24 / Women" },
      { key: "pct", label: "Share (%)", type: "number" },
    ],
    blank: () => ({ group: "Top locations", label: "", pct: 0 }),
    summary: (i) => `${i.group}: ${i.label || "?"} ${i.pct}%`,
  },
  brands: {
    label: "Brand collaborations",
    why: "Case studies with outcomes. Results sell more than logos.",
    icon: Handshake,
    fields: [
      { key: "brand", label: "Brand", type: "text" },
      { key: "color", label: "Brand colour", type: "color" },
      { key: "logo", label: "Logo URL (optional)", type: "url" },
      { key: "campaign", label: "Campaign", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "deliverables", label: "Deliverables", type: "text", placeholder: "2 Reels · 3 Stories" },
      { key: "results", label: "Results", type: "textarea", hint: "Separate with a comma and space, e.g. 2.1M views, 8% ER, 4,800 orders" },
      { key: "note", label: "Short note", type: "textarea" },
    ],
    blank: () => ({ brand: "", color: "#6b7280", logo: "", campaign: "", year: "", deliverables: "", results: "", note: "" }),
    summary: (i) => i.brand || "New collab",
  },
  testimonials: {
    label: "Testimonials",
    why: "A line from a brand you worked with builds instant trust.",
    icon: MessageSquareQuote,
    fields: [
      { key: "quote", label: "Quote", type: "textarea" },
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "brand", label: "Brand", type: "text" },
    ],
    blank: () => ({ quote: "", name: "", role: "", brand: "" }),
    summary: (i) => (i.brand ? `${i.name} · ${i.brand}` : "New testimonial"),
  },
  moments: {
    label: "Proud moments",
    why: "Awards, press, milestones and viral hits.",
    icon: Trophy,
    fields: [
      {
        key: "kind", label: "Type", type: "select",
        options: [
          { value: "award", label: "Award" },
          { value: "milestone", label: "Milestone" },
          { value: "press", label: "Press" },
          { value: "viral", label: "Viral post" },
        ],
      },
      { key: "title", label: "Title", type: "text" },
      { key: "detail", label: "Detail", type: "text" },
      { key: "date", label: "When", type: "text", placeholder: "2025" },
      { key: "url", label: "Link (optional)", type: "url" },
    ],
    blank: () => ({ kind: "milestone", title: "", detail: "", date: "", url: "" }),
    summary: (i) => i.title || "New moment",
  },
  featured: {
    label: "Featured work",
    why: "Pinned reels and videos, playable right on your page.",
    icon: Clapperboard,
    fields: [
      { key: "platform", label: "Platform", type: "select", options: PLATFORMS.filter((p) => ["instagram", "youtube", "tiktok"].includes(p.value)) },
      { key: "url", label: "Post link", type: "url", hint: "Paste the public post URL. We embed it." },
      { key: "thumbnail", label: "Cover image URL", type: "url" },
      { key: "caption", label: "Caption", type: "text" },
      { key: "views", label: "Views", type: "number" },
    ],
    blank: () => ({ platform: "instagram", url: "", thumbnail: "", caption: "", views: 0 }),
    summary: (i) => i.caption || "New post",
  },
  links: {
    label: "Custom links",
    why: "Shop, newsletter, latest video and other extra buttons.",
    icon: Link,
    fields: [
      { key: "emoji", label: "Emoji", type: "text" },
      { key: "label", label: "Label", type: "text" },
      { key: "url", label: "URL", type: "url" },
    ],
    blank: () => ({ emoji: "✨", label: "", url: "" }),
    summary: (i) => `${i.emoji} ${i.label || "New link"}`,
  },
  timeline: {
    label: "Content timeline",
    why: "Past work grouped by year.",
    icon: History,
    fields: [
      { key: "year", label: "Year", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "detail", label: "Detail", type: "text" },
    ],
    blank: () => ({ year: String(new Date().getFullYear()), title: "", detail: "" }),
    summary: (i) => `${i.year} · ${i.title || "untitled"}`,
  },
  contact: {
    label: "Work with me",
    why: "How brands reach you. The ‘Work with me’ button scrolls here.",
    icon: Mail,
    single: true,
    fields: [
      { key: "email", label: "Email", type: "text" },
      { key: "url", label: "Or a contact page", type: "url", placeholder: "https://", hint: "Used when you don't list an email" },
      { key: "note", label: "What you’re open to", type: "textarea" },
      { key: "responseTime", label: "Response time", type: "text" },
    ],
    blank: () => ({ email: "", note: "", responseTime: "" }),
    summary: (i) => i.email || i.url || "Add your email",
  },
};
