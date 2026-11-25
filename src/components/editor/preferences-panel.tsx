"use client";

import { Check, Link2, Monitor, Moon, PanelLeft, PanelRight, Plus, RotateCcw, Smartphone, Sun } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DESK_PRESETS, presetMatch, TONE_GROUPS, toneById, toneTokens, UI_ACCENTS, UI_FONTS, type UiPrefs } from "./prefs";
import { Segmented, inputCls } from "./ui";
import type { UiPrefsApi } from "./use-ui-prefs";

/* Play DMS › Settings layout: titled groups of rows, label + hint left, control right. */

function Group({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-6 items-center justify-between px-1">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {aside}
      </div>
      <div className="rounded-xl bg-ui-panel px-3.5 shadow-[0_0_0_1px_var(--ui-line)]">{children}</div>
    </section>
  );
}

function Row({ label, hint, children, stack }: { label: string; hint?: string; children: ReactNode; stack?: boolean }) {
  return (
    <div
      className={`ed-row flex gap-3 border-t border-ui-line py-2.5 first:border-t-0 ${
        stack ? "flex-col py-3.5" : "min-h-[52px] items-center justify-between"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{label}</div>
        {hint && <div className="text-[11.5px] leading-snug text-ui-muted">{hint}</div>}
      </div>
      <div className={stack ? "w-full" : "shrink-0"}>{children}</div>
    </div>
  );
}

const Orb = ({ a, b, size = 26 }: { a: string; b: string; size?: number }) => (
  <span className="ui-orb" style={{ ["--a" as string]: a, ["--b" as string]: b, width: size, height: size }} />
);

export function PreferencesPanel({ api }: { api: UiPrefsApi }) {
  const { prefs, set, patch, reset, dark, shareUrl } = api;
  const [copied, setCopied] = useState(false);
  const desk = presetMatch(prefs);

  const copyMix = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      toast.success("Link to this mix copied", { description: "Anyone opening it sees the editor set up like yours." });
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Couldn't copy. Your browser blocked the clipboard.");
    }
  };

  const seg = <K extends keyof UiPrefs>(k: K, options: { value: UiPrefs[K] & string; label: ReactNode; title?: string }[], size: "sm" | "md" = "sm") => (
    <Segmented id={`pref-${k}`} size={size} value={prefs[k] as UiPrefs[K] & string} onChange={(v) => set(k, v as UiPrefs[K])} options={options} />
  );

  return (
    <div className="ed-stack flex flex-col gap-7">
      <div className="px-1">
        <p className="text-[13px] text-ui-muted">
          How this editor looks and feels. These only change your workspace; the creator&apos;s page keeps its own theme.
        </p>
      </div>

      <Group title="Desk" aside={<span className="text-[11.5px] text-ui-muted">{desk ? `${desk.label} preset` : "Custom mix"}</span>}>
        <div className="grid grid-cols-2 gap-2 py-3.5">
          {DESK_PRESETS.map((d) => {
            const on = desk?.id === d.id;
            const tone = toneById(d.v.tone ?? prefs.tone);
            const tk = toneTokens(tone, d.v.mode ? d.v.mode === "dark" : dark, d.v.accent ?? null);
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={on}
                onClick={() => patch(d.v)}
                className={`ui-press relative flex items-center gap-2.5 rounded-xl p-2.5 text-left ${
                  on ? "bg-ui-sunken shadow-[inset_0_0_0_1.5px_var(--ui-ink)]" : "shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken"
                }`}
              >
                <Orb a={tk["--ui-bg"]} b={tk["--ui-accent"]} size={28} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{d.label}</span>
                  <span className="block truncate text-[11px] text-ui-muted">{d.hint}</span>
                </span>
                {on && <Check className="absolute top-2 right-2 size-3.5" />}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Appearance">
        <Row label="Mode" stack>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["light", "Light", Sun],
                ["dark", "Dark", Moon],
                ["system", "System", Monitor],
              ] as const
            ).map(([id, label, Icon]) => {
              const on = prefs.mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("mode", id)}
                  className={`ui-press flex h-11 items-center justify-center gap-2 rounded-xl text-[13px] font-medium ${
                    on ? "bg-ui-sunken text-ui-ink shadow-[inset_0_0_0_1.5px_var(--ui-ink)]" : "text-ui-muted shadow-[inset_0_0_0_1px_var(--ui-line)] hover:text-ui-ink"
                  }`}
                >
                  <Icon className="size-4" /> {label}
                </button>
              );
            })}
          </div>
        </Row>
        <Row label="Theme" hint="Colour tone for panels, lines and the accent" stack>
          <div className="flex flex-col gap-3">
            {TONE_GROUPS.map((g) => (
              <div key={g.group}>
                <div className="mb-1.5 text-[11.5px] font-semibold text-ui-muted">{g.group}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {g.ids.map((id) => {
                    const t = toneById(id);
                    const on = prefs.tone === id && !prefs.accent;
                    const tk = toneTokens(t, dark, null);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => patch({ tone: id, accent: null })}
                        className={`ui-press flex h-11 items-center gap-2.5 rounded-xl bg-ui-panel px-2.5 text-left text-[13px] font-medium ${
                          on
                            ? "shadow-[inset_0_0_0_1.5px_var(--ui-ink),0_0_0_3px_color-mix(in_oklab,var(--ui-ink)_10%,transparent)]"
                            : "shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken"
                        }`}
                      >
                        <Orb a={tk["--ui-bg"]} b={tk["--ui-accent"]} size={22} />
                        <span className="flex-1 truncate">{t.label}</span>
                        {on && <Check className="size-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Row>
        <Row label="Accent" hint="Publish, toggles and highlights" stack>
          <div className="flex flex-wrap items-center gap-1.5">
            {UI_ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Accent ${c}`}
                onClick={() => set("accent", c)}
                className="ui-press size-6 rounded-full"
                style={{
                  background: c,
                  boxShadow:
                    prefs.accent === c
                      ? "0 0 0 2px var(--ui-panel), 0 0 0 3.5px var(--ui-ink)"
                      : "inset 0 0 0 1px color-mix(in oklab, var(--ui-ink) 18%, transparent)",
                }}
              />
            ))}
            <label
              title="Any colour"
              className="ui-press relative grid size-6 cursor-pointer place-items-center overflow-hidden rounded-full bg-ui-sunken text-ui-muted shadow-[inset_0_0_0_1px_var(--ui-line)]"
              style={prefs.accent && !UI_ACCENTS.includes(prefs.accent) ? { background: prefs.accent } : undefined}
            >
              <input
                type="color"
                aria-label="Pick any accent colour"
                className="absolute inset-0 cursor-pointer opacity-0"
                value={prefs.accent ?? "#96ff43"}
                onChange={(e) => set("accent", e.target.value)}
              />
              {!(prefs.accent && !UI_ACCENTS.includes(prefs.accent)) && <Plus className="size-3" />}
            </label>
            {prefs.accent && (
              <button type="button" onClick={() => set("accent", null)} className="ml-1 text-[11.5px] text-ui-muted hover:text-ui-ink">
                Use theme accent
              </button>
            )}
          </div>
        </Row>
      </Group>

      <Group title="Type & shape">
        <Row label="Font" hint="Editor interface only">
          <select
            id="pref-font"
            value={prefs.font}
            onChange={(e) => set("font", e.target.value as UiPrefs["font"])}
            className={`${inputCls} w-40`}
            style={{ fontFamily: UI_FONTS.find((f) => f.id === prefs.font)?.css }}
          >
            {UI_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Corners">
          {seg(
            "corner",
            (["4", "6", "10", "14"] as const).map((c) => ({
              value: c,
              title: `${c}px`,
              label: <span className="block size-3 border-t-2 border-l-2 border-current" style={{ borderTopLeftRadius: Number(c) * 0.6 }} />,
            })),
          )}
        </Row>
        <Row label="Buttons" hint="Lip is the Play DMS key-press style">
          {seg("button", [
            { value: "flat", label: "Flat" },
            { value: "lip", label: "Lip" },
            { value: "pill", label: "Pill" },
          ])}
        </Row>
        <div className="flex items-center gap-2 border-t border-ui-line py-3">
          <span className="text-[11.5px] text-ui-muted">Preview</span>
          <span className="ui-cta ui-press ml-auto inline-flex h-8 items-center rounded-xl px-3.5 text-[13px] font-semibold">Publish</span>
          <span className="inline-flex h-8 items-center rounded-xl px-3 text-[13px] font-medium shadow-[inset_0_0_0_1px_var(--ui-line)]">Cancel</span>
        </div>
      </Group>

      <Group title="Layout">
        <Row label="Navigation" hint="Tabs above the panel, or an icon rail">
          {seg("nav", [
            { value: "tabs", label: "Tabs" },
            { value: "rail", label: "Rail" },
          ])}
        </Row>
        <Row label="Panel side">
          {seg("side", [
            { value: "left", label: <PanelLeft className="size-3.5" />, title: "Left" },
            { value: "right", label: <PanelRight className="size-3.5" />, title: "Right" },
          ])}
        </Row>
        <Row label="Panel width">
          {seg("width", [
            { value: "340", label: "S" },
            { value: "400", label: "M" },
            { value: "460", label: "L" },
          ])}
        </Row>
        <Row label="Canvas" hint="Backdrop behind the preview">
          {seg("canvas", [
            { value: "dots", label: "Dots" },
            { value: "grid", label: "Grid" },
            { value: "plain", label: "Plain" },
          ])}
        </Row>
        <Row label="Phone frame">
          {seg("frame", [
            { value: "device", label: "Device" },
            { value: "minimal", label: "Minimal" },
          ])}
        </Row>
        <Row label="Preview opens on">
          {seg("device", [
            { value: "mobile", label: <Smartphone className="size-3.5" />, title: "Phone" },
            { value: "desktop", label: <Monitor className="size-3.5" />, title: "Desktop" },
          ])}
        </Row>
      </Group>

      <Group title="Feel">
        <Row label="Density" hint="Compact fits more rows on screen">
          {seg("density", [
            { value: "comfortable", label: "Comfy" },
            { value: "compact", label: "Compact" },
          ])}
        </Row>
        <Row label="Motion" hint="Reduced turns off slides, springs and stagger in the editor">
          {seg("motion", [
            { value: "full", label: "Full" },
            { value: "reduced", label: "Reduced" },
          ])}
        </Row>
      </Group>

      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={copyMix}
          className="ui-press inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-medium shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken"
        >
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />} Copy link to this mix
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            toast("Preferences reset");
          }}
          className="ui-press ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] text-ui-muted hover:bg-ui-sunken hover:text-ui-ink"
        >
          <RotateCcw className="size-3.5" /> Reset
        </button>
      </div>
      <p className="px-1 text-[11.5px] text-ui-muted">Tip: press Ctrl/⌘ + , to open Preferences from anywhere in the editor.</p>
    </div>
  );
}
