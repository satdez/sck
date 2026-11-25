"use client";

import { ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import type { Portfolio, Profile, Section } from "@/lib/types";
import { SECTION_META, type Field } from "./schema";
import { FieldRow, inputCls, PanelCard, Switch, TextInput } from "./ui";

type Item = Record<string, string | number>;

const expand = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const },
};

/* ───────── profile ───────── */

function ProfileEditor({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => onChange({ ...profile, [k]: v });
  return (
    <PanelCard title="Profile">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.avatar} alt="" className="size-14 rounded-full bg-ui-sunken object-cover" />
        <div className="flex-1">
          <TextInput id="pf-avatar" label="Photo URL" value={profile.avatar} onChange={(e) => set("avatar", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextInput id="pf-name" label="Name" value={profile.name} onChange={(e) => set("name", e.target.value)} />
        <TextInput id="pf-handle" label="Handle" value={profile.handle} onChange={(e) => set("handle", e.target.value)} />
      </div>
      <FieldRow label="One-line bio" htmlFor="pf-bio" hint={`${profile.bio.length}/120`}>
        <textarea
          id="pf-bio"
          rows={2}
          maxLength={120}
          className={`${inputCls} resize-none`}
          value={profile.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </FieldRow>
      <TextInput
        id="pf-tags"
        label="Niche tags"
        hint="Comma separated"
        value={profile.tags.join(", ")}
        onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trimStart()).filter((t, i, a) => t || i === a.length - 1))}
        onBlur={() => set("tags", profile.tags.map((t) => t.trim()).filter(Boolean))}
      />
      <TextInput id="pf-loc" label="Location" value={profile.location} onChange={(e) => set("location", e.target.value)} />
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <TextInput
          id="pf-banner"
          label="Banner (image or .mp4 loop)"
          value={profile.banner.url}
          onChange={(e) =>
            set("banner", { url: e.target.value, type: /\.(mp4|webm|mov)(\?|$)/i.test(e.target.value) ? "video" : "image" })
          }
        />
        <span className="mb-2 rounded-md bg-ui-sunken px-2 py-1 text-[11px] text-ui-muted">{profile.banner.type}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-xl border border-ui-line px-3 py-2">
        <Switch label="Open to collabs" checked={profile.available} onChange={(v) => set("available", v)} />
        <Switch label="Show verified stats badge" checked={profile.verified} onChange={(v) => set("verified", v)} />
      </div>
    </PanelCard>
  );
}

/* ───────── generic item form ───────── */

