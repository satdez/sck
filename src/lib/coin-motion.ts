// One model of a coin toss, shared by the CSS keyframes (scripts/gen-motion-css.mjs) and the favicon frames.
// Real flips have four beats: a small wind-up dip, a flight along a parabola (gravity: fast off the thumb, slow at the
// top, fast again coming down) with a constant spin, then a landing that squashes and hops once before it rests.

export const COIN_MS = 1300;
export const COIN_TURNS = 2;

const WIND = 0.08; // wind-up ends here (share of the whole)
const LAND = 0.8; // flight ends, landing begins

/**
 * Pose of the coin at time T (0..1).
 * turn: rotation about its vertical axis, radians (constant speed in flight)
 * y:    height as a share of the toss; 0 at rest, -1 at the apex, a little positive in the wind-up dip
 * sy:   vertical squash (1 = round)
 */
export function coinPose(T: number): { turn: number; y: number; sy: number } {
  if (T < WIND) {
    const k = Math.sin((Math.PI * T) / WIND);
    return { turn: 0, y: 0.1 * k, sy: 1 - 0.05 * k };
  }
  if (T < LAND) {
    const u = (T - WIND) / (LAND - WIND);
    return { turn: u * Math.PI * 2 * COIN_TURNS, y: -4 * u * (1 - u), sy: 1 };
  }
  const v = (T - LAND) / (1 - LAND);
  const squash = v < 0.35 ? Math.sin((Math.PI * v) / 0.35) : 0;
  const hop = v > 0.25 && v < 0.8 ? Math.sin((Math.PI * (v - 0.25)) / 0.55) : 0;
  return { turn: Math.PI * 2 * COIN_TURNS, y: -0.16 * hop, sy: 1 - 0.1 * squash };
}

/** A damped spring as a CSS linear() easing: 0 -> 1 with a natural overshoot, settled by t = 1. zeta < 1 overshoots. */
export function springEasing(zeta: number, points = 40): string {
  const w0 = 4 / zeta; // ~2% settled at t = 1
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const k = zeta / Math.sqrt(1 - zeta * zeta);
  const out: string[] = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = i === points ? 1 : 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + k * Math.sin(wd * t));
    out.push(String(Math.round(x * 1000) / 1000));
  }
  return `linear(${out.join(", ")})`;
}
