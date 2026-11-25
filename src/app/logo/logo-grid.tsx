"use client";

import { useEffect, useRef, useState } from "react";
import { CoinFavicon, FLIP_MS, coinFrame } from "@/components/coin-favicon";

export type LogoVariation = { slug: string; name: string; note: string; svg: string; animatable?: boolean };

// Per-element motion. Every animated piece carries --i (its order), so the
// stagger runs letter by letter. Transforms sit on paths, not on wrapper groups,
// so the arc and bolt transforms stay intact.
const CSS = `
.logo-page { min-height: 100dvh; background: #0e0e0e; color: #f2f2f2; padding: 24px 16px 48px; font-family: var(--f-inter), system-ui, sans-serif; }
.logo-head { max-width: 1100px; margin: 0 auto 24px; }
.logo-head h1 { font-size: 22px; font-weight: 600; margin: 0 0 6px; }
.logo-head p { margin: 0; color: #9a9a9a; font-size: 14px; line-height: 1.5; max-width: 62ch; }
.logo-grid { max-width: 1100px; margin: 0 auto; display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 500px), 1fr)); }
.logo-card { background: #161616; border: 1px solid #262626; border-radius: 16px; padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.logo-meta { display: flex; align-items: baseline; gap: 10px; }
.logo-num { font-size: 12px; color: #7a7a7a; font-variant-numeric: tabular-nums; }
.logo-name { font-size: 15px; font-weight: 600; flex: 1; }
.logo-note { margin: 0; font-size: 13px; color: #9a9a9a; line-height: 1.45; }
.logo-stage { background: #0b0b0b; border-radius: 12px; min-height: 168px; display: grid; place-items: center; padding: 28px 20px; overflow: hidden; }
.logo-stage > svg { width: 100%; max-width: 440px; height: auto; display: block; overflow: visible; }
.logo-actions { display: flex; gap: 8px; }
.logo-btn { appearance: none; border: 1px solid #2c2c2c; background: #1c1c1c; color: #f2f2f2; border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer; text-decoration: none; }
.logo-btn:hover { background: #242424; }
.logo-btn:focus-visible { outline: 2px solid #96FF43; outline-offset: 2px; }

.logo-stage .solo, .logo-stage .ch, .logo-stage .box, .logo-stage .bolt, .logo-stage .emblem { transform-box: fill-box; transform-origin: 50% 50%; }
.logo-stage.play .solo { animation: solo-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: calc(var(--i) * 70ms); }
.logo-stage.play .ch { animation: ch-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: calc(var(--i) * 34ms + 260ms); }
.logo-stage.play .box { animation: box-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 180ms; }
.logo-stage.play .bolt { animation: bolt-in 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) both; animation-delay: 620ms; }
.logo-stage.play .sh { animation: fade-in 0.6s ease-out both; animation-delay: 380ms; }
.logo-stage.play .emblem { animation: bolt-in 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) both; animation-delay: 300ms; }
.logo-stage.play .cursor { animation: blink 1s steps(1) 1s infinite; }

/* 3D block lockups (11, 12): each block is one solid piece (plate, lime face and letters move together).
   CREATOR slides in from the lower right, KIT from the lower left, and both settle with a small overshoot. */
.logo-stage.play .b1 { animation: blk-right 0.85s cubic-bezier(0.2, 0.9, 0.25, 1.1) 280ms both; }
.logo-stage.play .b2 { animation: blk-left 0.75s cubic-bezier(0.2, 0.9, 0.25, 1.1) 760ms both; }
@keyframes blk-right { from { opacity: 0; translate: 150px 100px; } 35% { opacity: 1; } to { opacity: 1; translate: 0 0; } }
@keyframes blk-left { from { opacity: 0; translate: -130px 100px; } 35% { opacity: 1; } to { opacity: 1; translate: 0 0; } }

@keyframes solo-in { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes ch-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes box-in { from { opacity: 0; transform: scaleX(0.6); } to { opacity: 1; transform: none; } }
@keyframes bolt-in { from { opacity: 0; transform: scale(0) rotate(-24deg); } to { opacity: 1; transform: none; } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .logo-stage * { animation: none !important; }
}
`;

function LogoCard({ v }: { v: LogoVariation }) {
  const [run, setRun] = useState(0);
  const playing = run > 0;
  return (
    <article className="logo-card">
      <div className="logo-meta">
        <span className="logo-num">{v.slug.slice(0, 2)}</span>
        <h2 className="logo-name">{v.name}</h2>
      </div>
      <p className="logo-note">{v.note}</p>
      <div
        key={run}
        className={`logo-stage${playing ? " play" : ""}`}
        dangerouslySetInnerHTML={{ __html: v.svg }}
      />
      <div className="logo-actions">
        {v.animatable !== false && (
          <button type="button" className="logo-btn" onClick={() => setRun((r) => r + 1)}>
            {playing ? "Replay" : "Play animation"}
          </button>
        )}
        <a className="logo-btn" href={`/logo/${v.slug}.svg`} download>
          Download SVG
        </a>
      </div>
    </article>
  );
}

const COIN_FRAMES = 48;

/** The tab icon's coin flip, big enough to judge, plus the 32px and 16px sizes a tab really shows. */
function CoinCard() {
  const [run, setRun] = useState(0);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const frames = useRef<string[]>([]);
  const show = (i: number) => frames.current[i] && imgs.current.forEach((el) => el && (el.src = frames.current[i]));

  useEffect(() => {
    frames.current = Array.from({ length: COIN_FRAMES }, (_, i) => coinFrame(i / (COIN_FRAMES - 1), 256));
    show(0);
  }, []);

  useEffect(() => {
    if (!run) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - t0) / FLIP_MS, 1);
      show(Math.round(t * (COIN_FRAMES - 1)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  return (
    <article className="logo-card">
      <div className="logo-meta">
        <span className="logo-num">Tab</span>
        <h2 className="logo-name">Favicon: coin flip</h2>
      </div>
      <p className="logo-note">
        The bolt flips like a 3D coin in the browser tab: once after load, then every few seconds. Shown here large, then at the
        32px and 16px a tab really uses.
      </p>
      <div className="logo-stage" style={{ placeItems: "center" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 28 }}>
          {[160, 32, 16].map((px, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={px} ref={(el) => void (imgs.current[i] = el)} alt="" width={px} height={px} draggable={false} />
          ))}
        </div>
      </div>
      <div className="logo-actions">
        <button type="button" className="logo-btn" onClick={() => setRun((r) => r + 1)}>
          {run ? "Replay" : "Play animation"}
        </button>
      </div>
    </article>
  );
}

export function LogoGrid({ variations }: { variations: LogoVariation[] }) {
  return (
    <main className="logo-page">
      <CoinFavicon />
      <style>{CSS}</style>
      <header className="logo-head">
        <h1>Solo logo exploration</h1>
        <p>
          The shortlist for the Creator Kit lockup. Every letter is its own path so each one can animate; press Play on a card to see it.
        </p>
      </header>
      <section className="logo-grid">
        {variations.map((v) => (
          <LogoCard key={v.slug} v={v} />
        ))}
        <CoinCard />
      </section>
    </main>
  );
}
