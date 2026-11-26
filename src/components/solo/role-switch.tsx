"use client";

import { Building2, ChevronUp, Landmark, RotateCcw, UserRound } from "lucide-react";
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
  const reset = () => {
    resetDemo();
    setOpen(false);
    router.push("/kit");
  };
  const Icon = current.icon;

  // press the button and slide: the dial opens under the thumb and follows it; lift on an item to pick it
  const drag = useRef<DialDrag | null>(null);
  const pressOpened = useRef(false);
  const onTriggerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    if (!open) {
      setOpen(true);
      pressOpened.current = true;
      haptic();
    }
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 8) return;
      moved = true;
      drag.current?.move(ev.clientX, ev.clientY);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (moved) drag.current?.up(ev.clientX, ev.clientY);
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
      className="fixed right-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-tucked:pointer-events-none data-tucked:translate-x-[calc(100%+16px)] data-tucked:opacity-0 md:right-5 md:bottom-5 md:data-tucked:pointer-events-auto md:data-tucked:translate-x-0 md:data-tucked:opacity-100"
    >
      <AnimatePresence>{open && <Dial role={role} brandName={brandName} onPick={pick} onReset={reset} dragRef={drag} />}</AnimatePresence>
      <button
        type="button"
        onPointerDown={onTriggerDown}
        onClick={() => {
          // the press already opened it; a plain click on an open dial closes it
          if (pressOpened.current) pressOpened.current = false;
          else setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={`Viewing as ${current.label}. Switch role`}
        className="ui-press flex size-10 touch-none items-center justify-center gap-2 rounded-full bg-[#111] text-[13px] font-semibold text-white shadow-[0_10px_24px_-8px_rgb(0_0_0/0.6),0_0_0_1px_rgb(255_255_255/0.1)] md:h-11 md:w-auto md:justify-start md:pr-3.5 md:pl-1.5"
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

const SIZE = 232;
const C = SIZE / 2;
const R_IN = 50;
const R_OUT = C - 2;
const R_ITEM = (R_IN + R_OUT) / 2 + 2;
const SPAN = 32; // half-width of a wedge, degrees

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

type Slot = { id: Role | "reset"; angle: number; label: string; hint: string; icon: typeof UserRound };
type DialDrag = { move: (x: number, y: number) => void; up: (x: number, y: number) => void };

/** shortest way round: 350 to 10 degrees turns 20, not 340 */
const nearest = (from: number, to: number) => from + ((((to - from) % 360) + 540) % 360) - 180;

function Dial({ role, brandName, onPick, onReset, dragRef }: { role: Role; brandName: string; onPick: (r: Role) => void; onReset: () => void; dragRef: MutableRefObject<DialDrag | null> }) {
  const slots: Slot[] = [
    ...ROLES.map((r, i) => ({ id: r.role, angle: [0, 90, 180][i], label: r.label, hint: r.role === "brand" ? brandName : r.hint, icon: r.icon })),
    { id: "reset", angle: 270, label: "Reset demo", hint: "start the story over", icon: RotateCcw },
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
      initial={{ opacity: 0, scale: 0.55, rotate: -24 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.7, rotate: -10, transition: { duration: 0.14 } }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      style={{ width: SIZE, height: SIZE, transformOrigin: "85% 100%" }}
      className="absolute right-[-6px] bottom-[calc(100%+12px)] z-50 touch-none rounded-full bg-[#0f0f0f] text-white shadow-[0_28px_60px_-16px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.08)]"
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

