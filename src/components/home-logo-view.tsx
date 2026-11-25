"use client";

import { useRef } from "react";

/** Plays on load (the .play class is there from the first paint); replays a lighter version on hover or tap. */
export function HomeLogoView({ markup }: { markup: string }) {
  const el = useRef<HTMLDivElement>(null);
  const last = useRef(0);

  const replay = () => {
    const node = el.current;
    const now = performance.now();
    if (!node || now - last.current < 700) return; // let the current one finish
    last.current = now;
    node.classList.remove("hov");
    void node.offsetWidth; // restart the CSS animations
    node.classList.add("hov");
  };

  return (
    <div
      ref={el}
      className="hl play inline-block"
      onPointerEnter={replay}
      onClick={replay}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