function FieldInput({ f, value, onChange, id }: { f: Field; value: string | number; onChange: (v: string | number) => void; id: string }) {
  if (f.type === "select") {
    return (
      <select id={id} className={inputCls} value={String(value)} onChange={(e) => onChange(e.target.value)}>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (f.type === "textarea") {
    return <textarea id={id} rows={2} className={`${inputCls} resize-y`} value={String(value)} onChange={(e) => onChange(e.target.value)} />;
  }
  if (f.type === "color") {
    return (
      <div className="flex items-center gap-2">
        <input id={id} type="color" className="size-9 cursor-pointer rounded-lg border border-ui-line bg-transparent p-0.5" value={String(value)} onChange={(e) => onChange(e.target.value)} />
        <span className="font-mono text-xs text-ui-muted">{value}</span>
      </div>
    );
  }
  if (f.type === "number") {
    return (
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className={`${inputCls} tabular-nums`}
        value={Number(value)}
        placeholder={f.placeholder}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    );
  }
  return <input id={id} type={f.type === "url" ? "url" : "text"} className={inputCls} value={String(value)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function ItemCard({
  sectionId,
  index,
  item,
  fields,
  summary,
  onChange,
  onRemove,
  defaultOpen,
}: {
  sectionId: string;
  index: number;
  item: Item;
  fields: Field[];
  summary: string;
  onChange: (i: Item) => void;
  onRemove?: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-xl border border-ui-line bg-ui-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm"
        aria-expanded={open}
      >
        <span className="flex-1 truncate">{summary}</span>
        <ChevronDown className={`size-4 text-ui-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div {...expand} className="overflow-hidden">
            <div className="flex flex-col gap-3 border-t border-ui-line p-3">
              {fields.map((f) => (
                <FieldRow key={f.key} label={f.label} hint={f.hint} htmlFor={`${sectionId}-${index}-${f.key}`}>
                  <FieldInput
                    id={`${sectionId}-${index}-${f.key}`}
                    f={f}
                    value={item[f.key] ?? ""}
                    onChange={(v) => onChange({ ...item, [f.key]: v })}
                  />
                </FieldRow>
              ))}
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="ui-press inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" /> Remove
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────── section row ───────── */

function SectionRow({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  const controls = useDragControls();
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);
  // SECTION_META is keyed by type; widen once here so the generic form can work on any section.
  const meta = SECTION_META[section.type] as unknown as {
    label: string; why: string; icon: typeof Eye; fields: Field[]; single?: boolean;
    blank: () => Item; summary: (i: Item) => string;
  };
  const Icon = meta.icon;
  const items = section.items as unknown as Item[];
  const setItems = (next: Item[]) => onChange({ ...section, items: next } as unknown as Section);

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className="relative rounded-2xl border border-ui-line bg-ui-panel"
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 32px -8px rgb(0 0 0 / 0.25)" }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
    >
      <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-1">
        <button
          type="button"
          aria-label={`Drag to reorder ${section.title}`}
          onPointerDown={(e) => controls.start(e)}
          className="grid size-8 cursor-grab touch-none place-items-center rounded-lg text-ui-muted hover:bg-ui-sunken active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left" aria-expanded={open}>
          <span className={`grid size-7 shrink-0 place-items-center rounded-lg bg-ui-sunken ${section.visible ? "" : "opacity-40"}`}>
            <Icon className="size-3.5" />
          </span>
          <span className={`min-w-0 flex-1 ${section.visible ? "" : "opacity-50"}`}>
            <span className="block truncate text-sm font-medium">{section.title}</span>
            <span className="block text-[11px] text-ui-muted">
              {meta.single ? meta.label : `${items.length} ${items.length === 1 ? "item" : "items"}`}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...section, visible: !section.visible } as Section)}
          aria-label={section.visible ? "Hide section" : "Show section"}
          className="ui-press grid size-8 place-items-center rounded-lg text-ui-muted hover:bg-ui-sunken hover:text-ui-ink"
        >
          {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Edit section"
          className="grid size-8 place-items-center rounded-lg text-ui-muted hover:bg-ui-sunken"
        >
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div {...expand} className="overflow-hidden">
            <div className="flex flex-col gap-3 border-t border-ui-line bg-ui-sunken/50 p-3">
              <p className="text-xs text-ui-muted">{meta.why}</p>
              <TextInput
                id={`${section.id}-title`}
                label="Section title"
                value={section.title}
                onChange={(e) => onChange({ ...section, title: e.target.value } as Section)}
              />
              <div className="flex flex-col gap-2">
                {items.map((it, i) => (
                  <ItemCard
                    key={i}
                    sectionId={section.id}
                    index={i}
                    item={it}
                    fields={meta.fields}
                    summary={meta.summary(it)}
                    defaultOpen={fresh === i || meta.single}
                    onChange={(n) => setItems(items.map((x, j) => (j === i ? n : x)))}
                    onRemove={meta.single ? undefined : () => setItems(items.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
              {!meta.single && (
                <button
                  type="button"
                  onClick={() => {
                    setFresh(items.length);
                    setItems([...items, meta.blank()]);
                  }}
                  className="ui-press inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-dashed border-ui-line text-sm font-medium text-ui-muted hover:border-ui-ink/30 hover:text-ui-ink"
                >
                  <Plus className="size-4" /> Add item
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export function ContentPanel({ draft, onChange }: { draft: Portfolio; onChange: (p: Portfolio) => void }) {
  return (
    <div className="ed-stack flex flex-col gap-8">
      <ProfileEditor profile={draft.profile} onChange={(profile) => onChange({ ...draft, profile })} />
      <PanelCard title="Sections" action={<span className="text-[11px] text-ui-muted">Drag to reorder</span>}>
        <Reorder.Group
          axis="y"
          values={draft.sections}
          onReorder={(sections) => onChange({ ...draft, sections })}
          className="flex flex-col gap-2"
        >
          {draft.sections.map((s) => (
            <SectionRow
              key={s.id}
              section={s}
              onChange={(next) => onChange({ ...draft, sections: draft.sections.map((x) => (x.id === s.id ? next : x)) })}
            />
          ))}
        </Reorder.Group>
      </PanelCard>
    </div>
  );
}
