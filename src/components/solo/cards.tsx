"use client";

import { CalendarDays, CheckCircle2, FileVideo, Link2, Lock, MessageSquareWarning, Package, Wallet } from "lucide-react";
import { fmtDay, fmtWhen, inr } from "@/lib/solo/money";
import type { Brief, Message, Thread } from "@/lib/solo/types";
import { PlatformGlyph } from "./whatsapp-icon";
import { Btn, Chip } from "./ui";

/** What changed between two brief versions, so a counter reads at a glance. */
function diff(prev: Brief | undefined, b: Brief) {
  if (!prev) return [];
  const out: string[] = [];
  if (prev.budget !== b.budget) out.push(`Budget ${inr(prev.budget)} → ${inr(b.budget)}`);
  if (prev.items.length !== b.items.length || prev.items.some((it, i) => it.detail !== b.items[i]?.detail || it.kind !== b.items[i]?.kind)) out.push("Deliverables changed");
  if (prev.draftDue !== b.draftDue || prev.liveDate !== b.liveDate) out.push("Dates changed");
  if (prev.usage !== b.usage) out.push("Usage rights changed");
  return out;
}

export function BriefCard({
  thread,
  brief,
  viewer,
  partyName,
  onAccept,
  onCounter,
  onDecline,
}: {
  thread: Thread;
  brief: Brief;
  viewer: "creator" | "brand";
  partyName: string;
  onAccept: () => void;
  onCounter: () => void;
  onDecline: () => void;
}) {
  const isLatest = thread.briefs.at(-1)?.version === brief.version;
  const accepted = thread.accepted !== undefined && thread.briefs[thread.accepted]?.version === brief.version;
  const canRespond = isLatest && thread.stage === "brief" && brief.by !== viewer;
  const changes = diff(thread.briefs[brief.version - 2], brief);
  const superseded = !isLatest && !accepted;

  return (
    <div className={`w-full max-w-[420px] overflow-hidden rounded-2xl bg-ui-panel shadow-[0_0_0_1px_var(--ui-line),0_8px_24px_-16px_rgb(0_0_0/0.25)] ${superseded ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2 border-b border-ui-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-ui-muted">
            {brief.version === 1 ? "Brief" : "Counter"} · v{brief.version} · from {brief.by === viewer ? "you" : partyName}
          </p>
          <p className="truncate font-heading text-[15px] font-semibold">{brief.title}</p>
        </div>
        {accepted ? <Chip tone="good">Accepted</Chip> : superseded ? <Chip>Replaced</Chip> : thread.stage === "declined" && isLatest ? <Chip>Declined</Chip> : <Chip tone="accent">Open</Chip>}
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {changes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {changes.map((c) => (
              <Chip key={c} tone="warn">
                {c}
              </Chip>
            ))}
          </div>
        )}
        <ul className="flex flex-col gap-1.5">
          {brief.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[13.5px]">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ui-sunken text-ui-muted">
                <PlatformGlyph platform={it.platform} />
              </span>
              <span className="min-w-0">
                <span className="font-semibold">{it.kind}</span> <span className="text-ui-muted">· {it.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          <div className="rounded-lg bg-ui-sunken px-3 py-2">
            <p className="flex items-center gap-1 text-ui-muted">
              <CalendarDays className="size-3" /> Drafts · Live
            </p>
            <p className="font-semibold">
              {fmtDay(brief.draftDue)} · {fmtDay(brief.liveDate)}
            </p>
          </div>
          <div className="rounded-lg bg-ui-sunken px-3 py-2">
            <p className="flex items-center gap-1 text-ui-muted">
              <Wallet className="size-3" /> Budget
            </p>
            <p className="font-semibold tabular-nums">
              {inr(brief.budget)}
              {brief.product && <span className="font-normal text-ui-muted"> + product</span>}
            </p>
          </div>
        </div>
        <details className="group text-[12.5px]">
          <summary className="cursor-pointer list-none font-semibold text-ui-muted hover:text-ui-ink">
            <span className="group-open:hidden">Key messages, do&apos;s and usage</span>
            <span className="hidden group-open:inline">Hide details</span>
          </summary>
          <div className="mt-2 flex flex-col gap-2 text-ui-ink">
            <div>
              <p className="font-semibold">Key messages</p>
              <ul className="list-disc pl-4 text-ui-muted">
                {brief.keyMessages.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Do&apos;s and don&apos;ts</p>
              <ul className="list-disc pl-4 text-ui-muted">
                {brief.dos.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <p>
              <span className="font-semibold">Usage · </span>
              <span className="text-ui-muted">{brief.usage}</span>
            </p>
          </div>
        </details>
        {brief.note && <p className="rounded-lg bg-ui-sunken px-3 py-2 text-[12.5px] text-ui-muted">“{brief.note}”</p>}
      </div>

      {canRespond && (
        <div className="flex gap-2 border-t border-ui-line p-2">
          <Btn size="sm" variant="quiet" onClick={onDecline}>
            Decline
          </Btn>
          <Btn size="sm" variant="ghost" className="flex-1" onClick={onCounter}>
            Counter
          </Btn>
          <Btn size="sm" className="flex-1" onClick={onAccept}>
            Accept
          </Btn>
        </div>
      )}
    </div>
  );
}

function Event({ icon, tone, title, body }: { icon: React.ReactNode; tone: "good" | "neutral" | "warn"; title: string; body?: React.ReactNode }) {
  const ring = tone === "good" ? "bg-[#22c55e]/14 text-[#16a34a]" : tone === "warn" ? "bg-[#f59e0b]/16 text-[#d97706]" : "bg-ui-sunken text-ui-muted";
  return (
    <div className="flex w-full max-w-[420px] items-start gap-3 rounded-2xl bg-ui-panel px-3.5 py-3 shadow-[0_0_0_1px_var(--ui-line)]">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${ring}`}>{icon}</span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[13.5px] font-semibold">{title}</p>
        {body && <div className="text-[12.5px] text-pretty text-ui-muted">{body}</div>}
      </div>
    </div>
  );
}

