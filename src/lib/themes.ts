import { colorById, derivePalette, readableInk, type Palette } from "./palette";
import type { BackdropKind, BackdropSpec, ButtonStyle, DisplayMode, FontKey, LayoutId, ThemeSettings, TileStyle } from "./types";

export { readableInk, type Palette };

/* ───────── font pairs (display / body) ───────── */

export const FONT_PAIRS: { id: string; name: string; display: FontKey; body: FontKey }[] = [
  { id: "gilroy", name: "Gilroy", display: "gilroy", body: "inter" },
  { id: "serif", name: "Instrument", display: "serif", body: "inter" },
  { id: "grotesk", name: "Grotesk", display: "grotesk", body: "grotesk" },
  { id: "bricolage", name: "Bricolage", display: "bricolage", body: "dmsans" },
  { id: "geist", name: "Geist", display: "geist", body: "geist" },
  { id: "mono", name: "Mono", display: "mono", body: "geist" },
];
export const fontPairById = (id: string) => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];

/* ───────── background themes (Luma-style) and their styles ───────── */

export interface ThemeDef {
  kind: BackdropKind;
  name: string;
  styles: { id: string; name: string }[];
  /** emoji theme: styles are the emoji themselves */
}

export const BACKDROPS: ThemeDef[] = [
  { kind: "minimal", name: "Minimal", styles: [] },
  {
    kind: "quantum",
    name: "Quantum",
    styles: [
      { id: "drift", name: "Drift" },
      { id: "halo", name: "Halo" },
      { id: "curtain", name: "Curtain" },
    ],
  },
  {
    kind: "ambient",
    name: "Ambient",
    styles: [
      { id: "glow", name: "Glow" },
      { id: "wash", name: "Wash" },
    ],
  },
  {
    kind: "texture",
    name: "Texture",
    styles: [
      { id: "paper", name: "Paper" },
      { id: "grain", name: "Grain" },
      { id: "linen", name: "Linen" },
      { id: "halftone", name: "Halftone" },
      { id: "blueprint", name: "Blueprint" },
    ],
  },
  {
    kind: "emoji",
    name: "Emoji",
    styles: ["✨", "🔥", "🌸", "💿", "🎧", "☕", "🍓", "🦋", "🪩", "🌊", "📸", "🎮"].map((e) => ({ id: e, name: e })),
  },
  {
    kind: "confetti",
    name: "Confetti",
    styles: [
      { id: "dots", name: "Dots" },
      { id: "streamers", name: "Streamers" },
      { id: "stars", name: "Stars" },
    ],
  },
  {
    kind: "pattern",
    name: "Pattern",
    styles: [
      { id: "cross", name: "Cross" },
      { id: "hypnotic", name: "Hypnotic" },
      { id: "plus", name: "Plus" },
      { id: "polkadot", name: "Polka" },
      { id: "wave", name: "Wave" },
      { id: "zigzag", name: "Zigzag" },
      { id: "grid", name: "Grid" },
      { id: "diagonal", name: "Lines" },
    ],
  },
  {
    kind: "seasonal",
    name: "Seasonal",
    styles: [
      { id: "sakura", name: "Sakura" },
      { id: "leaves", name: "Autumn" },
      { id: "snow", name: "Snow" },
      { id: "fireflies", name: "Fireflies" },
    ],
  },
];
export const backdropDef = (k: BackdropKind) => BACKDROPS.find((b) => b.kind === k) ?? BACKDROPS[0];
export const defaultStyle = (k: BackdropKind) => backdropDef(k).styles[0]?.id;

/* ───────── layouts ───────── */

export const LAYOUTS: { id: LayoutId; name: string; hint: string }[] = [
  { id: "bento", name: "Bento", hint: "Tiles in a grid" },
  { id: "split", name: "Split", hint: "Profile beside the work" },
  { id: "editorial", name: "Editorial", hint: "Magazine spread" },
  { id: "list", name: "Stack", hint: "Link-in-bio column" },
  { id: "cards", name: "Cards", hint: "Grouped sections" },
];

export const BUTTONS: ButtonStyle[] = ["pill", "rounded", "square", "brutal"];
export const TILES: { id: TileStyle; name: string }[] = [
  { id: "outline", name: "Outline" },
  { id: "glass", name: "Glass" },
  { id: "flat", name: "Flat" },
  { id: "brutal", name: "Brutal" },
];

/* ───────── presets: complete looks, each with its own layout ───────── */

export interface Preset {
  id: string;
  name: string;
  vibe: string;
  layout: LayoutId;
  mode: Exclude<DisplayMode, "auto">;
  color: string;
  backdrop: BackdropSpec;
  font: string;
  tile: TileStyle;
  button: ButtonStyle;
  radius: number;
  lowercaseDisplay?: boolean;
  uppercaseLabels?: boolean;
}

