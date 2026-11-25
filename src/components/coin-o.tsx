"use client";

import { useRef } from "react";

// The bolt circle from the Solo mark. Same artwork and motion as the bolt "o" in the logo (see .coin in globals.css).
const D =
  "M60.0011 13C69.942 13.0004 77.9999 21.0599 78 31.0007C77.9996 40.9413 69.9418 48.9995 60.0011 49C50.0599 49 42.0004 40.9415 42 31.0007C42.0001 21.0595 50.0597 13 60.0011 13ZM66.2782 20.6373C66.6134 20.0646 65.9242 19.5089 65.4442 19.8921L52.4058 30.3053C51.9865 30.6185 52.1476 31.2051 52.5843 31.3221L58.339 32.864L53.7238 41.3556C53.3868 41.9288 54.0776 42.4849 54.5579 42.1002L67.6259 31.6638C67.983 31.3774 67.8683 30.7967 67.4178 30.6744L61.6699 29.122L66.2782 20.6373Z";

/** An inline "o" that is the Solo bolt coin: flips once on load, and again on hover or tap. Sized in em so it sits in the type. */
export function CoinO() {
  const el = useRef<HTMLSpanElement>(null);
  const last = useRef(0);

  const replay = () => {
    const node = el.current;
    const now = performance.now();
    if (!node || now - last.current < 900) return;
    last.current = now;
    node.classList.remove("hov");
    void node.offsetWidth; // restart the CSS animations
    node.classList.add("hov");
  };

  return (
    <span ref={el} aria-hidden className="hl play coin-o" onPointerEnter={replay} onClick={replay}>
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
