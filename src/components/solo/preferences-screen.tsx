"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { PreferencesPanel } from "../editor/preferences-panel";
import type { UiMode } from "../editor/prefs";
import { useUiPrefs } from "../editor/use-ui-prefs";
import { PageHero } from "./page-hero";
import { AppShell } from "./shell";
import { Card } from "./ui";

/** Tells the app chrome (ChromePrefs) to re-read the saved look right away, in this tab. */
export const UI_PREFS_EVENT = "sck-ui-prefs";

const MODES: { id: UiMode; label: string; icon: typeof Sun; hint: string }[] = [
  { id: "light", label: "Light", icon: Sun, hint: "Bright surfaces, dark type" },
  { id: "dark", label: "Dark", icon: Moon, hint: "Easy on the eyes at night" },
  { id: "system", label: "System", icon: Monitor, hint: "Follow this device" },
];

/** A tiny drawing of the app in each mode: header, a card, two lines. */
function ModeArt({ mode }: { mode: UiMode }) {
  const pane = (dark: boolean) => (
    <span className={`flex h-full flex-1 flex-col gap-1.5 p-2 ${dark ? "bg-[#111]" : "bg-[#f4f4f2]"}`}>
      <span className={`h-2 w-8 rounded-full ${dark ? "bg-[#96ff43]" : "bg-[#1a1a1a]"}`} />
      <span className={`flex flex-1 flex-col gap-1 rounded-md p-1.5 ${dark ? "bg-[#1c1c1c]" : "bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]"}`}>
        <span className={`h-1.5 w-3/4 rounded-full ${dark ? "bg-white/25" : "bg-black/15"}`} />
        <span className={`h-1.5 w-1/2 rounded-full ${dark ? "bg-white/15" : "bg-black/10"}`} />
      </span>
    </span>
  );
  return (
    <span className="flex h-20 overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--ui-line)]">
      {mode === "system" ? (
        <>
          {pane(false)}
          {pane(true)}
        </>
      ) : (
        pane(mode === "dark")
      )}
    </span>
  );
}

export function PreferencesScreen() {
  const api = useUiPrefs();
  const { prefs, set } = api;

  // the hook saves to storage in its own effect (which runs first); then the rest of the app picks it up
  useEffect(() => {
    window.dispatchEvent(new Event(UI_PREFS_EVENT));
  }, [prefs]);

  return (
    <AppShell role="creator">
      <div className="flex flex-col gap-8">
        <PageHero title="Preferences" body="How the app looks and feels on this device. Changes apply everywhere straight away." />

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">Theme</h2>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map((m) => {
              const on = prefs.mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("mode", m.id)}
                  className={`ui-press flex flex-col gap-3 rounded-2xl bg-ui-panel p-3 text-left transition-shadow ${on ? "shadow-[inset_0_0_0_2px_var(--ui-ink)]" : "shadow-[inset_0_0_0_1px_var(--ui-line)] hover:shadow-[inset_0_0_0_1px_var(--ui-ink)]"}`}
                >
                  <ModeArt mode={m.id} />
                  <span className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={1.9} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold">{m.label}</span>
                      <span className="hidden text-[12px] text-ui-muted sm:block">{m.hint}</span>
                    </span>
                    {on && <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">Look and feel</h2>
          <Card className="p-4 sm:p-6">
            <PreferencesPanel api={api} />
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