/** Renders one message. Text = bubble; everything else = a structured event card. */
export function MessageItem({
  m,
  thread,
  viewer,
  names,
  briefActions,
}: {
  m: Message;
  thread: Thread;
  viewer: "creator" | "brand";
  names: { brand: string; creator: string };
  briefActions: () => { onAccept: () => void; onCounter: () => void; onDecline: () => void };
}) {
  const mine = m.from === viewer;
  const align = m.from === "solo" ? "items-center" : mine ? "items-end" : "items-start";
  const d = m.deliverableId ? thread.deliverables.find((x) => x.id === m.deliverableId) : undefined;
  const who = (from: Message["from"]) => (from === viewer ? "You" : from === "brand" ? names.brand : names.creator);

  let body: React.ReactNode = null;
  switch (m.kind) {
    case "text":
      body = (
        <div className={`max-w-[min(78%,420px)] rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-snug text-pretty ${mine ? "rounded-br-[6px] bg-ui-ink text-ui-bg" : "rounded-bl-[6px] bg-ui-panel shadow-[0_0_0_1px_var(--ui-line)]"}`}>
          {m.text}
          {m.auto && <span className={`mt-1 block text-[11px] font-semibold ${mine ? "text-ui-bg/60" : "text-ui-muted"}`}>Auto-reply</span>}
        </div>
      );
      break;
    case "system":
      body = <p className="max-w-[44ch] rounded-full px-3 py-1 text-center text-[12px] text-pretty text-ui-muted">{m.text}</p>;
      break;
    case "brief": {
      const b = thread.briefs.find((x) => x.version === m.briefVersion);
      body = b ? <BriefCard thread={thread} brief={b} viewer={viewer} partyName={b.by === "brand" ? names.brand : names.creator} {...briefActions()} /> : null;
      break;
    }
    case "funded":
      body = (
        <Event
          icon={<Lock className="size-4" />}
          tone="good"
          title={`${inr(m.amount ?? 0)} secured in escrow`}
          body={viewer === "creator" ? "The money is safe with Solo. Start creating; it's released when the work is approved." : "Solo holds the money until you approve the work and the posts go live."}
        />
      );
      break;
    case "draft":
      body = (
        <Event
          icon={<FileVideo className="size-4" />}
          tone="neutral"
          title={`${who(m.from)} submitted ${d?.kind ?? "a"} draft v${m.draftVersion}`}
          body={d?.drafts.find((x) => x.version === m.draftVersion)?.note ?? (d ? d.drafts.at(-1)?.file : undefined)}
        />
      );
      break;
    case "review":
      body =
        m.text === "approved" ? (
          <Event icon={<CheckCircle2 className="size-4" />} tone="good" title={`${who(m.from)} approved the ${d?.kind.toLowerCase() ?? "draft"}`} />
        ) : (
          <Event icon={<MessageSquareWarning className="size-4" />} tone="warn" title={`${who(m.from)} asked for changes on the ${d?.kind.toLowerCase() ?? "draft"}`}
            body={
              <>
                <span className="block">“{m.text}”</span>
                {m.comments?.map((c, i) => (
                  <span key={i} className="mt-1 flex items-start gap-1.5">
                    <span className="shrink-0 rounded bg-[#facc15]/25 px-1 font-mono text-[11px] font-semibold text-ui-ink tabular-nums">{c.at}</span>
                    <span>{c.text}</span>
                  </span>
                ))}
              </>
            }
          />
        );
      break;
    case "live":
      body = <Event icon={<Link2 className="size-4" />} tone="neutral" title={`${d?.kind ?? "Post"} is live`} body={d?.liveUrl} />;
      break;
    case "paid":
      body = (
        <Event
          icon={<Package className="size-4" />}
          tone="good"
          title={viewer === "creator" ? `${inr(m.amount ?? 0)} paid to you` : "Payment released to the creator"}
          body={viewer === "creator" ? "Invoice is in Payouts. Thanks for delivering on time." : "Invoice is ready. Rebook in one tap any time."}
        />
      );
      break;
  }

  return (
    <div className={`flex flex-col gap-1 ${align}`}>
      {body}
      {m.kind !== "system" && <span className="px-1 text-[10.5px] text-ui-muted">{fmtWhen(m.at)}</span>}
    </div>
  );
}
