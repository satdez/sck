"use client";

import { useEffect } from "react";
import { toneById, toneTokens, UI_FONTS } from "../editor/prefs";
import { loadUiPrefs } from "../editor/use-ui-prefs";

const ATTRS = ["data-ui-dark", "data-ui-button", "data-ui-density", "data-ui-motion", "data-ui-canvas", "data-ui-corner"] as const;

/**
 * Applies the editor's chrome preferences (tone, corners, font, button style, density,
 * motion) to the whole Solo app, so /kit, /inbox, /brand and /admin look and feel exactly
 * like /editor. Set on <html> so sheets rendered in portals pick them up too.
 * Tweak them in the editor: Preferences (Ctrl/⌘ + ,).
 */
export function ChromePrefs() {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    let keys: string[] = [];

    const apply = () => {
      const p = loadUiPrefs();
      const dark = p.mode === "system" ? mq.matches : p.mode === "dark";
      const r = Number(p.corner);
      const vars: Record<string, string> = {
        ...toneTokens(toneById(p.tone), dark, p.accent),
        "--ui-r": `${r}px`,
        "--ui-r-s": `${Math.max(3, r - 4)}px`,
        "--ui-r-l": `${r + 6}px`,
        "--ui-font": UI_FONTS.find((f) => f.id === p.font)?.css ?? "",
      };
      keys.forEach((k) => root.style.removeProperty(k));
      keys = Object.keys(vars);
      keys.forEach((k) => root.style.setProperty(k, vars[k]));
      root.style.colorScheme = dark ? "dark" : "light";
      root.classList.add("ed");
      root.setAttribute("data-ui-dark", String(dark));
      root.setAttribute("data-ui-button", p.button);
      root.setAttribute("data-ui-density", p.density);
      root.setAttribute("data-ui-motion", p.motion);
      root.setAttribute("data-ui-canvas", p.canvas);
      root.setAttribute("data-ui-corner", p.corner);
    };

    apply();
    const onStorage = (e: StorageEvent) => e.key?.startsWith("sck.ui") && apply();
    mq.addEventListener("change", apply);
    window.addEventListener("storage", onStorage);
    // same-tab changes from the Preferences page
    window.addEventListener("sck-ui-prefs", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("sck-ui-prefs", apply);
      keys.forEach((k) => root.style.removeProperty(k));
      root.style.colorScheme = "";
      root.classList.remove("ed");
      ATTRS.forEach((a) => root.removeAttribute(a));
    };
  }, []);
  return null;
}
