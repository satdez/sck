import type { CSSProperties, ReactNode } from "react";
import type { BackdropSpec } from "@/lib/types";

/**
 * Page backgrounds, reverse-engineered from Luma's event themes:
 *   minimal · quantum (drift / halo / curtain) · ambient (glow / wash) · texture (paper / grain /
 *   linen / halftone / blueprint) · emoji · confetti (dots / streamers / stars) · pattern (8) ·
 *   seasonal (sakura / autumn / snow / fireflies)
 *
 * Rules: colours only come from the page palette (tonal, never rainbow), animation is
 * transform/opacity only, everything pauses under prefers-reduced-motion, and particle
 * positions come from a seeded PRNG so server and client render identically.
 * Styles: globals.css under "backdrops".
 */

const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const SVG = (w: number, h: number, body: string) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`);

export const PATTERNS: Record<string, { size: number; svg: string }> = {
  cross: { size: 28, svg: SVG(28, 28, `<path d='M11 11l6 6M17 11l-6 6' stroke='black' stroke-width='1.4' stroke-linecap='round'/>`) },
  hypnotic: {
    size: 56,
    svg: SVG(56, 56, `<g fill='none' stroke='black' stroke-width='1.2'><circle cx='28' cy='28' r='6'/><circle cx='28' cy='28' r='14'/><circle cx='28' cy='28' r='22'/></g>`),
  },
  plus: { size: 32, svg: SVG(32, 32, `<path d='M16 11v10M11 16h10' stroke='black' stroke-width='1.5' stroke-linecap='round'/>`) },
  polkadot: { size: 26, svg: SVG(26, 26, `<circle cx='6.5' cy='6.5' r='2.4'/><circle cx='19.5' cy='19.5' r='2.4'/>`) },
  wave: { size: 48, svg: SVG(48, 20, `<path d='M0 10Q12 0 24 10T48 10' fill='none' stroke='black' stroke-width='1.5'/>`) },
  zigzag: { size: 24, svg: SVG(24, 14, `<path d='M0 11 6 3l6 8 6-8 6 8' fill='none' stroke='black' stroke-width='1.5' stroke-linejoin='round'/>`) },
  grid: { size: 28, svg: SVG(28, 28, `<path d='M28 .5H.5V28' fill='none' stroke='black'/>`) },
  diagonal: { size: 14, svg: SVG(14, 14, `<path d='M-2 2 2-2M0 14 14 0M12 16l4-4' stroke='black' stroke-width='1.2'/>`) },
};

/* ── deterministic PRNG ── */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── particle shapes (currentColor) ── */
const Dot = () => <svg viewBox="0 0 10 10" className="size-full"><circle cx="5" cy="5" r="5" fill="currentColor" /></svg>;
const Squiggle = () => (
  <svg viewBox="0 0 24 10" className="size-full" fill="none">
    <path d="M1 5c2.5-4 5-4 7.3 0s4.8 4 7.4 0 4.8-4 7.3 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);
const Star = () => (
  <svg viewBox="0 0 20 20" className="size-full"><path d="M10 0c.6 5.6 3.8 9 10 10-6.2 1-9.4 4.4-10 10-.6-5.6-3.8-9-10-10C6.2 9 9.4 5.6 10 0Z" fill="currentColor" /></svg>
);
const Petal = () => (
  <svg viewBox="0 0 20 20" className="size-full"><path d="M10 1c4 3 6 7 4.4 12-1 3-3.2 5-4.4 6-1.2-1-3.4-3-4.4-6C4 8 6 4 10 1Z" fill="currentColor" /><path d="M10 1c-.8 2-.6 3.4 0 4.4.6-1 .8-2.4 0-4.4Z" fill="rgba(255,255,255,.55)" /></svg>
);
const Leaf = () => (
  <svg viewBox="0 0 24 24" className="size-full">
    <path d="M12 2l2 4 4-1-1 4 4 2-4 2 1 4-4-1-2 4-2-4-4 1 1-4-4-2 4-2-1-4 4 1 2-4Z" fill="currentColor" />
    <path d="M12 6v16" stroke="rgba(0,0,0,.2)" strokeWidth="1" />
  </svg>
);

type Mode = "fall" | "float";
interface ParticleSet {
  seed: number;
  count: number;
  mode: Mode;
  size: [number, number];
  dur: [number, number];
  colors: string[];
  shapes: (() => ReactNode)[] | string[];
  className?: string;
}

function Particles({ set, thumb }: { set: ParticleSet; thumb?: boolean }) {
  const r = rng(set.seed);
  const n = thumb ? Math.max(5, Math.round(set.count / 3)) : set.count;
  const items = Array.from({ length: n }, (_, i) => {
    const size = set.size[0] + r() * (set.size[1] - set.size[0]);
    const dur = set.dur[0] + r() * (set.dur[1] - set.dur[0]);
    const shape = set.shapes[Math.floor(r() * set.shapes.length)];
    return {
      i,
      style: {
        left: `${(i / n) * 100 + r() * (100 / n)}%`,
        top: set.mode === "float" ? `${4 + r() * 88}%` : undefined,
        width: thumb ? size * 0.45 : size,
        height: thumb ? size * 0.45 : size,
        color: set.colors[Math.floor(r() * set.colors.length)],
        fontSize: thumb ? size * 0.4 : size * 0.86,
        "--dur": `${dur.toFixed(1)}s`,
        "--delay": `${(-r() * dur).toFixed(1)}s`,
        "--dx": `${Math.round((r() - 0.5) * 160)}px`,
        "--rot": `${Math.round((r() - 0.5) * 720)}deg`,
        "--sway": `${(2.5 + r() * 3).toFixed(1)}s`,
      } as CSSProperties,
      shape,
    };
  });
  return (
    <div className={`bd-viewport bd-particles bd-${set.mode} ${set.className ?? ""}`}>
      {items.map((p) => (
        <span key={p.i} className="bd-p" style={p.style}>
          <span className="bd-p-in">{typeof p.shape === "string" ? p.shape : p.shape()}</span>
        </span>
      ))}
    </div>
  );
}

const PAL = ["var(--p-accent)", "var(--p-t1)", "var(--p-t2)", "var(--p-t3)"];

function particleSet(kind: string, style: string): ParticleSet | null {
  if (kind === "emoji")
    return { seed: 7, count: 13, mode: "float", size: [28, 40], dur: [5, 9], colors: ["inherit"], shapes: [style || "✨"], className: "bd-emoji" };
  if (kind === "confetti") {
    if (style === "dots") return { seed: 11, count: 34, mode: "fall", size: [7, 14], dur: [14, 26], colors: PAL, shapes: [Dot] };
    if (style === "stars") return { seed: 13, count: 26, mode: "fall", size: [9, 18], dur: [16, 28], colors: PAL, shapes: [Star] };
    return { seed: 17, count: 30, mode: "fall", size: [16, 26], dur: [13, 24], colors: PAL, shapes: [Squiggle, Dot, Squiggle] };
  }
  if (kind === "seasonal") {
    if (style === "leaves")
      return { seed: 19, count: 16, mode: "fall", size: [18, 30], dur: [14, 24], colors: ["#c2410c", "#d97706", "#b45309", "#a16207", "#9a3412"], shapes: [Leaf] };
    if (style === "snow")
      return { seed: 23, count: 70, mode: "fall", size: [3, 8], dur: [12, 26], colors: ["var(--bd-snow)"], shapes: [Dot], className: "bd-snow" };
    if (style === "fireflies")
      return { seed: 29, count: 26, mode: "float", size: [4, 7], dur: [4, 8], colors: ["#fde68a", "#fef3c7", "var(--p-accent)"], shapes: [Dot], className: "bd-fireflies" };
    return { seed: 31, count: 22, mode: "fall", size: [12, 18], dur: [14, 24], colors: ["#f6bfd0", "#f2a9c0", "#fbd5e1"], shapes: [Petal], className: "bd-petals" };
  }
  return null;
}

export function Backdrop({ spec, glowSrc, thumb }: { spec: BackdropSpec; glowSrc?: string; thumb?: boolean }) {
  const { kind } = spec;
  const style = spec.style ?? "";
  const parts = particleSet(kind, style);
  const img = glowSrc ? { backgroundImage: `url(${JSON.stringify(glowSrc)})` } : undefined;

  return (
    <div className="bd" aria-hidden data-style={style}>
      {kind === "quantum" && (
        <div className={`bd-viewport bd-q bd-q-${style || "drift"}`}>
          <span className="bd-q-a" />
          <span className="bd-q-b" />
          <span className="bd-q-c" />
        </div>
      )}

      {kind === "ambient" &&
        (style === "wash" ? (
          <div className="bd-viewport">
            {img ? <div className="bd-wash" style={img} /> : <div className="bd-glow-fallback" />}
            <div className="bd-wash-veil" />
          </div>
        ) : (
          <div className="bd-glow">{img ? <div className="bd-glow-img" style={img} /> : <div className="bd-glow-fallback" />}</div>
        ))}

      {kind === "texture" && <div className={`bd-texture bd-tx-${style || "paper"}`} />}

      {kind === "pattern" && (
        <div className="bd-viewport">
          <div className="bd-pattern-glow" />
          <div
            className="bd-pattern"
            style={{ "--bd-mask": PATTERNS[style]?.svg ?? PATTERNS.cross.svg, "--bd-size": `${PATTERNS[style]?.size ?? 28}px` } as CSSProperties}
          />
        </div>
      )}

      {parts && <Particles set={parts} thumb={thumb} />}

      {(spec.grain || kind === "quantum") && <div className="bd-grain" />}
    </div>
  );
}
