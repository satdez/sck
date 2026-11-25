"use client";

import { Check, ChevronsUpDown, Monitor, Moon, RotateCcw, Shuffle, Sun, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ThemeScope } from "@/components/portfolio/theme-scope";
import { FONTS } from "@/lib/font-map";
import { COLORS, derivePalette } from "@/lib/palette";
import {
  BACKDROPS,
  BUTTONS,
  FONT_PAIRS,
  LAYOUTS,
  PRESETS,
  TILES,
  backdropDef,
  presetTheme,
  resolveTheme,
  type Preset,
} from "@/lib/themes";
import type { BackdropKind, BackdropSpec, DisplayMode, LayoutId, ThemeSettings } from "@/lib/types";

const EASE = [0.23, 1, 0.32, 1] as const;
/* Concentric radii: an inner corner is the outer corner minus the padding between them. */
const R_OUT = "rounded-[calc(var(--ui-r)+4px)]"; // card, p-1
const R_IN = "rounded-[var(--ui-r)]"; // thumbnail inside it

/* ───────── small pieces ───────── */

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex h-5 items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function TextButton({ onClick, icon: Icon, children }: { onClick: () => void; icon: LucideIcon; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="ui-press inline-flex items-center gap-1 text-[11.5px] text-ui-muted transition-colors hover:text-ui-ink">
      <Icon className="size-3" /> {children}
    </button>
  );
}

const activeRing = "shadow-[inset_0_0_0_1.5px_var(--ui-ink)] bg-ui-sunken";
const idleRing = "shadow-[inset_0_0_0_1px_var(--ui-line)] hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-ink)_30%,transparent)]";

/* ───────── layout schematics, drawn with the page's own palette ───────── */

function Block({ className = "", accent }: { className?: string; accent?: boolean }) {
  // ring comes from the page's tile style (globals.css .mini-b), so it matches the real tiles
  return <span className={`mini-b block ${accent ? "mini-b--accent" : ""} ${className}`} />;
}
const Line = ({ w, strong }: { w: string; strong?: boolean }) => (
  <span className="block h-[3px] rounded-full" style={{ width: w, background: strong ? "var(--p-ink)" : "color-mix(in oklab, var(--p-ink) 22%, transparent)" }} />
);
const Aa = ({ className = "" }: { className?: string }) => <span className={`font-display leading-none text-ink ${className}`}>Aa</span>;

function Schematic({ layout }: { layout: LayoutId }) {
  switch (layout) {
    case "bento":
      return (
        <span className="absolute inset-2.5 flex gap-1.5">
          <span className="flex w-[30%] flex-col gap-1">
            <Block className="aspect-[4/3] w-full" />
            <Aa className="mt-0.5 text-[13px]" />
            <Line w="80%" />
            <Line w="60%" />
          </span>
          <span className="grid flex-1 grid-cols-3 grid-rows-3 gap-1">
            <Block />
            <Block />
            <Block />
            <Block className="col-span-2 row-span-2" accent />
            <Block />
            <Block />
          </span>
        </span>
      );
    case "split":
      return (
        <span className="absolute inset-2.5 flex gap-2">
          <span className="flex w-[36%] flex-col gap-1">
            <Block className="aspect-square w-full" />
            <Line w="70%" />
            <Line w="90%" />
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <Aa className="text-[17px]" />
            <Line w="55%" />
            <span className="mt-auto flex flex-col gap-1 p-1" style={{ background: "var(--p-surface)", borderRadius: "calc(var(--p-radius) * 0.3)", boxShadow: "inset 0 0 0 0.75px var(--p-line)" }}>
              <Line w="70%" />
              <Block className="h-2 w-full" accent />
            </span>
          </span>
        </span>
      );
    case "editorial":
      return (
        <span className="absolute inset-2.5 flex flex-col gap-1">
          <span className="flex justify-between border-b pb-0.5" style={{ borderColor: "var(--p-line)" }}>
            <Line w="22%" />
            <Line w="18%" />
          </span>
          <Block className="h-6 w-full" />
          <span className="font-display text-[21px] leading-[0.85] tracking-tight text-ink">Aa Bb</span>
          <span className="mt-auto grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="font-display text-[10px] leading-none text-ink">
                {["4M", "9%", "2k", "18"][i]}
              </span>
            ))}
          </span>
        </span>
      );
    case "list":
      return (
        <span className="absolute inset-x-[22%] inset-y-2.5 flex flex-col items-center gap-1">
          <span className="size-5 rounded-full" style={{ background: "var(--p-bg2)", boxShadow: "inset 0 0 0 0.75px var(--p-line)" }} />
          <Aa className="text-[12px]" />
          <Block className="h-2.5 w-full" />
          <Block className="h-2.5 w-full" />
          <Block className="h-2.5 w-full" />
          <Block className="h-2.5 w-full" accent />
        </span>
      );
    case "cards":
      return (
        <span className="absolute inset-2.5 flex gap-1.5">
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="flex items-center gap-1">
              <span className="size-3.5 rounded-full" style={{ background: "var(--p-bg2)" }} />
              <Aa className="text-[12px]" />
            </span>
            <Block className="h-9 w-full" />
            <Block className="flex-1" />
          </span>
          <span className="flex flex-1 flex-col gap-1.5">
            <Block className="h-6 w-full" accent />
            <Block className="flex-1" />
          </span>
        </span>
      );
  }
}

