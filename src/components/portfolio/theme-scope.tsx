"use client";

import { useId, type ReactNode } from "react";
import { FONTS } from "@/lib/font-map";
import type { Palette } from "@/lib/palette";
import { resolveTheme } from "@/lib/themes";
import type { ThemeSettings } from "@/lib/types";
import { Backdrop } from "./backdrop";

const NOISE = (rgb: string, a: number) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${rgb}  0 0 0 0 ${rgb}  0 0 0 0 ${rgb}  0 0 0 ${a} 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

/** Palette + the few mode-dependent backdrop knobs, as one CSS declaration block. */
function vars(p: Palette, dark: boolean) {
  const v: Record<string, string> = {
    "--p-bg": p.bg,
    "--p-bg2": p.bg2,
    "--p-surface": p.surface,
    "--p-surface2": p.surface2,
    "--p-ink": p.ink,
    "--p-muted": p.muted,
    "--p-line": p.line,
    "--p-accent": p.accent,
    "--p-accent-ink": p.accentInk,
    "--p-t1": p.tints[0],
    "--p-t2": p.tints[1],
    "--p-t3": p.tints[2],
    "--bd-op": dark ? "0.13" : "0.1",
    "--bd-grain-op": dark ? "0.1" : "0.22",
    "--bd-grain-blend": dark ? "screen" : "multiply",
    "--bd-grain-img": NOISE(dark ? "1" : "0", 0.55),
    "--bd-glow-op": dark ? "0.55" : "0.6",
    "--bd-glow-filter": dark ? "blur(64px) saturate(1.5) brightness(0.8)" : "blur(64px) saturate(1.9) brightness(1.35)",
    "--bd-snow": dark ? "rgba(255,255,255,0.85)" : "rgba(120,140,170,0.45)",
    "color-scheme": dark ? "dark" : "light",
  };
  return Object.entries(v)
    .map(([k, val]) => `${k}:${val}`)
    .join(";");
}

/**
 * Turns ThemeSettings into scoped CSS variables + data attributes on one wrapper.
 * Variables are emitted as a scoped <style> (not inline) so "Auto" can switch with
 * prefers-color-scheme in pure CSS — no flash, no JS.
 */
export function ThemeScope({
  theme,
  className = "",
  glowSrc,
  thumb,
  children,
}: {
  theme: ThemeSettings;
  className?: string;
  /** image the ambient backdrop blurs (the banner, or the avatar for video banners) */
  glowSrc?: string;
  /** small editor swatch: fewer particles */
  thumb?: boolean;
  children: ReactNode;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const r = resolveTheme(theme);
  const sel = `.portfolio[data-pid="${id}"]`;
  const css =
    r.mode === "auto"
      ? `${sel}{${vars(r.light, false)}}@media (prefers-color-scheme: dark){${sel}{${vars(r.darkPalette, true)}}}`
      : `${sel}{${vars(r.palette, r.dark)}}`;

  return (
    <div
      className={`portfolio @container ${className}`}
      data-pid={id}
      style={{
        ["--p-radius" as string]: `${r.radius}px`,
        ["--p-display" as string]: FONTS[r.displayFont].css,
        ["--p-body" as string]: FONTS[r.bodyFont].css,
      }}
      data-tile={r.tile}
      data-backdrop={r.backdrop.kind}
      data-button={r.button}
      data-layout={r.layout}
      data-mode={r.mode}
      data-lower-display={r.preset.lowercaseDisplay ? "true" : undefined}
      data-upper-labels={r.preset.uppercaseLabels ? "true" : undefined}
    >
      <style>{css}</style>
      <Backdrop spec={r.backdrop} glowSrc={glowSrc} thumb={thumb} />
      {children}
    </div>
  );
}