export const PRESETS: Preset[] = [
  {
    id: "studio",
    name: "Studio",
    vibe: "Profile left, work right. Calm and credible.",
    layout: "split",
    mode: "light",
    color: "sand",
    backdrop: { kind: "texture", style: "paper" },
    font: "gilroy",
    tile: "outline",
    button: "rounded",
    radius: 18,
  },
  {
    id: "grid",
    name: "Grid",
    vibe: "Bento tiles on quiet graphite.",
    layout: "bento",
    mode: "light",
    color: "graphite",
    backdrop: { kind: "minimal" },
    font: "geist",
    tile: "outline",
    button: "rounded",
    radius: 20,
  },
  {
    id: "afterglow",
    name: "Afterglow",
    vibe: "Night mode with a slow iris drift.",
    layout: "split",
    mode: "dark",
    color: "iris",
    backdrop: { kind: "quantum", style: "drift", grain: true },
    font: "gilroy",
    tile: "glass",
    button: "pill",
    radius: 22,
  },
  {
    id: "acid",
    name: "Acid",
    vibe: "Loud lime, hard shadows, zero apologies.",
    layout: "bento",
    mode: "light",
    color: "lime",
    backdrop: { kind: "pattern", style: "grid" },
    font: "grotesk",
    tile: "brutal",
    button: "brutal",
    radius: 14,
    lowercaseDisplay: true,
  },
  {
    id: "riso",
    name: "Riso",
    vibe: "Zine print: cobalt ink, halftone, serif italics.",
    layout: "editorial",
    mode: "light",
    color: "riso",
    backdrop: { kind: "texture", style: "halftone" },
    font: "serif",
    tile: "outline",
    button: "square",
    radius: 4,
    uppercaseLabels: true,
  },
  {
    id: "monograph",
    name: "Monograph",
    vibe: "Editorial in the dark. Numbers set large.",
    layout: "editorial",
    mode: "dark",
    color: "graphite",
    backdrop: { kind: "texture", style: "grain" },
    font: "mono",
    tile: "flat",
    button: "square",
    radius: 6,
    uppercaseLabels: true,
  },
  {
    id: "golden",
    name: "Golden Hour",
    vibe: "Your banner, blurred into warm light.",
    layout: "list",
    mode: "light",
    color: "butter",
    backdrop: { kind: "ambient", style: "wash", grain: true },
    font: "bricolage",
    tile: "glass",
    button: "pill",
    radius: 22,
  },
  {
    id: "petal",
    name: "Petal",
    vibe: "Soft plum with drifting sakura.",
    layout: "list",
    mode: "light",
    color: "plum",
    backdrop: { kind: "seasonal", style: "sakura" },
    font: "serif",
    tile: "glass",
    button: "pill",
    radius: 24,
  },
  {
    id: "confetti",
    name: "Party",
    vibe: "Rose cards with confetti in the air.",
    layout: "cards",
    mode: "light",
    color: "rose",
    backdrop: { kind: "confetti", style: "streamers" },
    font: "bricolage",
    tile: "flat",
    button: "pill",
    radius: 24,
  },
  {
    id: "sticker",
    name: "Sticker",
    vibe: "Sky blue, floating emoji, playful cards.",
    layout: "cards",
    mode: "light",
    color: "sky",
    backdrop: { kind: "emoji", style: "✨" },
    font: "gilroy",
    tile: "flat",
    button: "pill",
    radius: 20,
  },
];

/** Old preset ids from the first prototype, so saved drafts and published pages keep working. */
const LEGACY_PRESET: Record<string, string> = { clean: "grid", bubble: "confetti", aurora: "afterglow", sunset: "golden" };

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === (LEGACY_PRESET[id] ?? id)) ?? PRESETS[0];
}

/** Upgrade older backdrop shapes ({kind:"glow"}, {kind:"aurora"}, pattern/emoji fields). */
function normalizeBackdrop(b: unknown): BackdropSpec | undefined {
  if (!b || typeof b !== "object") return undefined;
  const o = b as Record<string, unknown>;
  const map: Record<string, BackdropKind> = { glow: "ambient", aurora: "quantum" };
  const kind = (map[o.kind as string] ?? o.kind) as BackdropKind;
  if (!BACKDROPS.some((d) => d.kind === kind)) return undefined;
  const legacyPattern: Record<string, string> = { dots: "polkadot", waves: "wave" };
  const style =
    (o.style as string | undefined) ??
    (o.pattern ? legacyPattern[o.pattern as string] ?? (o.pattern as string) : undefined) ??
    (o.emoji as string | undefined) ??
    (o.kind === "glow" ? "glow" : undefined);
  return { kind, style, grain: !!o.grain };
}

/** Resolve preset + overrides into the final values the renderer needs. */
export function resolveTheme(t: ThemeSettings, systemDark = false) {
  const preset = getPreset(t.preset);
  const mode = (t.mode as string) === "auto" || t.mode === "dark" || t.mode === "light" ? t.mode : preset.mode;
  const dark = mode === "auto" ? systemDark : mode === "dark";
  const color = colorById(t.color ?? preset.color);
  const pal = (d: boolean) => {
    const p = derivePalette(color, d);
    return t.accent ? { ...p, accent: t.accent, accentInk: readableInk(t.accent) } : p;
  };
  const pair = fontPairById(t.font ?? preset.font);
  const backdrop = normalizeBackdrop(t.backdrop) ?? preset.backdrop;
  return {
    preset,
    color,
    mode,
    dark,
    palette: pal(dark),
    light: pal(false),
    darkPalette: pal(true),
    layout: (LAYOUTS.some((l) => l.id === t.layout) ? t.layout : preset.layout) as LayoutId,
    font: pair,
    displayFont: t.displayFont ?? pair.display,
    bodyFont: t.bodyFont ?? pair.body,
    button: t.button ?? preset.button,
    tile: t.tile ?? preset.tile,
    radius: t.radius ?? preset.radius,
    backdrop: { ...backdrop, style: backdrop.style ?? defaultStyle(backdrop.kind) },
  };
}

export type ResolvedTheme = ReturnType<typeof resolveTheme>;

/** A theme from a preset, with no overrides. */
export const presetTheme = (p: Preset): ThemeSettings => ({ preset: p.id, mode: p.mode, layout: p.layout });
