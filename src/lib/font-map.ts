import type { FontKey } from "./types";

export const FONTS: Record<FontKey, { label: string; css: string }> = {
  geist: { label: "Geist", css: "var(--f-geist), system-ui, sans-serif" },
  gilroy: { label: "Gilroy", css: "var(--f-gilroy), var(--f-inter), system-ui, sans-serif" },
  inter: { label: "Inter", css: "var(--f-inter), system-ui, sans-serif" },
  grotesk: { label: "Space Grotesk", css: "var(--f-grotesk), system-ui, sans-serif" },
  bricolage: { label: "Bricolage", css: "var(--f-bricolage), system-ui, sans-serif" },
  serif: { label: "Instrument Serif", css: "var(--f-serif), Georgia, serif" },
  dmsans: { label: "DM Sans", css: "var(--f-dmsans), system-ui, sans-serif" },
  mono: { label: "Geist Mono", css: "var(--f-mono), ui-monospace, monospace" },
};
