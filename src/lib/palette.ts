/**
 * Colour engine. Every page colour is derived in OKLCH from one hue + chroma, so light and
 * dark pages keep the same perceived contrast whatever the colour. Output is hex/rgba
 * (works everywhere, including the OG image renderer).
 */

/* ── OKLCH → sRGB hex, with chroma reduction to stay in gamut ── */

function oklchToLinear(l: number, c: number, hDeg: number) {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3, M = m_ ** 3, S = s_ ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}
const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);
const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const hex2 = (v: number) => Math.round(Math.min(1, Math.max(0, gamma(v))) * 255).toString(16).padStart(2, "0");

export function oklch(l: number, c: number, h: number): string {
  let cc = c;
  let rgb = oklchToLinear(l, cc, h);
  while (!inGamut(rgb) && cc > 0) {
    cc = Math.max(0, cc - 0.005);
    rgb = oklchToLinear(l, cc, h);
  }
  return `#${rgb.map(hex2).join("")}`;
}

export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = (hex.replace("#", "").match(/.{2}/g) ?? ["0", "0", "0"]).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${a})`;
}

export function readableInk(hex: string): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "#ffffff";
  const [r, g, b] = m.map((x) => parseInt(x, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "#0a0a0a" : "#ffffff";
}

/* ── palettes ── */

export interface Palette {
  bg: string; // page
  bg2: string; // deeper tone of the page colour (gradients, cover fallbacks)
  surface: string; // tiles / cards (translucent, so animated backgrounds read through)
  surface2: string; // fills inside tiles
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  /** three tonal tints of the colour (analogous hues) for animated backgrounds */
  tints: [string, string, string];
}

export interface ColorDef {
  id: string;
  name: string;
  h: number;
  c: number;
  /** accent override: lightness/chroma (light, dark); default is a deep tone of the hue */
  accent?: { l: number; c: number; dl?: number; dc?: number; h?: number };
  /** hand-tuned palettes for colours that aren't a single hue (Riso ink + pink) */
  fixed?: { light: Partial<Palette>; dark: Partial<Palette> };
}

/** Curated colours. Muted and tonal on purpose: the page should flatter the creator's photos. */
export const COLORS: ColorDef[] = [
  { id: "graphite", name: "Graphite", h: 265, c: 0.006, accent: { l: 0.24, c: 0.006, dl: 0.95, dc: 0.004 } },
  { id: "sand", name: "Sand", h: 75, c: 0.028, accent: { l: 0.32, c: 0.03, dl: 0.9, dc: 0.035 } },
  { id: "butter", name: "Butter", h: 92, c: 0.075, accent: { l: 0.5, c: 0.11, h: 75, dl: 0.84, dc: 0.13 } },
  { id: "clay", name: "Clay", h: 45, c: 0.06, accent: { l: 0.52, c: 0.13, dl: 0.78, dc: 0.11 } },
  { id: "rose", name: "Rose", h: 8, c: 0.055, accent: { l: 0.58, c: 0.17, dl: 0.78, dc: 0.12 } },
  { id: "plum", name: "Plum", h: 335, c: 0.05, accent: { l: 0.45, c: 0.13, dl: 0.78, dc: 0.11 } },
  { id: "iris", name: "Iris", h: 285, c: 0.06, accent: { l: 0.5, c: 0.17, dl: 0.78, dc: 0.12 } },
  { id: "sky", name: "Sky", h: 240, c: 0.05, accent: { l: 0.52, c: 0.14, dl: 0.8, dc: 0.1 } },
  { id: "teal", name: "Teal", h: 190, c: 0.045, accent: { l: 0.5, c: 0.09, dl: 0.82, dc: 0.1 } },
  { id: "sage", name: "Sage", h: 150, c: 0.035, accent: { l: 0.42, c: 0.07, dl: 0.82, dc: 0.08 } },
  {
    id: "lime",
    name: "Lime",
    h: 128,
    c: 0.09,
    accent: { l: 0.9, c: 0.22, dl: 0.9, dc: 0.22 },
  },
  {
    id: "riso",
    name: "Riso",
    h: 265,
    c: 0.02,
    fixed: {
      light: {
        bg: "#eef0f3", bg2: "#e2e6ee", surface: "rgba(255,255,255,0.7)", surface2: "#e2e6ee",
        ink: "#1638c9", muted: "#5b6ca8", line: "rgba(22,56,201,0.18)", accent: "#ff4d8d", accentInk: "#ffffff",
        tints: ["#c9d3f6", "#ffc2d6", "#dfe4f2"],
      },
      dark: {
        bg: "#0b1238", bg2: "#111a4a", surface: "rgba(223,229,255,0.06)", surface2: "rgba(223,229,255,0.09)",
        ink: "#dfe5ff", muted: "#8f9bd6", line: "rgba(223,229,255,0.14)", accent: "#ff6fa3", accentInk: "#0b1238",
        tints: ["#1c2a78", "#5b1d4a", "#16205c"],
      },
    },
  },
];

export const colorById = (id: string) => COLORS.find((c) => c.id === id) ?? COLORS[0];

export function derivePalette(color: ColorDef, dark: boolean): Palette {
  const { h, c } = color;
  const a = color.accent ?? { l: 0.5, c: c * 2 };
  const ah = a.h ?? h;
  let p: Palette;
  if (!dark) {
    const ink = oklch(0.23, Math.min(c * 0.6, 0.04), h);
    const accent = oklch(a.l, a.c, ah);
    p = {
      bg: oklch(0.972, c * 0.32, h),
      bg2: oklch(0.925, c * 0.75, h),
      surface: "rgba(255,255,255,0.62)",
      surface2: withAlpha(ink, 0.05),
      ink,
      muted: oklch(0.5, Math.min(c * 0.6, 0.05), h),
      line: withAlpha(ink, 0.1),
      accent,
      accentInk: readableInk(accent),
      tints: [oklch(0.86, c * 1.5, h - 28), oklch(0.82, c * 1.9, h), oklch(0.88, c * 1.3, h + 32)],
    };
  } else {
    const ink = oklch(0.96, Math.min(c * 0.25, 0.02), h);
    const accent = oklch(a.dl ?? 0.8, a.dc ?? c * 1.6, ah);
    p = {
      bg: oklch(0.175, c * 0.3, h),
      bg2: oklch(0.235, c * 0.7, h),
      surface: "rgba(255,255,255,0.055)",
      surface2: "rgba(255,255,255,0.075)",
      ink,
      muted: oklch(0.72, Math.min(c * 0.5, 0.04), h),
      line: "rgba(255,255,255,0.09)",
      accent,
      accentInk: readableInk(accent),
      tints: [oklch(0.34, c * 1.6, h - 28), oklch(0.4, c * 2, h), oklch(0.3, c * 1.4, h + 32)],
    };
  }
  return color.fixed ? { ...p, ...(dark ? color.fixed.dark : color.fixed.light) } : p;
}
