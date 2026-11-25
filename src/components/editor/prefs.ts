/**
 * Editor chrome preferences (the prototyper's knobs). Separate from the creator's
 * page theme: these only restyle the editor around the preview.
 * Pattern borrowed from Play DMS › Settings › Preferences: tones, type, corners,
 * button style, density, motion, shell layout, desk presets and a shareable mix link.
 */
import { readableInk } from "@/lib/themes";

export type UiMode = "light" | "dark" | "system";

export interface UiPrefs {
  mode: UiMode;
  tone: string;
  accent: string | null; // null = the tone's accent
  font: "geist" | "inter" | "gilroy" | "grotesk" | "bricolage" | "dmsans" | "mono" | "system";
  corner: "4" | "6" | "10" | "14";
  button: "flat" | "lip" | "pill";
  density: "comfortable" | "compact";
  motion: "full" | "reduced";
  nav: "tabs" | "rail";
  side: "left" | "right";
  width: "340" | "400" | "460";
  canvas: "dots" | "grid" | "plain";
  frame: "device" | "minimal";
  device: "mobile" | "desktop";
}

export const DEFAULT_PREFS: UiPrefs = {
  mode: "system",
  tone: "solo",
  accent: null,
  font: "inter",
  corner: "10",
  button: "lip",
  density: "comfortable",
  motion: "full",
  nav: "tabs",
  side: "left",
  width: "400",
  canvas: "dots",
  frame: "device",
  device: "mobile",
};

/* ───────── tones ───────── */

export interface Tone {
  id: string;
  label: string;
  hue: number; // neutral tint
  chroma: number; // 0 = pure grey
  accent: { light: string; dark: string };
  contrast?: "high";
}

export const TONES: Tone[] = [
  { id: "solo", label: "Solo", hue: 130, chroma: 0.006, accent: { light: "#96ff43", dark: "#96ff43" } },
  { id: "koyla", label: "Koyla", hue: 0, chroma: 0, accent: { light: "#111111", dark: "#ededed" } },
  { id: "haldi", label: "Haldi", hue: 105, chroma: 0.012, accent: { light: "#f2bd2f", dark: "#f2bd2f" } },
  { id: "tulsi", label: "Tulsi", hue: 150, chroma: 0.012, accent: { light: "#1f7a4a", dark: "#5fcf86" } },
  { id: "baingani", label: "Baingani", hue: 290, chroma: 0.014, accent: { light: "#6d3fd0", dark: "#b994ef" } },
  { id: "gulabi", label: "Gulabi", hue: 30, chroma: 0.012, accent: { light: "#d6395e", dark: "#f07c97" } },
  { id: "neel", label: "Neel", hue: 260, chroma: 0.014, accent: { light: "#2f5fd0", dark: "#7aa2ff" } },
  { id: "kesar", label: "Kesar", hue: 70, chroma: 0.014, accent: { light: "#e0621b", dark: "#ff8a4c" } },
  { id: "mor", label: "Mor", hue: 195, chroma: 0.014, accent: { light: "#0e8a85", dark: "#3cc8c0" } },
  { id: "ujala", label: "Ujala", hue: 0, chroma: 0, accent: { light: "#000000", dark: "#ffffff" }, contrast: "high" },
];

export const TONE_GROUPS: { group: string; ids: string[] }[] = [
  { group: "Classic", ids: ["solo", "koyla"] },
  { group: "WLDD colours", ids: ["haldi", "tulsi", "baingani", "gulabi"] },
  { group: "Fresh", ids: ["neel", "kesar", "mor"] },
  { group: "Vision assistive", ids: ["ujala"] },
];

export const toneById = (id: string) => TONES.find((t) => t.id === id) ?? TONES[0];

const ok = (l: number, c: number, h: number) => `oklch(${l} ${c.toFixed(4)} ${h})`;

/** Neutrals derived from the tone's hue, so adding a tone is one line above. */
export function toneTokens(tone: Tone, dark: boolean, accentOverride: string | null) {
  const c = tone.chroma;
  const h = tone.hue;
  const hc = tone.contrast === "high";
  const accent = accentOverride ?? tone.accent[dark ? "dark" : "light"];
  const t = dark
    ? {
        bg: hc ? "#000000" : ok(0.165, c, h),
        panel: hc ? "#000000" : ok(0.195, c, h),
        sunken: hc ? "#111111" : ok(0.235, c, h),
        line: hc ? "#8a8a8a" : ok(0.29, c, h),
        ink: hc ? "#ffffff" : ok(0.95, c * 0.5, h),
        muted: hc ? "#d4d4d4" : ok(0.68, c, h),
      }
    : {
        bg: hc ? "#ffffff" : ok(0.962, c * 0.6, h),
        panel: hc ? "#ffffff" : ok(0.993, c * 0.3, h),
        sunken: hc ? "#f0f0f0" : ok(0.937, c, h),
        line: hc ? "#5a5a5a" : ok(0.895, c, h),
        ink: hc ? "#000000" : ok(0.2, c, h),
        muted: hc ? "#2b2b2b" : ok(0.5, c * 1.5, h),
      };
  return {
    "--ui-bg": t.bg,
    "--ui-panel": t.panel,
    "--ui-sunken": t.sunken,
    "--ui-line": t.line,
    "--ui-ink": t.ink,
    "--ui-muted": t.muted,
    "--ui-accent": accent,
    "--ui-accent-ink": readableInk(accent),
    "--ui-lip": `color-mix(in oklab, ${accent} 68%, black)`,
  } as Record<string, string>;
}

