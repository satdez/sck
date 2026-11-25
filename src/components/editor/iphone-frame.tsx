"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FONTS } from "@/lib/font-map";

/**
 * iPhone 17 preview using the supplied bezel artwork (public/iphone-17.png, 450×920 at 1x).
 * The PNG's screen is transparent, measured at x 24…425, y 23…896 → 402×874pt, which is the
 * iPhone 17's screen in points. Display corner radius 62pt (fitted to the artwork's curve).
 * The Dynamic Island is part of the artwork (124×36 at y 37…72), so it's not drawn here.
 *
 * The device scales to fit the canvas; the screen keeps its real 402pt width so the
 * portfolio's container queries behave exactly as on the phone.
 */
const DEVICE_W = 450;
const DEVICE_H = 920;
const SCREEN = { x: 24, y: 23, w: 402, h: 874, r: 62 };
const STATUS_H = 62; // centred on the island (island centre is 31.5pt below the screen top)
const EAR = 139; // screen edge → island edge, each side

type Props = {
  children: ReactNode;
  /** status bar tint, like Safari's theme-color */
  barBg: string;
  barInk: string;
  /** marketing mockup: no scrolling or taps, background motion frozen */
  still?: boolean;
};

export function IPhoneFrame({ children, barBg, barInk, still }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(1, width / (DEVICE_W + 24), height / (DEVICE_H + 8)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={host} className={`flex size-full items-center justify-center ${still ? "is-still pointer-events-none select-none" : ""}`}>
      <div style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }} className="relative shrink-0">
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: DEVICE_W,
            height: DEVICE_H,
            transform: `scale(${scale})`,
            filter: "drop-shadow(0 30px 50px rgb(0 0 0 / 0.45))",
          }}
        >
          {/* display (under the artwork) */}
          <div
            className="absolute overflow-hidden bg-ui-panel"
            style={{ left: SCREEN.x, top: SCREEN.y, width: SCREEN.w, height: SCREEN.h, borderRadius: SCREEN.r }}
          >
            {/* iOS 26 Safari is edge to edge: the page runs under the status bar (the page
                itself is padded by --ios-top, so it still starts below the clock at rest) */}
            <div
              className={`ios-screen no-scrollbar size-full ${still ? "overflow-hidden" : "overflow-y-auto"}`}
              style={{ "--ios-top": `${STATUS_H}px`, "--bd-vh": `${SCREEN.h}px` } as CSSProperties}
            >
              {children}
            </div>

            {/* scroll edge effect ("soft"): a variable blur that fades out, plus a light tint of
                the page colour, so content passing under the clock stays out of its way */}
            <div className="ios-edge pointer-events-none absolute inset-x-0 top-0" style={{ height: STATUS_H + 22 }} aria-hidden>
              <span className="ios-edge-b1" />
              <span className="ios-edge-b2" />
              <span className="ios-edge-b3" />
              <span
                className="absolute inset-0"
                style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${barBg} 72%, transparent) 0%, color-mix(in srgb, ${barBg} 35%, transparent) 55%, transparent 100%)` }}
              />
            </div>

            {/* status bar: each "ear" beside the Dynamic Island centres its content, like iOS */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between"
              style={{ height: STATUS_H, color: barInk }}
            >
              <span
                className="grid place-items-center"
                style={{
                  width: EAR,
                  height: STATUS_H,
                  paddingLeft: 12,
                  // SF Pro Semibold 17/22, -0.41 tracking. SF Pro only ships on Apple devices;
                  // elsewhere Inter is the closest match.
                  fontFamily: `-apple-system, "SF Pro Text", "SF Pro", ${FONTS.inter.css}`,
                  fontSize: 17,
                  lineHeight: "22px",
                  fontWeight: 600,
                  letterSpacing: -0.41,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                9:41
              </span>
              <span className="flex items-center justify-center gap-[6px]" style={{ width: EAR, height: STATUS_H, paddingRight: 12 }}>
                <Signal />
                <Wifi />
                <Battery />
              </span>
            </div>

            {/* home indicator */}
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{ bottom: 8, width: 134, height: 5, background: barInk }}
            />
          </div>

          {/* bezel artwork on top; transparent screen lets the page show through */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/iphone-17.png"
            alt=""
            width={DEVICE_W}
            height={DEVICE_H}
            draggable={false}
            className="pointer-events-none absolute inset-0 select-none"
          />
        </div>
      </div>
    </div>
  );
}

/* Status-bar glyphs, drawn to the iOS UI kit's sizes:
   cellular 17×10.67 · Wi-Fi 15.33×11 · battery 27.33×11.33 (24×10.33 body, 1.33×4 cap). */

function Signal() {
  return (
    <svg width="17" height="10.67" viewBox="0 0 17 10.67" fill="currentColor" aria-hidden>
      <rect x="0" y="6.67" width="3" height="4" rx="1" />
      <rect x="4.67" y="4.67" width="3" height="6" rx="1" />
      <rect x="9.33" y="2.33" width="3" height="8.33" rx="1" />
      <rect x="14" y="0" width="3" height="10.67" rx="1" />
    </svg>
  );
}

function Wifi() {
  return (
    <svg width="15.33" height="11" viewBox="0 0 15.33 11" fill="currentColor" aria-hidden>
      <path d="M7.67 2.33c2.22 0 4.36.85 5.97 2.39a.31.31 0 0 0 .44 0l1.16-1.17a.32.32 0 0 0 0-.46A11 11 0 0 0 7.67 0 11 11 0 0 0 .1 3.09a.32.32 0 0 0 0 .46l1.16 1.17c.12.12.32.12.44 0a8.66 8.66 0 0 1 5.97-2.39Z" />
      <path d="M7.67 6.12c1.22 0 2.4.45 3.3 1.27.13.12.32.12.44 0l1.16-1.17a.32.32 0 0 0 0-.46 7.18 7.18 0 0 0-9.8 0 .32.32 0 0 0 0 .46l1.16 1.17c.12.12.31.12.43 0a4.93 4.93 0 0 1 3.3-1.27Z" />
      <path d="M9.99 8.68a.32.32 0 0 0-.01-.47 3.42 3.42 0 0 0-4.62 0 .32.32 0 0 0-.01.47l2 2.02c.13.12.33.12.45 0l2.19-2.02Z" />
    </svg>
  );
}

function Battery() {
  return (
    <svg width="27.33" height="11.33" viewBox="0 0 27.33 11.33" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="24" height="10.33" rx="3.17" stroke="currentColor" strokeOpacity="0.35" />
      <path d="M26 3.67v4c.8-.34 1.33-1.13 1.33-2s-.53-1.66-1.33-2Z" fill="currentColor" fillOpacity="0.4" />
      <rect x="2" y="2" width="21" height="7.33" rx="1.67" fill="currentColor" />
    </svg>
  );
}
