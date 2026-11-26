"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  DEFAULT_PREFS,
  normalizePrefs,
  prefsFromSearch,
  prefsToSearch,
  toneById,
  toneTokens,
  UI_FONTS,
  type UiPrefs,
} from "./prefs";

const KEY = "sck.ui.v1";
const FONT_MIGRATED = "sck.ui.font-inter";

function subscribeDark(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

export function loadUiPrefs(): UiPrefs {
  let stored: Partial<UiPrefs> | null = null;
  try {
    stored = JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    /* storage blocked */
  }
  // One-time migration: Geist used to be the default and got saved with everything else.
  // Inter (with Gilroy headings) is the default now; keep Geist only for the Vercel desk (koyla tone).
  try {
    if (stored?.font === "geist" && stored.tone !== "koyla" && !localStorage.getItem(FONT_MIGRATED)) {
      stored = { ...stored, font: "inter" };
      localStorage.setItem(KEY, JSON.stringify(stored)); // persist now: dev StrictMode calls load() twice
    }
    localStorage.setItem(FONT_MIGRATED, "1");
  } catch {
    /* storage blocked */
  }
  // a shared mix link wins over what's saved, so teammates see exactly the same setup
  const fromLink = prefsFromSearch(window.location.search);
  return normalizePrefs({ ...stored, ...fromLink });
}

export function useUiPrefs() {
  const [prefs, setState] = useState<UiPrefs>(loadUiPrefs);
  const systemDark = useSyncExternalStore(subscribeDark, getDark, () => false);
  const dark = prefs.mode === "system" ? systemDark : prefs.mode === "dark";

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* storage blocked: prefs last for this visit only */
    }
  }, [prefs]);

  const set = useCallback(<K extends keyof UiPrefs>(k: K, v: UiPrefs[K]) => setState((p) => ({ ...p, [k]: v })), []);
  const patch = useCallback((v: Partial<UiPrefs>) => setState((p) => ({ ...p, ...v })), []);
  const reset = useCallback(() => setState(DEFAULT_PREFS), []);

  const shareUrl = useCallback(() => {
    const u = new URL(window.location.href);
    [...u.searchParams.keys()].filter((k) => k.startsWith("ui.")).forEach((k) => u.searchParams.delete(k));
    const q = prefsToSearch(prefs);
    return `${u.origin}${u.pathname}${q ? `?${q}` : ""}`;
  }, [prefs]);

  const rootProps = useMemo(() => {
    const r = Number(prefs.corner);
    const style = {
      ...toneTokens(toneById(prefs.tone), dark, prefs.accent),
      "--ui-r": `${r}px`,
      "--ui-r-s": `${Math.max(3, r - 4)}px`,
      "--ui-r-l": `${r + 6}px`,
      "--ui-font": UI_FONTS.find((f) => f.id === prefs.font)?.css,
      colorScheme: dark ? "dark" : "light",
    } as CSSProperties;
    return {
      style,
      "data-ui-dark": dark ? "true" : "false",
      "data-ui-button": prefs.button,
      "data-ui-density": prefs.density,
      "data-ui-motion": prefs.motion,
      "data-ui-canvas": prefs.canvas,
      "data-ui-corner": prefs.corner,
    };
  }, [prefs, dark]);

  return { prefs, set, patch, reset, dark, rootProps, shareUrl };
}

export type UiPrefsApi = ReturnType<typeof useUiPrefs>;
