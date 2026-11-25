"use client";

import { useEffect } from "react";

// The bolt from the Solo mark (src/app/icon.svg). The disc is drawn as an ellipse so it can turn; the bolt is cut clean through it.
const BOLT =
  "M34.3935 10.6074C34.8683 9.812 33.8919 9.0402 33.2119 9.5723L14.7412 24.0351C14.1472 24.4701 14.3755 25.2848 14.9941 25.4473L23.1465 27.5889L16.6084 39.3828C16.131 40.1789 17.1096 40.9512 17.79 40.417L36.3027 25.9219C36.8085 25.5241 36.6461 24.7176 36.0078 24.5478L27.8652 22.3916L34.3935 10.6074Z";

const SIZE = 64; // canvas px; browsers downscale to 16/32 for the tab
const FRAMES = 18;
const FLIP_MS = 900;
const EVERY_MS = 6000;
const FACE = "#96ff43";
const RIM = "#4f9a1c"; // the coin's edge: lime in shade

/** One frame of the coin at flip progress p (0..1): a full turn around its vertical axis, with a small toss. */
function frame(p: number, bolt: Path2D): string {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const turn = (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2) * Math.PI * 2; // easeInOutCubic
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const R = 30; // coin radius
  const T = 7; // coin thickness
  const toss = -2 * Math.sin(p * Math.PI);
  const w = Math.max(Math.abs(cos), 0.001) * R;
  const cx = SIZE / 2;
  const cy = SIZE / 2 + toss;

  // edge: slices of the disc between the two faces
  const off = (T / 2) * sin; // how far each face slides sideways as the coin turns
  ctx.fillStyle = RIM;
  const slices = 8;
  for (let i = 0; i <= slices; i++) {
    const x = cx + off * (-1 + (2 * i) / slices);
    ctx.beginPath();
    ctx.ellipse(x, cy, w, R, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // the face turned toward us, with the bolt cut through everything behind it
  const fx = cx + (cos >= 0 ? off : -off);
  ctx.fillStyle = FACE;
  ctx.beginPath();
  ctx.ellipse(fx, cy, w, R, 0, 0, Math.PI * 2);
  ctx.fill();

  // bolt: same artwork on both faces, scaled with the disc
  const k = (2 * R) / 51; // 51 = viewBox width
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.translate(fx - w, cy - R);
  ctx.scale((2 * w) / 51, k);
  ctx.fill(bolt);
  ctx.restore();
  return c.toDataURL("image/png");
}

/**
 * Makes the tab icon flip like a 3D coin: once shortly after load, then every few seconds while the tab is in view.
 * Tab icons can't run CSS/SVG animation in Chrome, so this swaps pre-drawn frames into the <link rel="icon">.
 * Skipped for reduced-motion. Mount it on app pages only, never on a creator's published page.
 */
export function CoinFavicon() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bolt = new Path2D(BOLT);
    const frames = Array.from({ length: FRAMES }, (_, i) => frame(i / (FRAMES - 1), bolt));
    if (frames.some((f) => !f)) return;

    const links = () => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
    let timers: number[] = [];
    let rest: { el: HTMLLinkElement; href: string; type: string | null }[] = [];

    const stop = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    const restore = () => {
      for (const r of rest) {
        r.el.href = r.href;
        if (r.type) r.el.type = r.type;
        else r.el.removeAttribute("type");
      }
      rest = [];
    };
    const flip = () => {
      if (document.hidden) return;
      const els = links();
      if (!els.length) return;
      rest = els.map((el) => ({ el, href: el.href, type: el.getAttribute("type") }));
      frames.forEach((src, i) => {
        timers.push(
          window.setTimeout(() => {
            for (const { el } of rest) {
              el.type = "image/png";
              el.href = src;
            }
          }, (i * FLIP_MS) / (FRAMES - 1)),
        );
      });
      timers.push(window.setTimeout(restore, FLIP_MS + 60));
    };

    const first = window.setTimeout(flip, 900);
    const loop = window.setInterval(flip, EVERY_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      stop();
      restore();
    };
  }, []);

  return null;
}
