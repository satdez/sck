"use client";

import { Building2, ChevronUp, Landmark, RotateCcw, SlidersHorizontal, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import { haptic } from "@/lib/haptics";
import { readSolo, resetDemo, setRole, useSolo } from "@/lib/solo/store";
import type { Role } from "@/lib/solo/types";

const ROLES: { role: Role; label: string; hint: string; icon: typeof UserRound }[] = [
  { role: "creator", label: "Creator", hint: "Arun Maini, tech creator", icon: UserRound },
  { role: "brand", label: "Brand", hint: "the brand in the chat", icon: Building2 },
  { role: "admin", label: "Solo admin", hint: "verify, check, pay out", icon: Landmark },
];

const roleFor = (path: string): Role => (path.startsWith("/brand") ? "brand" : path.startsWith("/admin") ? "admin" : "creator");

const homeFor = (role: Role) => {
  if (role === "brand") return "/brand";
  if (role === "admin") return "/admin";
  return readSolo().open.creator ? "/inbox" : "/kit";
};

/**
 * Prototype-only control: one person plays every side of a deal.
 * Switching keeps the open chat, so you can answer your own brief as the other party.
 */
export function RoleSwitch() {
  const brandName = useSolo((s) => s.brands.find((b) => b.id === s.brandSelf)?.name ?? "Brand");
  const [open, setOpen] = useState(false);
  // phones: step aside while scrolling down through content, come back on any scroll up or at the end
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 24;
      if (Math.abs(y - last) < 6) return;
      setTucked(y > last && y > 80 && !atEnd);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const router = useRouter();
  const path = usePathname();
  const role = roleFor(path);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState({ w: 40, h: 40 });
  useEffect(() => {
    const el = btn.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the page you're on decides the role (deep links, back button)
  useEffect(() => {
    if (readSolo().role !== role) setRole(role);
  }, [role]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const current = ROLES.find((r) => r.role === role)!;
  const pick = (r: Role) => {
    setRole(r);
    setOpen(false);
    router.push(homeFor(r));
  };
  const prefs = () => {
    setOpen(false);
    router.push("/preferences");
  };
  const reset = () => {
    resetDemo();
    setOpen(false);
    router.push("/kit");
  };
  const Icon = current.icon;

  // Drag the button anywhere; it snaps to the nearest side at that height (like AssistiveTouch) and stays there.
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  const [fab, setFab] = useState<Fab | null>(null);
  const [dragAt, setDragAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const size = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    size();
    try {
      const saved = JSON.parse(localStorage.getItem(FAB_KEY) ?? "null") as Fab | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only position, read after hydration
      if (saved && (saved.side === "left" || saved.side === "right") && typeof saved.bottom === "number") setFab(saved);
    } catch {}
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, []);
  const margin = vp && vp.w >= 768 ? 20 : 12;
  const minBottom = vp && vp.w >= 768 ? 20 : 72; // clear of the phone tab bar
  // keep room above for the dial: header + gap + dial
  const maxBottom = vp ? Math.max(minBottom, vp.h - 64 - DIAL_LIFT - SIZE - box.h - 8) : minBottom;
  const side: "left" | "right" = fab?.side ?? "right";
  const place = (): React.CSSProperties | undefined => {
    if (dragAt) return { left: dragAt.x, top: dragAt.y, right: "auto", bottom: "auto", transition: "none" };
    if (!fab || !vp) return undefined; // first visit: the CSS corner
    const bottom = Math.min(Math.max(fab.bottom, minBottom), maxBottom);
    return {
      left: fab.side === "left" ? margin : vp.w - margin - box.w,
      top: vp.h - bottom - box.h,
      right: "auto",
      bottom: "auto",
      transition: "left 420ms cubic-bezier(0.22,1.25,0.36,1), top 420ms cubic-bezier(0.22,1.25,0.36,1), translate 300ms, opacity 300ms",
    };
  };

  // One press, three meanings:
  //   tap                      opens or closes the dial (onClick)
  //   drag straight away       moves the button; let go and it snaps to the nearest side
  //   hold ~a quarter second   opens the dial under the thumb; slide and lift on an item to pick it
  const drag = useRef<DialDrag | null>(null);
  const swallowClick = useRef(false);
  const onTriggerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    swallowClick.current = false; // a drag never produces a click, so last gesture's flag must not eat this tap
    const el = ref.current!.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const grab = { x: e.clientX - el.left, y: e.clientY - el.top };
    let mode: "undecided" | "move" | "pick" = open ? "pick" : "undecided";
    const hold = window.setTimeout(() => {
      if (mode !== "undecided") return;
      mode = "pick";
      swallowClick.current = true;
      setOpen(true);
      haptic();
    }, 260);
    const move = (ev: PointerEvent) => {
      const far = Math.hypot(ev.clientX - start.x, ev.clientY - start.y) >= 8;
      if (mode === "undecided" && far) {
        mode = "move";
        swallowClick.current = true;
        window.clearTimeout(hold);
        haptic();
      }
      if (mode === "move") setDragAt({ x: ev.clientX - grab.x, y: ev.clientY - grab.y });
      else if (mode === "pick" && far) drag.current?.move(ev.clientX, ev.clientY);
    };
    const up = (ev: PointerEvent) => {
      window.clearTimeout(hold);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (mode === "move") {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = ev.clientX - grab.x + el.width / 2;
        const next: Fab = { side: cx < w / 2 ? "left" : "right", bottom: Math.round(h - (ev.clientY - grab.y) - el.height) };
        setFab(next);
        setDragAt(null);
        haptic("pick");
        try {
          localStorage.setItem(FAB_KEY, JSON.stringify(next));
        } catch {}
      } else if (mode === "pick" && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) >= 8) {
        drag.current?.up(ev.clientX, ev.clientY);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    // phones: a tiny floating circle above the tab bar; desktop: the "Viewing as" pill
    <div
      ref={ref}
      data-tucked={(tucked && !open) || undefined}
      // a press-and-hold is how you drive the dial: keep the phone's long-press menu and text selection out of it,
      // or the browser takes over the touch (pointercancel) before the thumb starts to slide
      onContextMenu={(e) => e.preventDefault()}
      data-side={side}
      data-dragging={dragAt ? "" : undefined}
      style={{ WebkitTouchCallout: "none", touchAction: "none", ...place() }}
      className="fixed right-3 select-none bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-dragging:z-[60] data-tucked:pointer-events-none data-tucked:translate-x-[calc(100%+16px)] data-tucked:opacity-0 data-tucked:data-[side=left]:-translate-x-[calc(100%+16px)] md:right-5 md:bottom-5 md:data-tucked:pointer-events-auto md:data-tucked:translate-x-0 md:data-tucked:opacity-100 md:data-tucked:data-[side=left]:translate-x-0"
    >
      <AnimatePresence>{open && <Blob w={box.w} h={box.h} side={side} />}</AnimatePresence>
      <AnimatePresence>{open && <Dial role={role} brandName={brandName} onPick={pick} onReset={reset} onPrefs={prefs} dragRef={drag} h={box.h} side={side} />}</AnimatePresence>
      <button
        ref={btn}
        type="button"
        style={{ touchAction: "none" }}
        onPointerDown={onTriggerDown}
        onClick={() => {
          // a drag or a hold already did its job; only a plain tap toggles
          if (swallowClick.current) swallowClick.current = false;
          else setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={`Viewing as ${current.label}. Switch role`}
        className="ui-press relative z-[51] flex size-10 touch-none cursor-grab active:cursor-grabbing items-center justify-center gap-2 rounded-full bg-[#111] text-[13px] font-semibold text-white shadow-[0_10px_24px_-8px_rgb(0_0_0/0.6),0_0_0_1px_rgb(255_255_255/0.1)] md:h-11 md:w-auto md:justify-start md:pr-3.5 md:pl-1.5"
      >
        <span className="grid size-8 place-items-center rounded-full bg-[#96ff43] text-black">
          <Icon className="size-4" />
        </span>
        <span className="hidden md:inline">
          <span className="text-white/55">Viewing as</span> {current.label}
        </span>
        <ChevronUp className={`hidden size-4 text-white/50 transition-transform duration-200 md:block ${open ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}

/* ───────────── the dial ───────────── */

/*
 * One module, not a menu over a button. The dial's disc and the collar round the trigger are joined by a
 * metaball bridge: two curves that leave each circle on its tangent and meet in a smooth waist, so the
 * dial seems to pour out of the button. One SVG, grown from the button's centre, then the dial's
 * icons and text sit on top, crisp.
 */
const DIAL_RIGHT = 6; // the dial overhangs the trigger's right edge by this much
const DIAL_LIFT = 14; // gap between the trigger's top and the dial's bottom
const RING = 6; // dark collar round the trigger
const GROW = { type: "spring", stiffness: 360, damping: 30 } as const;
const FAB_KEY = "solo.switcher.place";
type Fab = { side: "left" | "right"; bottom: number };
const INK = "#0f0f0f";

type P = [number, number];
const at = (c: P, a: number, r: number): P => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const pt = (q: P) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;

/** The bridge between two circles, after Varun Vachhar's metaball construction. `v` sets how far the waist pinches. */
function bridge(c1: P, r1: number, c2: P, r2: number, v = 0.55, handle = 2.4) {
  const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
  if (d <= Math.abs(r1 - r2)) return "";
  const u1 = d < r1 + r2 ? Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d)) : 0;
  const u2 = d < r1 + r2 ? Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d)) : 0;
  const base = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
  const spread = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / d)));
  const a1 = base + u1 + (spread - u1) * v;
  const a2 = base - u1 - (spread - u1) * v;
  const a3 = base + Math.PI - u2 - (Math.PI - u2 - spread) * v;
  const a4 = base - Math.PI + u2 + (Math.PI - u2 - spread) * v;
  const p1 = at(c1, a1, r1), p2 = at(c1, a2, r1), p3 = at(c2, a3, r2), p4 = at(c2, a4, r2);
  const k = Math.min(v * handle, Math.hypot(p1[0] - p3[0], p1[1] - p3[1]) / (r1 + r2)) * Math.min(1, (d * 2) / (r1 + r2));
  const h1 = at(p1, a1 - Math.PI / 2, r1 * k), h2 = at(p2, a2 + Math.PI / 2, r1 * k);
  const h3 = at(p3, a3 + Math.PI / 2, r2 * k), h4 = at(p4, a4 - Math.PI / 2, r2 * k);
  return `M${pt(p1)} C${pt(h1)} ${pt(h3)} ${pt(p3)} A${r2} ${r2} 0 ${d > r1 ? 1 : 0} 0 ${pt(p4)} C${pt(h4)} ${pt(h2)} ${pt(p2)}Z`;
}

function Blob({ w, h, side }: { w: number; h: number; side: "left" | "right" }) {
  const PAD = 30; // room for the shadow
  const W = SIZE + PAD * 2;
  const H = h + DIAL_LIFT + SIZE + PAD * 2;
  // the trigger's right-hand cap and the dial's centre, in the svg's own coordinates
  const cap: P = [W - PAD - h / 2, H - PAD - h / 2];
  const dial: P = [W - PAD + DIAL_RIGHT - SIZE / 2, H - PAD - h - DIAL_LIFT - SIZE / 2];
  const rCap = h / 2 + RING;
  const collar = { x: W - PAD - w - RING, y: H - PAD - h - RING, w: w + RING * 2, h: h + RING * 2 };
  const shape = (
    <>
      <circle cx={dial[0]} cy={dial[1]} r={SIZE / 2} />
      <rect x={collar.x} y={collar.y} width={collar.w} height={collar.h} rx={collar.h / 2} />
      <path d={bridge(dial, SIZE / 2, cap, rCap)} />
    </>
  );
  return (
    // drawn for a button on the right; mirrored as a whole when the button sits on the left
    <div aria-hidden className="pointer-events-none absolute z-40" style={{ [side]: -PAD, bottom: -PAD, width: W, height: H, transform: side === "left" ? "scaleX(-1)" : undefined }}>
    <motion.svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="block overflow-visible"
      style={{ transformOrigin: `${cap[0]}px ${cap[1]}px`, filter: "drop-shadow(0 26px 40px rgb(0 0 0 / 0.55))" }}
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.16 } }}
      transition={GROW}
    >
      <defs>
        {/* the union of the three shapes, used to draw one hairline round the whole module */}
        <mask id="solo-dial-in">
          <rect width={W} height={H} fill="#fff" />
          <g fill="#000">{shape}</g>
        </mask>
      </defs>
      <g fill="rgb(255 255 255 / 0.1)" stroke="rgb(255 255 255 / 0.1)" strokeWidth={2} mask="url(#solo-dial-in)">
        {shape}
      </g>
      <g fill={INK}>{shape}</g>
    </motion.svg>
    </div>
  );
}

const SIZE = 232;
const C = SIZE / 2;
const R_IN = 50;
const R_OUT = C - 2;
const R_ITEM = (R_IN + R_OUT) / 2 + 2;
const SPAN = 30; // half-width of a wedge, degrees

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
};
const f = (n: number) => n.toFixed(2);
/** a ring segment pointing straight up; rotated into place */
const WEDGE = (() => {
  const [x1, y1] = polar(-SPAN, R_OUT);
  const [x2, y2] = polar(SPAN, R_OUT);
  const [x3, y3] = polar(SPAN, R_IN);
  const [x4, y4] = polar(-SPAN, R_IN);
  return `M${f(x1)} ${f(y1)} A${R_OUT} ${R_OUT} 0 0 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${R_IN} ${R_IN} 0 0 0 ${f(x4)} ${f(y4)}Z`;
})();
const ARC = (() => {
  const r = R_OUT - 1.5;
  const [x1, y1] = polar(-SPAN + 6, r);
  const [x2, y2] = polar(SPAN - 6, r);
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}`;
})();

type Slot = { id: Role | "prefs" | "reset"; angle: number; label: string; hint: string; icon: typeof UserRound };
type DialDrag = { move: (x: number, y: number) => void; up: (x: number, y: number) => void };

/** shortest way round: 350 to 10 degrees turns 20, not 340 */
const nearest = (from: number, to: number) => from + ((((to - from) % 360) + 540) % 360) - 180;

function Dial({ role, brandName, onPick, onReset, onPrefs, dragRef, h, side }: { role: Role; brandName: string; onPick: (r: Role) => void; onReset: () => void; onPrefs: () => void; dragRef: MutableRefObject<DialDrag | null>; h: number; side: "left" | "right" }) {
  const slots: Slot[] = [
    ...ROLES.map((r, i) => ({ id: r.role, angle: i * 72, label: r.label, hint: r.role === "brand" ? brandName : r.hint, icon: r.icon })),
    { id: "prefs", angle: 216, label: "Preferences", hint: "theme, colour, type", icon: SlidersHorizontal },
    { id: "reset", angle: 288, label: "Reset demo", hint: "start the story over", icon: RotateCcw },
  ];
  const active = slots.find((x) => x.id === role)!;
  const [hover, setHover] = useState<Slot | null>(null);
  const [aim, setAim] = useState<Slot | null>(null); // the item under the thumb while sliding
  const [thumb, setThumb] = useState<number | null>(null); // the thumb's raw angle, so the wedge follows it
  const root = useRef<HTMLDivElement>(null);
  const aimRef = useRef<Slot | null>(null);
  const dragged = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const turn = useRef(active.angle);
  const focus = aim ?? hover ?? active;
  const spring = { type: "spring", stiffness: 420, damping: 34 } as const;
  // the wedge never spins the long way round
  const target = thumb ?? focus.angle;
  const [wedge, setWedge] = useState(active.angle);
  useEffect(() => {
    turn.current = nearest(turn.current, target);
    setWedge(turn.current);
  }, [target]);

  const activate = (x: Slot) => {
    haptic("pick");
    if (x.id === "reset") onReset();
    else if (x.id === "prefs") onPrefs();
    else onPick(x.id);
  };

  // where is the thumb? an angle round the hub, or inside the hub (lift there to cancel)
  const track = (px: number, py: number) => {
    const r = root.current?.getBoundingClientRect();
    if (!r) return;
    const dx = px - (r.left + r.width / 2);
    const dy = py - (r.top + r.height / 2);
    const inHub = Math.hypot(dx, dy) < R_IN * 0.8;
    const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    const gap = (a: number) => Math.abs(nearest(deg, a) - deg);
    const next = inHub ? null : slots.reduce((a, b) => (gap(b.angle) < gap(a.angle) ? b : a));
    setThumb(inHub ? null : deg);
    if (next?.id !== aimRef.current?.id) {
      aimRef.current = next;
      setAim(next);
      haptic();
    }
  };
  const settle = () => {
    aimRef.current = null;
    setAim(null);
    setThumb(null);
  };
  const release = (px: number, py: number) => {
    track(px, py);
    const picked = aimRef.current;
    settle();
    if (picked) activate(picked);
  };

  // the trigger hands its slide to the dial
  useEffect(() => {
    dragRef.current = { move: track, up: release };
    return () => {
      dragRef.current = null;
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2, rotate: -18 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.4, rotate: -8, transition: { duration: 0.16 } }}
      transition={GROW}
      style={{ touchAction: "none", width: SIZE, height: SIZE, [side]: -DIAL_RIGHT, bottom: `calc(100% + ${DIAL_LIFT}px)`, transformOrigin: `${side === "right" ? SIZE - DIAL_RIGHT - h / 2 : DIAL_RIGHT + h / 2}px ${SIZE + DIAL_LIFT + h / 2}px` }}
      className="absolute z-50 touch-none rounded-full text-white"
      role="menu"
      aria-label="View as"
      onMouseLeave={() => setHover(null)}
      ref={root}
      // a thumb that lands on the dial can slide round it too
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        dragged.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        if (!dragged.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) < 8) return;
        dragged.current = true;
        track(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        start.current = null;
        if (dragged.current) release(e.clientX, e.clientY);
      }}
      onPointerCancel={() => {
        start.current = null;
        settle();
      }}
    >
      {/* hover wedge */}
      <motion.svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 size-full" animate={{ rotate: wedge }} transition={thumb !== null ? { type: "spring", stiffness: 900, damping: 50 } : spring}>
        <path d={WEDGE} fill={aim ? "rgb(255 255 255 / 0.12)" : "rgb(255 255 255 / 0.07)"} />
      </motion.svg>
      {/* the current role's arc */}
      <motion.svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 size-full" initial={{ rotate: active.angle - 40 }} animate={{ rotate: active.angle }} transition={spring}>
        <path d={ARC} fill="none" stroke="#96ff43" strokeWidth={3} strokeLinecap="round" />
      </motion.svg>

      {/* the hub */}
      <div className="pointer-events-none absolute grid place-items-center rounded-full bg-[#1b1b1b] text-center shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" style={{ inset: C - R_IN + 4 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={focus.id}
            initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
            transition={{ duration: 0.16 }}
            className="flex flex-col items-center px-2"
          >
            <span className="text-[13px] leading-tight font-semibold">{focus.label}</span>
            <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-white/45">{focus.hint}</span>
          </motion.span>
        </AnimatePresence>
      </div>

      {/* the slots */}
      {slots.map((x, i) => {
        const [cx, cy] = polar(x.angle, R_ITEM);
        const Ico = x.icon;
        const isActive = x.id === role;
        return (
          <motion.button
            key={x.id}
            type="button"
            role="menuitem"
            aria-label={x.id === "reset" ? "Reset demo data" : `View as ${x.label}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.04 + i * 0.04 }}
            onMouseEnter={() => setHover(x)}
            onFocus={() => setHover(x)}
            onBlur={() => setHover(null)}
            onClick={() => {
              // a slide that ended here already picked it
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              activate(x);
            }}
            className={`absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none transition-[color,scale] focus-visible:bg-white/10 ${aim?.id === x.id ? "scale-110" : ""} ${isActive ? "text-[#96ff43]" : x.id === "reset" ? "text-white/45 hover:text-white" : "text-white/80 hover:text-white"}`}
            style={{ left: cx, top: cy }}
          >
            <Ico className="size-5" strokeWidth={2} />
          </motion.button>
        );
      })}
    </motion.div>
  );
}