/** Live mini page: the real backdrop + palette + font, with a layout schematic on top. */
function MiniPage({ theme, glowSrc, layout, className = "" }: { theme: ThemeSettings; glowSrc?: string; layout?: LayoutId; className?: string }) {
  return (
    <ThemeScope theme={theme} glowSrc={glowSrc} thumb className={`bd-thumb !absolute inset-0 !min-h-0 overflow-hidden ${className}`}>
      {layout && <Schematic layout={layout} />}
    </ThemeScope>
  );
}

/* ───────── presets ───────── */

function PresetCard({ preset, active, glowSrc, onClick }: { preset: Preset; active: boolean; glowSrc?: string; onClick: () => void }) {
  const layoutName = LAYOUTS.find((l) => l.id === preset.layout)?.name;
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`ui-press group flex flex-col p-1 text-left ${R_OUT} ${active ? activeRing : idleRing}`}>
      <span className={`relative block h-[104px] overflow-hidden ${R_IN}`}>
        <MiniPage theme={presetTheme(preset)} glowSrc={glowSrc} layout={preset.layout} />
      </span>
      <span className="flex items-center justify-between gap-2 px-1.5 pt-2 pb-1">
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold">{preset.name}</span>
          <span className="block truncate text-[11px] text-ui-muted">{preset.vibe}</span>
        </span>
        {active ? (
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-ui-ink text-ui-bg">
            <Check className="size-2.5" strokeWidth={3.5} />
          </span>
        ) : (
          <span className="shrink-0 rounded-[6px] bg-ui-sunken px-1.5 py-0.5 text-[10px] font-medium text-ui-muted">{layoutName}</span>
        )}
      </span>
    </button>
  );
}

/* ───────── theme strip + pickers (Luma's bottom bar) ───────── */

type Picker = "color" | "style" | "font" | "display";

function PickerPill({ label, value, swatch, open, disabled, onClick }: { label: string; value: string; swatch?: ReactNode; open: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={open}
      className={`ui-press flex h-11 min-w-0 items-center gap-2.5 bg-ui-sunken px-3 text-left transition-opacity disabled:opacity-40 ${R_IN} ${
        open ? "shadow-[inset_0_0_0_1.5px_var(--ui-ink)]" : "shadow-[inset_0_0_0_1px_var(--ui-line)]"
      }`}
    >
      {swatch}
      <span className="text-[13px] font-medium">{label}</span>
      <span className="ml-auto truncate text-[12px] text-ui-muted">{value}</span>
      <ChevronsUpDown className="size-3.5 shrink-0 text-ui-muted" />
    </button>
  );
}

