"use client";

import { useEffect, useRef } from "react";
import { COIN_MS } from "@/lib/coin-motion";

// The bolt circle from the Solo mark. Same artwork and motion as the bolt "o" in the logo (see .coin in globals.css).
const D =
  "M60.0011 13C69.942 13.0004 77.9999 21.0599 78 31.0007C77.9996 40.9413 69.9418 48.9995 60.0011 49C50.0599 49 42.0004 40.9415 42 31.0007C42.0001 21.0595 50.0597 13 60.0011 13ZM66.2782 20.6373C66.6134 20.0646 65.9242 19.5089 65.4442 19.8921L52.4058 30.3053C51.9865 30.6185 52.1476 31.2051 52.5843 31.3221L58.339 32.864L53.7238 41.3556C53.3868 41.9288 54.0776 42.4849 54.5579 42.1002L67.6259 31.6638C67.983 31.3774 67.8683 30.7967 67.4178 30.6744L61.6699 29.122L66.2782 20.6373Z";

/** An inline "o" that is the Solo bolt coin: is tossed shortly after load, again every 4 to 5 seconds, and on hover or tap. Sized in em so it sits in the type. */
export function CoinO() {
  const el = useRef<HTMLSpanElement>(null);
  const replay = useRef<() => void>(() => {});

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let timer = 0;
    let last = 0;

    // restart the toss: same keyframes, so drop the class, force a reflow, add it back
    const toss = () => {
      last = performance.now();
      node.classList.remove("hov", "cg");
      void node.offsetWidth;
      node.classList.add("hov", "cg"); // .hov = no start delay
    };
    // every 4 to 5 seconds, a little irregular so it never feels like a metronome. Quiet while the tab is hidden.
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!document.hidden) toss();
        schedule();
      }, 4000 + Math.random() * 1000);
    };

    replay.current = () => {
      if (performance.now() - last < COIN_MS) return; // let the current toss finish
      toss();
      schedule(); // and push the next automatic one out
    };
    // the first toss is the load animation (CSS, 700ms delay); the next one follows 4-5s after it ends
    last = performance.now() + 700;
    timer = window.setTimeout(schedule, 700 + COIN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span ref={el} aria-hidden className="hl play cg coin-o" onPointerEnter={() => replay.current()} onClick={() => replay.current()}>
      <svg viewBox="42 13 36 36" className="block size-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="coinOFace" gradientUnits="userSpaceOnUse" x1="42" y1="13" x2="78" y2="49">
            <stop stopColor="#C4FF85" />
            <stop offset="0.5" stopColor="#96FF43" />
            <stop offset="1" stopColor="#74D82A" />
          </linearGradient>
          <linearGradient id="coinORim" gradientUnits="userSpaceOnUse" x1="0" y1="13" x2="0" y2="49">
            <stop stopColor="#6FBE2A" />
            <stop offset="0.22" stopColor="#C2FB7A" />
            <stop offset="0.5" stopColor="#4F9A1C" />
            <stop offset="0.82" stopColor="#37710F" />
            <stop offset="1" stopColor="#5EA224" />
          </linearGradient>
          <radialGradient id="coinOSheen" gradientUnits="userSpaceOnUse" cx="50.6" cy="21.6" r="18.7">
            <stop stopColor="#fff" stopOpacity="0.38" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="coin">
          {[-2, -1, 0, 1, 2].map((k) => (
            <path key={k} className="coin-rim" style={{ ["--k" as string]: k }} d={D} fill="url(#coinORim)" fillRule="evenodd" clipRule="evenodd" />
          ))}
          <path className="coin-face" d={D} fill="url(#coinOFace)" fillRule="evenodd" clipRule="evenodd" />
          <path className="coin-face" d={D} fill="url(#coinOSheen)" fillRule="evenodd" clipRule="evenodd" />
        </g>
      </svg>
    </span>
  );
}
