"use client";

import { Check, CircleDot, Clock, Plus, X, CreditCard, FileVideo, Flag, Link2, Lock, ShieldCheck, Smartphone, Star, Upload } from "lucide-react";
import { useState } from "react";
import { agreedBrief, dealMoney, fmtDay, fmtDue, inr, latestBrief } from "@/lib/solo/money";
import { RAIL, railIndex } from "@/lib/solo/stages";
import { cancelDeal, fundDeal, lapseDeal, markLive, openDispute, rateDeal, reviewDraft, submitDraft, useSolo } from "@/lib/solo/store";
import type { Deliverable, DraftComment, Thread } from "@/lib/solo/types";
import { PlatformGlyph } from "./whatsapp-icon";
import { Field, fieldCls, Sheet } from "./sheet";
import { Btn, Chip } from "./ui";

export function Rail({ thread }: { thread: Thread }) {
  const at = railIndex(thread.stage);
  return (
    <ol className="flex items-center gap-1" aria-label="Deal progress">
      {RAIL.map((r, i) => {
        const done = i < at || thread.stage === "paid";
        const now = i === at && thread.stage !== "paid";
        return (
          <li key={r.key} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={`h-1.5 rounded-full transition-colors duration-300 ${done ? "bg-ui-ink" : now ? "bg-ui-accent shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" : "bg-ui-line"}`} />
            <span className={`truncate text-[10.5px] font-semibold ${done || now ? "text-ui-ink" : "text-ui-muted"}`}>{r.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

const statusChip: Record<Deliverable["status"], { label: string; tone: "neutral" | "warn" | "good" | "accent" | "bad" }> = {
  todo: { label: "To do", tone: "neutral" },
  submitted: { label: "In review", tone: "warn" },
  changes: { label: "Changes asked", tone: "bad" },
  approved: { label: "Approved", tone: "accent" },
  live: { label: "Live", tone: "good" },
};

/** The deal beside the chat: progress, money, deliverables and the one action that's yours. */
export function DealPanel({ thread, viewer, names }: { thread: Thread; viewer: "creator" | "brand"; names: { brand: string; creator: string } }) {
  const plan = useSolo((s) => s.creator.plan);
  const brief = agreedBrief(thread) ?? latestBrief(thread);
  // seeded deals have no agreedAt; treat them as just agreed
  const fundBy = (thread.agreedAt ?? thread.messages.at(-1)?.at ?? thread.createdAt) + 48 * 3_600_000;
  const [sheet, setSheet] = useState<null | { kind: "fund" } | { kind: "upload" | "review" | "live"; d: Deliverable } | { kind: "dispute" }>(null);

  if (!brief)
    return (
      <div className="flex flex-col gap-3 p-5">
        <p className="font-heading text-[15px] font-semibold">No deal yet</p>
        <p className="text-sm text-pretty text-ui-muted">
          {viewer === "brand" ? "When you're ready, send a brief: deliverables, dates and budget in one card." : `When ${names.brand} sends a brief, the deal shows up here with its money and deliverables.`}
        </p>
        <ol className="mt-2 flex flex-col gap-2.5 text-[13px] text-ui-muted">
          {["Brief and negotiate in chat", "Brand funds escrow, Solo holds it", "Drafts reviewed, posts go live", "Solo releases the payout"].map((s, i) => (
            <li key={s} className="flex items-center gap-2.5">
              <span className="grid size-6 place-items-center rounded-full bg-ui-sunken text-[11px] font-bold">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    );

  const m = dealMoney(brief.budget, plan);
  const funded = railIndex(thread.stage) >= 2 || thread.stage === "dispute";
  const inWork = ["production", "review", "approved", "live"].includes(thread.stage);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-ui-muted">{agreedBrief(thread) ? `Deal · brief v${brief.version}` : `Proposal · v${brief.version}`}</p>
            <p className="font-heading text-[17px] leading-tight font-semibold">{brief.title}</p>
          </div>
          {funded && thread.stage !== "paid" && thread.stage !== "cancelled" && (
            <Chip tone="good">
              <Lock className="size-3" /> Escrow
            </Chip>
          )}
        </div>
        <Rail thread={thread} />
      </div>

      {/* money: each side sees its own numbers */}
      <div className="rounded-xl bg-ui-sunken p-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-semibold text-ui-muted">{viewer === "creator" ? "You receive" : "You pay"}</span>
          <span className="font-heading text-2xl font-semibold tabular-nums">{inr(viewer === "creator" ? m.payout : m.brandPays)}</span>
        </div>
        <div className="mt-2 flex flex-col gap-1 border-t border-ui-line pt-2 text-[12.5px] text-ui-muted">
          <div className="flex justify-between">
            <span>Deal value</span>
            <span className="tabular-nums">{inr(m.budget)}</span>
          </div>
          {viewer === "creator" ? (
            <div className="flex justify-between">
              <span>Solo fee ({plan === "pro" ? "5%, Pro" : "8%, free plan"})</span>
              <span className="tabular-nums">−{inr(m.creatorFee)}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span>Solo fee (6%) · escrow, contract, invoice</span>
              <span className="tabular-nums">+{inr(m.brandFee)}</span>
            </div>
          )}
          {brief.product && (
            <div className="flex justify-between">
              <span>Product</span>
              <span>{viewer === "creator" ? "You keep it" : "Shipped to creator"}</span>
            </div>
          )}
        </div>
      </div>

      {/* the stage action */}
      {thread.stage === "agreed" && (
        <div className="flex flex-col gap-2 rounded-xl bg-[#f59e0b]/12 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold">
            <Clock className="size-3.5" /> Fund by {fmtDue(fundBy)}
          </p>
          <p className="text-[12.5px] text-pretty text-ui-muted">
            {viewer === "brand"
              ? "Production starts once the money is in escrow. After 48 h the deal lapses and you'd need to agree again."
              : `Don't start yet. You'll get a WhatsApp when ${names.brand} funds. If they don't within 48 h, the deal lapses and nobody is charged.`}
          </p>
          {viewer === "brand" ? (
            <Btn size="lg" onClick={() => setSheet({ kind: "fund" })}>
              <Lock className="size-4" /> Fund {inr(m.brandPays)} to start
            </Btn>
          ) : (
            <button type="button" onClick={() => lapseDeal(thread.id)} className="self-start text-[11.5px] font-semibold text-ui-muted underline underline-offset-2 hover:text-ui-ink">
              Demo: skip ahead 48 h
            </button>
          )}
        </div>
      )}

      {thread.deliverables.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ui-muted">Deliverables</p>
            <p className="text-[11.5px] text-ui-muted">
              Drafts {fmtDay(brief.draftDue)} · Live {fmtDay(brief.liveDate)} · {Math.max(0, 2 - thread.revisionsUsed)} revision{2 - thread.revisionsUsed === 1 ? "" : "s"} left
            </p>
          </div>
          {thread.deliverables.map((d) => {
            const c = statusChip[d.status];
            const last = d.drafts.at(-1);
            return (
              <div key={d.id} className="flex flex-col gap-2 rounded-xl p-3 shadow-[0_0_0_1px_var(--ui-line)]">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ui-sunken text-ui-muted">
                    <PlatformGlyph platform={d.platform} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{d.kind}</p>
                    <p className="truncate text-[12px] text-ui-muted">{d.detail}</p>
                  </div>
                  <Chip tone={c.tone}>{c.label}</Chip>
                </div>
                {last && (
                  <div className="flex items-center gap-2 rounded-lg bg-ui-sunken px-2.5 py-2 text-[12px]">
                    <FileVideo className="size-3.5 shrink-0 text-ui-muted" />
                    <span className="min-w-0 flex-1 truncate">{last.file}</span>
                    <span className="text-ui-muted">v{last.version}</span>
                  </div>
                )}
                {last?.feedback && d.status === "changes" && <p className="text-[12px] text-pretty text-[#b91c1c] dark:text-[#ff8a8a]">“{last.feedback}”</p>}
                {last?.comments && d.status === "changes" && <CommentList comments={last.comments} />}
                {d.liveUrl && (
                  <p className="flex items-center gap-1.5 truncate text-[12px] text-ui-muted">
                    <Link2 className="size-3.5" /> {d.liveUrl}
                  </p>
                )}
                {/* creator actions */}
                {viewer === "creator" && inWork && (d.status === "todo" || d.status === "changes") && (
                  <Btn size="sm" variant="solid" onClick={() => setSheet({ kind: "upload", d })}>
                    <Upload className="size-3.5" /> {d.status === "changes" ? "Upload revision" : "Upload draft"}
                  </Btn>
                )}
                {viewer === "creator" && d.status === "approved" && (
                  <Btn size="sm" variant="solid" onClick={() => setSheet({ kind: "live", d })}>
                    <Link2 className="size-3.5" /> Posted? Add the link
                  </Btn>
                )}
                {/* brand actions */}
                {viewer === "brand" && d.status === "submitted" && (
                  <Btn size="sm" variant="solid" onClick={() => setSheet({ kind: "review", d })}>
                    Review draft v{last?.version}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      )}

      {thread.adminReview === "queued" && (
        <p className="flex items-start gap-2 rounded-xl bg-ui-sunken px-3 py-2.5 text-[12.5px] text-pretty text-ui-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" /> First deal with this brand: a Solo reviewer also checks drafts against the brief.
        </p>
      )}

      {thread.stage === "paid" && (
        <div className="flex flex-col gap-2 rounded-xl bg-[#22c55e]/10 p-3.5">
          <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">
            <Check className="size-4 text-[#16a34a]" /> Paid {inr(m.payout)} to {viewer === "creator" ? "your UPI" : names.creator}
          </p>
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[12px] text-ui-muted">Rate {viewer === "creator" ? names.brand : names.creator}</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} stars`} onClick={() => rateDeal(thread.id, n)} className="ui-press">
                <Star className={`size-5 ${n <= (thread.rating ?? 0) ? "fill-[#f59e0b] text-[#f59e0b]" : "text-ui-line"}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {inWork && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
          {viewer === "brand" && thread.stage === "production" && thread.deliverables.every((d) => d.drafts.length === 0) && (
            <button type="button" onClick={() => cancelDeal(thread.id)} className="font-semibold text-ui-muted hover:text-ui-ink">
              Cancel for a full refund
            </button>
          )}
          <button type="button" onClick={() => setSheet({ kind: "dispute" })} className="inline-flex items-center gap-1 font-semibold text-ui-muted hover:text-ui-ink">
            <Flag className="size-3" /> Report a problem
          </button>
        </div>
      )}

      {sheet?.kind === "fund" && <FundSheet thread={thread} total={m.brandPays} budget={m.budget} fee={m.brandFee} onClose={() => setSheet(null)} />}
      {sheet?.kind === "upload" && <UploadSheet thread={thread} d={sheet.d} onClose={() => setSheet(null)} />}
      {sheet?.kind === "review" && <ReviewSheet thread={thread} d={sheet.d} revisionsLeft={2 - thread.revisionsUsed} onClose={() => setSheet(null)} />}
      {sheet?.kind === "live" && <LiveSheet thread={thread} d={sheet.d} onClose={() => setSheet(null)} />}
      {sheet?.kind === "dispute" && <DisputeSheet thread={thread} viewer={viewer} onClose={() => setSheet(null)} />}
    </div>
  );
}

/* ───────────── action sheets ───────────── */

function FundSheet({ thread, total, budget, fee, onClose }: { thread: Thread; total: number; budget: number; fee: number; onClose: () => void }) {
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [paying, setPaying] = useState(false);
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title="Fund the deal"
      description="Solo holds this in escrow. The creator is paid only after you approve the work and the posts go live."
      footer={
        <Btn
          size="lg"
          className="w-full"
          disabled={paying}
          onClick={() => {
            setPaying(true);
            setTimeout(() => {
              fundDeal(thread.id);
              onClose();
            }, 900);
          }}
        >
          {paying ? "Confirming payment…" : `Pay ${inr(total)}`}
        </Btn>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 rounded-xl bg-ui-sunken p-3.5 text-sm">
          <div className="flex justify-between">
            <span className="text-ui-muted">Deal value</span>
            <span className="tabular-nums">{inr(budget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ui-muted">Solo fee (6%)</span>
            <span className="tabular-nums">{inr(fee)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-ui-line pt-2 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{inr(total)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["upi", "UPI", Smartphone],
              ["card", "Card", CreditCard],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMethod(k)}
              className={`ui-press flex h-14 items-center gap-2.5 rounded-xl px-3.5 text-sm font-semibold ${method === k ? "bg-ui-panel shadow-[inset_0_0_0_2px_var(--ui-ink)]" : "bg-ui-panel shadow-[inset_0_0_0_1px_var(--ui-line)]"}`}
            >
              <Icon className="size-4" /> {label}
              {method === k && <CircleDot className="ml-auto size-4" />}
            </button>
          ))}
        </div>
        {method === "upi" ? (
          <Field label="UPI ID">
            <input className={fieldCls} defaultValue="brand@okicici" />
          </Field>
        ) : (
          <Field label="Card number">
            <input className={fieldCls} defaultValue="4242 4242 4242 4242" />
          </Field>
        )}
        <p className="text-[12px] text-pretty text-ui-muted">Prototype: no money moves. Cancel before any drafts for a full refund.</p>
      </div>
    </Sheet>
  );
}

function UploadSheet({ thread, d, onClose }: { thread: Thread; d: Deliverable; onClose: () => void }) {
  const brandSlug = thread.brandId.replace(/[^a-z]/g, "").slice(0, 10) || "brand";
  const [file, setFile] = useState(`${brandSlug}-${d.kind.toLowerCase()}-v${d.drafts.length + 1}.mp4`);
  const [note, setNote] = useState("");
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Upload ${d.kind.toLowerCase()} draft`}
      description="The brand reviews it here. Large videos upload faster in the Solo app."
      footer={
        <Btn
          size="lg"
          className="w-full"
          onClick={() => {
            submitDraft(thread.id, d.id, file, note);
            onClose();
          }}
        >
          Submit for review
        </Btn>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-ui-line bg-ui-sunken px-4 py-7 text-center">
          <Upload className="size-5 text-ui-muted" />
          <span className="text-sm font-semibold">{file}</span>
          <span className="text-[12px] text-ui-muted">Tap to pick a different file</span>
          <input type="file" accept="video/*,image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0].name)} />
        </label>
        <Field label="Note for the brand (optional)">
          <textarea rows={2} className={fieldCls} placeholder="e.g. Kept the fit test at 0:12 as asked" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}

function ReviewSheet({ thread, d, revisionsLeft, onClose }: { thread: Thread; d: Deliverable; revisionsLeft: number; onClose: () => void }) {
  const [feedback, setFeedback] = useState("");
  const [comments, setComments] = useState<DraftComment[]>([]);
  const [at, setAt] = useState("0:00");
  const [note, setNote] = useState("");
  const last = d.drafts.at(-1)!;
  const okTime = /^\d{1,2}:[0-5]\d$/.test(at);
  const addComment = () => {
    if (!okTime || !note.trim()) return;
    setComments((c) => [...c, { at, text: note.trim() }].sort((a, b) => secs(a.at) - secs(b.at)));
    setNote("");
  };
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Review ${d.kind.toLowerCase()} v${last.version}`}
      description={`${revisionsLeft} revision round${revisionsLeft === 1 ? "" : "s"} left. No response in 72 h auto-approves the draft.`}
      footer={
        <div className="flex gap-2">
          <Btn
            size="lg"
            variant="ghost"
            className="flex-1"
            disabled={(!feedback.trim() && !comments.length) || revisionsLeft <= 0}
            onClick={() => {
              reviewDraft(thread.id, d.id, "changes", feedback.trim() || `${comments.length} comment${comments.length === 1 ? "" : "s"} on the draft`, comments);
              onClose();
            }}
          >
            Ask for changes
          </Btn>
          <Btn
            size="lg"
            className="flex-1"
            onClick={() => {
              reviewDraft(thread.id, d.id, "approve");
              onClose();
            }}
          >
            Approve
          </Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="relative grid aspect-[9/12] max-h-[300px] w-full place-items-center overflow-hidden rounded-2xl bg-[#111] text-white sm:aspect-video">
          <FileVideo className="size-8 opacity-40" />
          <span className="absolute top-3 left-3 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">{last.file}</span>
          {/* scrubber with a pin per comment (mock 60 s video) */}
          <div className="absolute inset-x-3 bottom-3 h-1 rounded-full bg-white/25">
            {comments.map((c, i) => (
              <span key={i} title={`${c.at} ${c.text}`} className="absolute -top-1 size-3 -translate-x-1/2 rounded-full bg-[#facc15] shadow-[0_0_0_2px_#111]" style={{ left: `${Math.min(100, (secs(c.at) / 60) * 100)}%` }} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ui-muted">Comments at a moment in the video</span>
          {comments.length > 0 && <CommentList comments={comments} onRemove={(i) => setComments((c) => c.filter((_, j) => j !== i))} />}
          <div className="flex gap-2">
            <input aria-label="Time" className={`${fieldCls} !w-[72px] text-center tabular-nums ${okTime ? "" : "!border-[#ef4444]"}`} value={at} onChange={(e) => setAt(e.target.value)} placeholder="0:12" />
            <input
              aria-label="Comment"
              className={fieldCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addComment();
                }
              }}
              placeholder="e.g. Show the price on screen here"
            />
            <Btn variant="ghost" className="!h-auto" aria-label="Add comment" disabled={!okTime || !note.trim()} onClick={addComment}>
              <Plus className="size-4" />
            </Btn>
          </div>
        </div>
        {last.note && <p className="rounded-xl bg-ui-sunken px-3 py-2.5 text-[13px] text-pretty">“{last.note}”</p>}
        <Field label="Overall note (optional)">
          <textarea rows={3} className={fieldCls} placeholder="e.g. Mention the launch price at the end, and add #ad on screen" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}

function LiveSheet({ thread, d, onClose }: { thread: Thread; d: Deliverable; onClose: () => void }) {
  const [url, setUrl] = useState(d.platform === "youtube" ? "youtube.com/watch?v=" : "instagram.com/reel/");
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title="Add the live link"
      description="Solo checks the post matches the approved draft, then releases your payment."
      footer={
        <Btn
          size="lg"
          className="w-full"
          disabled={url.length < 12}
          onClick={() => {
            markLive(thread.id, d.id, url);
            onClose();
          }}
        >
          Mark as live
        </Btn>
      }
    >
      <Field label={`${d.kind} link`}>
        <input className={fieldCls} value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
      </Field>
    </Sheet>
  );
}

function DisputeSheet({ thread, viewer, onClose }: { thread: Thread; viewer: "creator" | "brand"; onClose: () => void }) {
  const reasons = viewer === "brand" ? ["Drafts are late", "Work doesn't match the brief", "Creator stopped replying"] : ["Brand stopped replying", "Brand wants work outside the brief", "Too many change requests"];
  const [r, setR] = useState(reasons[0]);
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title="Report a problem"
      description="The money stays in escrow while a Solo admin reads the brief and this chat, then decides: pay, part-pay or refund."
      footer={
        <Btn
          size="lg"
          variant="danger"
          className="w-full"
          onClick={() => {
            openDispute(thread.id, viewer, r);
            onClose();
          }}
        >
          Open a dispute
        </Btn>
      }
    >
      <div className="flex flex-col gap-2">
        {reasons.map((x) => (
          <button key={x} type="button" onClick={() => setR(x)} className={`flex h-12 items-center rounded-xl px-3.5 text-left text-sm font-medium ${r === x ? "shadow-[inset_0_0_0_2px_var(--ui-ink)]" : "shadow-[inset_0_0_0_1px_var(--ui-line)]"}`}>
            {x}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

const secs = (t: string) => {
  const [m, s] = t.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
};

/** Brand comments pinned to moments in a draft. */
function CommentList({ comments, onRemove }: { comments: DraftComment[]; onRemove?: (i: number) => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {comments.map((c, i) => (
        <li key={i} className="flex items-start gap-2 rounded-lg bg-ui-sunken px-2.5 py-1.5 text-[12.5px]">
          <span className="shrink-0 rounded-md bg-[#facc15]/25 px-1.5 font-mono text-[11.5px] font-semibold tabular-nums">{c.at}</span>
          <span className="min-w-0 flex-1 text-pretty">{c.text}</span>
          {onRemove && (
            <button type="button" aria-label="Remove comment" onClick={() => onRemove(i)} className="shrink-0 text-ui-muted hover:text-ui-ink">
              <X className="size-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
