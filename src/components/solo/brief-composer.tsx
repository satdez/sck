"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { inr } from "@/lib/solo/money";
import { BOAT_BRIEF } from "@/lib/solo/seed";
import { sendBrief, type BriefDraft } from "@/lib/solo/store";
import type { Brief, BriefItem } from "@/lib/solo/types";
import { PlatformGlyph } from "./whatsapp-icon";
import { Field, fieldCls, Sheet } from "./sheet";
import { Btn } from "./ui";

/** Rate card from the PRD's Creator Kit: a starting price per deliverable for ~80k IG / 40k YT. */
const RATE: Record<string, number> = { Reel: 22000, Stories: 7000, Integration: 26000, Shorts: 12000, Post: 12000, Video: 60000 };
export const suggestedPrice = (items: BriefItem[]) => items.reduce((n, it) => n + (RATE[it.kind] ?? 10000), 0);

const KINDS: Record<BriefItem["platform"], string[]> = {
  instagram: ["Reel", "Stories", "Post"],
  youtube: ["Integration", "Shorts", "Video"],
};

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export function BriefComposer({
  open,
  onOpenChange,
  threadId,
  by,
  base,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  threadId: string;
  by: "brand" | "creator";
  /** the brief being countered; undefined = a fresh brief */
  base?: Brief;
}) {
  const start: BriefDraft = base ? { ...base, note: "" } : { ...BOAT_BRIEF };
  const [d, setD] = useState<BriefDraft>(start);
  const [msgs, setMsgs] = useState(start.keyMessages.join("\n"));
  const [dos, setDos] = useState(start.dos.join("\n"));
  const counter = !!base;
  const suggestion = suggestedPrice(d.items);

  const set = <K extends keyof BriefDraft>(k: K, v: BriefDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setItem = (i: number, patch: Partial<BriefItem>) => set("items", d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const submit = () => {
    sendBrief(threadId, by, { ...d, keyMessages: lines(msgs), dos: lines(dos) });
    onOpenChange(false);
  };

  const valid = d.title.trim() && d.items.length > 0 && d.budget > 0;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      wide
      title={counter ? `Counter brief v${base!.version}` : "Send a brief"}
      description={counter ? "Change what you need. The other side sees exactly what changed and can accept or counter again." : "Deliverables, timeline and budget in one card. Arun can accept, counter or decline."}
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[11px] font-semibold text-ui-muted">Budget</p>
            <p className="font-heading text-lg font-semibold tabular-nums">{inr(d.budget || 0)}</p>
          </div>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Btn>
          <Btn onClick={submit} disabled={!valid}>
            {counter ? "Send counter" : "Send brief"}
          </Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Field label="Campaign">
          <input className={fieldCls} value={d.title} onChange={(e) => set("title", e.target.value)} />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-ui-muted">Deliverables</span>
          {d.items.map((it, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-ui-sunken p-2 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <div className="flex rounded-lg bg-ui-panel p-0.5 shadow-[0_0_0_1px_var(--ui-line)]">
                  {(["instagram", "youtube"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-label={p}
                      onClick={() => setItem(i, { platform: p, kind: KINDS[p][0] })}
                      className={`grid size-8 place-items-center rounded-lg transition-colors ${it.platform === p ? "bg-ui-ink text-ui-bg" : "text-ui-muted"}`}
                    >
                      <PlatformGlyph platform={p} />
                    </button>
                  ))}
                </div>
                <select className={`${fieldCls} h-9 w-auto py-0`} value={it.kind} onChange={(e) => setItem(i, { kind: e.target.value })}>
                  {KINDS[it.platform].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="flex min-w-0 flex-1 gap-2">
                <input className={`${fieldCls} h-9 min-w-0 py-0`} value={it.detail} placeholder="Length, format, notes" onChange={(e) => setItem(i, { detail: e.target.value })} />
                <button type="button" aria-label="Remove deliverable" onClick={() => set("items", d.items.filter((_, j) => j !== i))} className="grid size-9 shrink-0 place-items-center rounded-lg text-ui-muted hover:bg-ui-panel hover:text-ui-ink">
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("items", [...d.items, { platform: "instagram", kind: "Reel", detail: "" }])}
            className="ui-press inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-ui-line text-sm font-semibold text-ui-muted hover:text-ui-ink"
          >
            <Plus className="size-4" /> Add deliverable
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Drafts due">
            <input type="date" className={fieldCls} value={d.draftDue} onChange={(e) => set("draftDue", e.target.value)} />
          </Field>
          <Field label="Goes live">
            <input type="date" className={fieldCls} value={d.liveDate} onChange={(e) => set("liveDate", e.target.value)} />
          </Field>
        </div>

        <Field
          label="Budget (₹)"
          hint={
            by === "creator" ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3" /> Your rate card suggests {inr(suggestion)} for these deliverables.{" "}
                <button type="button" className="font-semibold text-ui-ink underline underline-offset-2" onClick={() => set("budget", suggestion)}>
                  Use it
                </button>
              </span>
            ) : (
              "Held in escrow by Solo once both sides accept. Released when the work is approved."
            )
          }
        >
          <input inputMode="numeric" className={`${fieldCls} tabular-nums`} value={d.budget ? d.budget.toLocaleString("en-IN") : ""} onChange={(e) => set("budget", Number(e.target.value.replace(/\D/g, "")) || 0)} />
        </Field>

        <label className="flex items-center justify-between gap-3 rounded-xl bg-ui-sunken px-3 py-2.5 text-sm">
          <span>Creator keeps the product</span>
          <input type="checkbox" className="size-4 accent-[var(--ui-ink)]" checked={d.product} onChange={(e) => set("product", e.target.checked)} />
        </label>

        <Field label="Key messages" hint="One per line">
          <textarea rows={3} className={fieldCls} value={msgs} onChange={(e) => setMsgs(e.target.value)} />
        </Field>
        <Field label="Do's and don'ts" hint="One per line">
          <textarea rows={3} className={fieldCls} value={dos} onChange={(e) => setDos(e.target.value)} />
        </Field>
        <Field label="Usage rights">
          <input className={fieldCls} value={d.usage} onChange={(e) => set("usage", e.target.value)} />
        </Field>
        {counter && (
          <Field label="Note with your counter">
            <input className={fieldCls} placeholder="e.g. Extended the YouTube cut to 120 s" value={d.note ?? ""} onChange={(e) => set("note", e.target.value)} />
          </Field>
        )}
      </div>
    </Sheet>
  );
}
