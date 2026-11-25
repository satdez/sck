"use client";

import { createContext, useContext } from "react";
import type { LayoutId } from "@/lib/types";

/** s = 1×1, w = 2×1, t = 1×2 (tall), l = 2×2, f = full row */
export type TileSize = "s" | "w" | "t" | "l" | "f";
export type SizeSpec = TileSize | Partial<Record<LayoutId, TileSize>> & { bento: TileSize };

const BENTO: Record<TileSize, string> = {
  s: "col-span-1",
  w: "col-span-2",
  t: "col-span-1 row-span-2",
  l: "col-span-2 row-span-2",
  f: "col-span-2 @2xl:col-span-4",
};
const STACK: Record<TileSize, string> = {
  s: "col-span-1",
  t: "col-span-1",
  w: "col-span-2",
  l: "col-span-2",
  f: "col-span-2",
};

export interface LayoutCtx {
  layout: LayoutId;
  /** stagger offset of the current section; tiles add their own item index */
  base: number;
}

export const LayoutContext = createContext<LayoutCtx>({ layout: "bento", base: 0 });
export const useLayout = () => useContext(LayoutContext);

export function resolveSize(spec: SizeSpec, layout: LayoutId): TileSize {
  if (typeof spec === "string") return spec;
  if (layout === "bento") return spec.bento;
  // split + editorial reuse the stacked sizing
  return spec[layout] ?? spec.list ?? "w";
}

export function spanClass(size: TileSize, layout: LayoutId) {
  return layout === "bento" ? BENTO[size] : STACK[size];
}
