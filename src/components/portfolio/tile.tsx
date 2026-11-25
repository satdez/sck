"use client";

import type { CSSProperties, ReactNode } from "react";
import { resolveSize, spanClass, useLayout, type SizeSpec } from "./layout-context";

interface TileProps {
  size: SizeSpec;
  href?: string;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  /** bento only: explicit row span for content-heavy tiles */
  rows?: number;
  label?: string;
  /** position within its section, drives the entrance stagger */
  index?: number;
  children: ReactNode;
}

export function Tile({ size, href, onClick, className = "", style, rows, label, index = 0, children }: TileProps) {
  const { layout, base } = useLayout();
  const i = base + index;
  const s = resolveSize(size, layout);
  const cls = `tile enter ${spanClass(s, layout)} ${className}`;
  const dataSize = { "data-size": s };
  const st = {
    ...style,
    ["--i" as string]: i,
    ...(rows && layout === "bento" ? { gridRow: `span ${rows} / span ${rows}` } : null),
  } as CSSProperties;

  if (href) {
    const external = /^https?:/.test(href);
    return (
      <a
        href={href}
        className={cls}
        {...dataSize}
        style={st}
        aria-label={label}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      >
        {children}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} text-left`} style={st} {...dataSize} aria-label={label}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={st} {...dataSize}>
      {children}
    </div>
  );
}