function Drawer({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="overflow-hidden"
    >
      {/* drawer radius = item radius (6px) + padding (8px) */}
      <div className="rounded-[14px] bg-ui-sunken p-2 shadow-[inset_0_0_0_1px_var(--ui-line)]">{children}</div>
    </motion.div>
  );
}

function ColorDrawer({ theme, set }: { theme: ThemeSettings; set: (p: Partial<ThemeSettings>) => void }) {
  const r = resolveTheme(theme);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-6 gap-1.5">
        {COLORS.map((c) => {
          const l = derivePalette(c, false);
          const d = derivePalette(c, true);
          const active = r.color.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              title={c.name}
              aria-label={c.name}
              aria-pressed={active}
              onClick={() => set({ color: c.id, accent: undefined })}
              className={`ui-press flex flex-col items-center gap-1 rounded-[6px] py-1.5 ${active ? "bg-ui-panel shadow-[inset_0_0_0_1px_var(--ui-line)]" : "hover:bg-ui-panel/60"}`}
            >
              <span
                className="ui-orb size-7"
                style={{ ["--a" as string]: r.dark ? d.bg2 : l.bg2, ["--b" as string]: r.dark ? d.accent : l.accent }}
              />
              <span className="text-[10px] text-ui-muted">{c.name}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-[6px] bg-ui-panel px-2.5 py-2">
        <span className="text-[12px]">Accent</span>
        <span className="flex items-center gap-2">
          {theme.accent && <TextButton icon={RotateCcw} onClick={() => set({ accent: undefined })}>From colour</TextButton>}
          <label className="ui-press relative size-6 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_0_0_1px_var(--ui-line)]" style={{ background: r.palette.accent }}>
            <input
              type="color"
              aria-label="Custom accent colour"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={r.palette.accent.slice(0, 7)}
              onChange={(e) => set({ accent: e.target.value })}
            />
          </label>
        </span>
      </div>
    </div>
  );
}

function StyleDrawer({ theme, glowSrc, setBackdrop }: { theme: ThemeSettings; glowSrc?: string; setBackdrop: (b: Partial<BackdropSpec>) => void }) {
  const r = resolveTheme(theme);
  const def = backdropDef(r.backdrop.kind);
  const [custom, setCustom] = useState("");
  return (
    <div className="flex flex-col gap-2">
      {def.kind === "emoji" ? (
        <div className="grid grid-cols-6 gap-1">
          {def.styles.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={r.backdrop.style === s.id}
              onClick={() => setBackdrop({ style: s.id })}
              className={`ui-press grid h-10 place-items-center rounded-[6px] text-xl ${r.backdrop.style === s.id ? "bg-ui-panel shadow-[inset_0_0_0_1.5px_var(--ui-ink)]" : "hover:bg-ui-panel/60"}`}
            >
              {s.id}
            </button>
          ))}
          <input
            aria-label="Any emoji"
            placeholder="Any"
            value={custom}
            onChange={(ev) => {
              setCustom(ev.target.value);
              const first = [...new Intl.Segmenter().segment(ev.target.value.trim())][0]?.segment;
              if (first) setBackdrop({ style: first });
            }}
            className="col-span-2 h-10 rounded-[6px] bg-ui-panel text-center text-sm outline-none placeholder:text-ui-muted focus:shadow-[inset_0_0_0_1.5px_var(--ui-ink)]"
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {def.styles.map((s) => {
            const active = r.backdrop.style === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setBackdrop({ style: s.id })}
                className={`ui-press flex flex-col gap-1 rounded-[8px] p-1 text-left ${active ? "bg-ui-panel shadow-[inset_0_0_0_1.5px_var(--ui-ink)]" : "hover:bg-ui-panel/60"}`}
              >
                <span className="relative block h-12 overflow-hidden rounded-[5px]">
                  <MiniPage theme={{ ...theme, backdrop: { ...r.backdrop, style: s.id } }} glowSrc={glowSrc} />
                </span>
                <span className="px-1 text-[11px] font-medium">{s.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {r.backdrop.kind !== "quantum" && (
        <button
          type="button"
          role="switch"
          aria-checked={!!r.backdrop.grain}
          onClick={() => setBackdrop({ grain: !r.backdrop.grain })}
          className="flex items-center justify-between rounded-[6px] bg-ui-panel px-2.5 py-2 text-[12px]"
        >
          Film grain
          <span className={`relative h-4 w-7 rounded-full transition-colors ${r.backdrop.grain ? "bg-ui-ink" : "bg-ui-line"}`}>
            <span className={`absolute top-0.5 left-0.5 size-3 rounded-full bg-ui-bg transition-transform duration-200 ${r.backdrop.grain ? "translate-x-3" : ""}`} />
          </span>
        </button>
      )}
    </div>
  );
}

function FontDrawer({ theme, set }: { theme: ThemeSettings; set: (p: Partial<ThemeSettings>) => void }) {
  const r = resolveTheme(theme);
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {FONT_PAIRS.map((f) => {
        const active = r.font.id === f.id && !theme.displayFont && !theme.bodyFont;
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={active}
            onClick={() => set({ font: f.id, displayFont: undefined, bodyFont: undefined })}
            className={`ui-press flex items-center gap-3 rounded-[6px] px-2.5 py-2 text-left ${active ? "bg-ui-panel shadow-[inset_0_0_0_1.5px_var(--ui-ink)]" : "hover:bg-ui-panel/60"}`}
          >
            <span className="w-9 text-[24px] leading-none" style={{ fontFamily: FONTS[f.display].css }}>
              Ag
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium">{f.name}</span>
              <span className="block truncate text-[10.5px] text-ui-muted">+ {FONTS[f.body].label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const DISPLAY: { id: DisplayMode; label: string; icon: LucideIcon }[] = [
  { id: "auto", label: "Auto", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function DisplayDrawer({ theme, set }: { theme: ThemeSettings; set: (p: Partial<ThemeSettings>) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1.5">
        {DISPLAY.map((d) => {
          const active = theme.mode === d.id;
          return (
            <button
              key={d.id}
              type="button"
              aria-pressed={active}
              onClick={() => set({ mode: d.id })}
              className={`ui-press flex flex-col items-center gap-1.5 rounded-[6px] py-2.5 ${active ? "bg-ui-panel shadow-[inset_0_0_0_1.5px_var(--ui-ink)]" : "hover:bg-ui-panel/60"}`}
            >
              <d.icon className="size-4" strokeWidth={1.75} />
              <span className="text-[12px] font-medium">{d.label}</span>
            </button>
          );
        })}
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-ui-muted">Auto follows each visitor&apos;s phone setting.</p>
    </div>
  );
}

/* ───────── panel ───────── */

export function DesignPanel({ theme, glowSrc, onChange }: { theme: ThemeSettings; glowSrc?: string; onChange: (t: ThemeSettings) => void }) {
  const r = resolveTheme(theme);
  const set = (patch: Partial<ThemeSettings>) => onChange({ ...theme, ...patch });
  const setBackdrop = (patch: Partial<BackdropSpec>) => set({ backdrop: { ...r.backdrop, ...patch } });
  const [open, setOpen] = useState<Picker | null>(null);
  const toggle = (p: Picker) => setOpen((o) => (o === p ? null : p));
  const def = backdropDef(r.backdrop.kind);
  const customised = theme.color || theme.backdrop || theme.font || theme.accent || theme.tile || theme.button || theme.radius !== undefined;

  const pickKind = (kind: BackdropKind) => {
    const d = backdropDef(kind);
    // keep the current style if the new theme has it, otherwise its first style
    const style = d.styles.some((s) => s.id === r.backdrop.style) ? r.backdrop.style : d.styles[0]?.id;
    set({ backdrop: { kind, style, grain: r.backdrop.grain } });
  };

  const shuffle = () => {
    const pick = <T,>(xs: readonly T[], not?: T) => {
      const pool = xs.filter((x) => x !== not);
      return pool[Math.floor(Math.random() * pool.length)];
    };
    const kind = pick(BACKDROPS.map((b) => b.kind), r.backdrop.kind);
    const d = backdropDef(kind);
    set({
      color: pick(COLORS.map((c) => c.id), r.color.id),
      font: pick(FONT_PAIRS.map((f) => f.id)),
      backdrop: { kind, style: d.styles.length ? pick(d.styles.map((s) => s.id)) : undefined, grain: Math.random() > 0.5 },
      accent: undefined,
    });
  };

  const styleName =
    r.backdrop.kind === "emoji" ? r.backdrop.style ?? "" : def.styles.find((s) => s.id === r.backdrop.style)?.name ?? "—";

  return (
    <div className="ed-stack flex flex-col gap-8">
      <Section title="Presets">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <PresetCard key={p.id} preset={p} active={r.preset.id === p.id && !customised} glowSrc={glowSrc} onClick={() => onChange(presetTheme(p))} />
          ))}
        </div>
      </Section>

      <Section
        title="Theme"
        aside={
          <span className="flex items-center gap-3">
            {customised && (
              <TextButton icon={RotateCcw} onClick={() => onChange({ ...presetTheme(r.preset), layout: theme.layout })}>
                Reset
              </TextButton>
            )}
            <TextButton icon={Shuffle} onClick={shuffle}>
              Shuffle
            </TextButton>
          </span>
        }
      >
        {/* theme strip */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-28px),transparent)]">
          <div className="flex w-max gap-2 pb-1">
            {BACKDROPS.map((b) => {
              const active = r.backdrop.kind === b.kind;
              return (
                <button key={b.kind} type="button" aria-pressed={active} onClick={() => pickKind(b.kind)} className="ui-press group flex flex-col items-center gap-1.5">
                  <span
                    className={`relative block h-[54px] w-[76px] overflow-hidden rounded-[10px] transition-shadow ${
                      active ? "shadow-[0_0_0_2px_var(--ui-panel),0_0_0_3.5px_var(--ui-ink)]" : "shadow-[inset_0_0_0_1px_var(--ui-line)]"
                    }`}
                  >
                    <MiniPage
                      theme={{ ...theme, backdrop: { kind: b.kind, style: active ? r.backdrop.style : b.styles[0]?.id, grain: r.backdrop.grain } }}
                      glowSrc={glowSrc}
                    />
                    {/* Luma's tiny event card */}
                    <span className="absolute top-2 left-2 flex gap-1">
                      <span className="size-4 rounded-[3px] bg-white/90 shadow-sm" />
                      <span className="flex flex-col gap-[3px] pt-0.5">
                        <span className="h-[3px] w-6 rounded-full bg-white/80" />
                        <span className="h-[3px] w-4 rounded-full bg-white/60" />
                        <span className="h-[3px] w-5 rounded-full bg-white/60" />
                      </span>
                    </span>
                  </span>
                  <span className={`text-[11px] ${active ? "font-semibold text-ui-ink" : "text-ui-muted group-hover:text-ui-ink"}`}>{b.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* pickers */}
        <div className="grid grid-cols-2 gap-1.5">
          <PickerPill
            label="Color"
            value={theme.accent ? "Custom" : r.color.name}
            open={open === "color"}
            onClick={() => toggle("color")}
            swatch={<span className="ui-orb size-5 shrink-0" style={{ ["--a" as string]: r.palette.bg2, ["--b" as string]: r.palette.accent }} />}
          />
          <PickerPill
            label="Style"
            value={styleName}
            disabled={!def.styles.length}
            open={open === "style"}
            onClick={() => toggle("style")}
          />
          <PickerPill
            label="Font"
            value={r.font.name}
            open={open === "font"}
            onClick={() => toggle("font")}
            swatch={
              <span className="w-5 shrink-0 text-[15px] leading-none" style={{ fontFamily: FONTS[r.displayFont].css }}>
                Ag
              </span>
            }
          />
          <PickerPill
            label="Display"
            value={DISPLAY.find((d) => d.id === theme.mode)?.label ?? "Light"}
            open={open === "display"}
            onClick={() => toggle("display")}
          />
        </div>
        <AnimatePresence initial={false} mode="wait">
          {open && (
            <Drawer key={open}>
              {open === "color" && <ColorDrawer theme={theme} set={set} />}
              {open === "style" && <StyleDrawer theme={theme} glowSrc={glowSrc} setBackdrop={setBackdrop} />}
              {open === "font" && <FontDrawer theme={theme} set={set} />}
              {open === "display" && <DisplayDrawer theme={theme} set={set} />}
            </Drawer>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Layout">
        {/* same proportions as the preset cards, so the schematics read */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-28px),transparent)]">
          <div className="flex w-max gap-2 pb-1">
            {LAYOUTS.map((l) => {
              const active = r.layout === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ layout: l.id })}
                  className={`ui-press flex w-[132px] flex-col gap-1.5 p-1 text-left ${R_OUT} ${active ? activeRing : idleRing}`}
                >
                  <span className={`relative block h-[84px] overflow-hidden ${R_IN}`}>
                    <MiniPage theme={{ ...theme, backdrop: { kind: "minimal" } }} layout={l.id} />
                  </span>
                  <span className="px-1.5 pb-1">
                    <span className="block text-[12px] font-semibold">{l.name}</span>
                    <span className="block truncate text-[10.5px] text-ui-muted">{l.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Details">
        <div className="flex flex-col gap-4">
          <DetailRow label="Tiles">
            <div className="grid grid-cols-4 gap-1.5">
              {TILES.map((t) => (
                <OptionChip key={t.id} active={r.tile === t.id} onClick={() => set({ tile: t.id })} label={t.name}>
                  <span
                    className="size-6 rounded-[6px]"
                    style={{
                      background: t.id === "glass" ? "color-mix(in oklab, var(--ui-ink) 10%, transparent)" : "var(--ui-panel)",
                      boxShadow:
                        t.id === "brutal"
                          ? "inset 0 0 0 1.5px var(--ui-ink), 2px 2px 0 var(--ui-ink)"
                          : t.id === "flat"
                            ? "0 1px 3px rgb(0 0 0/0.25)"
                            : "inset 0 0 0 1px var(--ui-line)",
                    }}
                  />
                </OptionChip>
              ))}
            </div>
          </DetailRow>

          <DetailRow label="Buttons">
            <div className="grid grid-cols-4 gap-1.5">
              {BUTTONS.map((b) => (
                <OptionChip key={b} active={r.button === b} onClick={() => set({ button: b })} label={b[0].toUpperCase() + b.slice(1)}>
                  <span
                    className="h-4 w-9 bg-ui-ink"
                    style={{
                      borderRadius: b === "pill" ? 99 : b === "rounded" ? 5 : b === "square" ? 1.5 : 4,
                      boxShadow: b === "brutal" ? "2px 2px 0 var(--ui-accent)" : undefined,
                    }}
                  />
                </OptionChip>
              ))}
            </div>
          </DetailRow>

          <DetailRow label="Corners" value={`${r.radius}px`}>
            <input
              type="range"
              min={0}
              max={32}
              step={2}
              value={r.radius}
              onChange={(e) => set({ radius: Number(e.target.value) })}
              aria-label="Tile corner radius"
              className="h-5 w-full cursor-pointer accent-[var(--ui-ink)]"
            />
          </DetailRow>
        </div>
      </Section>
    </div>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="font-medium">{label}</span>
        {value && <span className="text-ui-muted tabular-nums">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function OptionChip({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`ui-press flex flex-col items-center gap-2 px-1 pt-3 pb-2 ${R_OUT} ${active ? activeRing : idleRing}`}
    >
      <span className="grid h-6 place-items-center">{children}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