/* ───────── fonts / options ───────── */

export const UI_FONTS: { id: UiPrefs["font"]; label: string; css: string }[] = [
  { id: "geist", label: "Geist", css: "var(--f-geist), system-ui, sans-serif" },
  { id: "inter", label: "Inter", css: "var(--f-inter), system-ui, sans-serif" },
  { id: "gilroy", label: "Gilroy", css: "var(--f-gilroy), var(--f-inter), system-ui, sans-serif" },
  { id: "grotesk", label: "Space Grotesk", css: "var(--f-grotesk), system-ui, sans-serif" },
  { id: "bricolage", label: "Bricolage", css: "var(--f-bricolage), system-ui, sans-serif" },
  { id: "dmsans", label: "DM Sans", css: "var(--f-dmsans), system-ui, sans-serif" },
  { id: "mono", label: "Geist Mono", css: "var(--f-mono), ui-monospace, monospace" },
  { id: "system", label: "System", css: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
];

export const UI_ACCENTS = ["#96ff43", "#f2bd2f", "#2fa866", "#8e4fd0", "#d6395e", "#2f5fd0", "#e0621b", "#0e8a85", "#18181b"];

/* ───────── desk presets: many prefs at once ───────── */

export const DESK_PRESETS: { id: string; label: string; hint: string; v: Partial<UiPrefs> }[] = [
  {
    id: "solo",
    label: "Solo",
    hint: "Lime lip buttons, roomy, tabs",
    v: { tone: "solo", accent: null, font: "inter", corner: "10", button: "lip", density: "comfortable", nav: "tabs", side: "left", width: "400", canvas: "dots", frame: "device" },
  },
  {
    id: "linear",
    label: "Linear",
    hint: "Indigo, compact, icon rail",
    v: { mode: "dark", tone: "neel", accent: "#5e6ad2", font: "inter", corner: "6", button: "flat", density: "compact", nav: "rail", side: "left", width: "340", canvas: "plain", frame: "minimal" },
  },
  {
    id: "vercel",
    label: "Vercel",
    hint: "Mono, grid canvas, panel right",
    v: { tone: "koyla", accent: null, font: "geist", corner: "6", button: "flat", density: "comfortable", nav: "tabs", side: "right", width: "400", canvas: "grid", frame: "minimal" },
  },
  {
    id: "haldi",
    label: "Haldi",
    hint: "Play DMS default: warm, lip, soft",
    v: { mode: "light", tone: "haldi", accent: null, font: "bricolage", corner: "14", button: "lip", density: "comfortable", nav: "tabs", side: "left", width: "460", canvas: "dots", frame: "device" },
  },
];

export const presetMatch = (p: UiPrefs) =>
  DESK_PRESETS.find((d) => Object.entries(d.v).every(([k, v]) => p[k as keyof UiPrefs] === v));

/* ───────── persistence / share link ───────── */

const KEYS = Object.keys(DEFAULT_PREFS) as (keyof UiPrefs)[];

export function normalizePrefs(raw: Partial<Record<string, unknown>> | null | undefined): UiPrefs {
  const out = { ...DEFAULT_PREFS } as Record<string, unknown>;
  if (!raw) return out as unknown as UiPrefs;
  for (const k of KEYS) {
    const v = raw[k];
    if (v === undefined) continue;
    if (k === "accent") out.accent = typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : null;
    else if (typeof v === "string") out[k] = v;
  }
  if (!TONES.some((t) => t.id === out.tone)) out.tone = DEFAULT_PREFS.tone;
  return out as unknown as UiPrefs;
}

/** Only non-default keys go in the link, prefixed so they never clash with app params. */
export function prefsToSearch(p: UiPrefs) {
  const u = new URLSearchParams();
  for (const k of KEYS) {
    const v = p[k];
    if (v !== DEFAULT_PREFS[k]) u.set(`ui.${k}`, v === null ? "none" : String(v));
  }
  return u.toString();
}

export function prefsFromSearch(search: string): Partial<UiPrefs> | null {
  const u = new URLSearchParams(search);
  const raw: Record<string, unknown> = {};
  let any = false;
  for (const k of KEYS) {
    const v = u.get(`ui.${k}`);
    if (v !== null) {
      raw[k] = v === "none" ? null : v;
      any = true;
    }
  }
  return any ? (raw as Partial<UiPrefs>) : null;
}
