"use client";

import { ArrowLeft, ArrowUp, ArrowUpRight, Ban, BellOff, BellRing, Briefcase, FilePlus2, ShieldAlert, Smartphone, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { agreedBrief, dealMoney, inr, latestBrief } from "@/lib/solo/money";
import { nextStep, STAGE_LABEL, STAGE_TONE } from "@/lib/solo/stages";
import { acceptBrief, acceptRequest, declineBrief, declineThread, dismissAppNudge, reportThread, sendText, toggleBlock, useSolo, WEEKLY_CHAT_LIMIT } from "@/lib/solo/store";
import type { Thread } from "@/lib/solo/types";
import { BriefComposer } from "./brief-composer";
import { SavedReplies, ThreadMenu } from "./chat-controls";
import { MessageItem } from "./cards";
import { DealPanel } from "./deal-panel";
import { Sheet } from "./sheet";
import { BrandMark, Btn, Chip, CreatorMark, VerifiedBadge } from "./ui";

const PHONE = /(\+?\d[\d\s-]{8,}\d)/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;

export function ThreadView({ thread, viewer, onBack }: { thread: Thread; viewer: "creator" | "brand"; onBack?: () => void }) {
  const brand = useSolo((s) => s.brands.find((b) => b.id === thread.brandId)!);
  const creator = useSolo((s) => s.creator);
  const nudgeSeen = useSolo((s) => s.appNudgeSeen);
  const names = { brand: brand.name, creator: creator.name.split(" ")[0] };
  const [text, setText] = useState("");
  const [composer, setComposer] = useState<null | { counter: boolean }>(null);
  const [dealOpen, setDealOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const step = nextStep(thread, viewer, names);
  const isRequest = viewer === "creator" && thread.folder === "requests" && thread.stage === "chat";
  const preDeal = thread.stage === "chat" || thread.stage === "brief";

  // newest message in view
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.messages.length, thread.id]);

  // PRD: nudge to the app after the creator's first funded deal, once
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    if (viewer === "creator" && !nudgeSeen && thread.stage === "production") {
      const t = setTimeout(() => setNudge(true), 900);
      return () => clearTimeout(t);
    }
  }, [viewer, nudgeSeen, thread.stage]);

  const send = () => {
    let body = text.trim();
    if (!body) return;
    // stay on platform: soft-mask contact details before a deal is agreed
    if (preDeal && (PHONE.test(body) || EMAIL.test(body))) {
      body = body.replace(PHONE, "•••• ••••").replace(EMAIL, "••••@••••");
      toast("Contact details hidden", { description: "Deals paid through Solo are protected: escrow, dispute help and invoices." });
    }
    PHONE.lastIndex = 0;
    EMAIL.lastIndex = 0;
    sendText(thread.id, viewer, body);
    setText("");
  };

  const briefActions = () => ({
    onAccept: () => acceptBrief(thread.id, viewer),
    onCounter: () => setComposer({ counter: true }),
    onDecline: () => declineBrief(thread.id, viewer),
  });

  const canBrief = viewer === "brand" && (thread.stage === "chat" || thread.stage === "declined");
  const lb = latestBrief(thread);
  const dealBrief = agreedBrief(thread) ?? lb;
  const money = dealBrief ? dealMoney(dealBrief.budget, creator.plan) : null;
  const inEscrow = ["production", "review", "approved", "live", "dispute"].includes(thread.stage);
  const party =
    viewer === "creator" ? (
      <>
        <BrandMark brand={brand} size={38} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-heading text-[15px] font-semibold">
            {brand.name} <VerifiedBadge v={brand.verification} compact />
            {thread.muted && <BellOff className="size-3.5 text-ui-muted" aria-label="Muted" />}
            {thread.blocked && <Ban className="size-3.5 text-[#dc2626]" aria-label="Blocked" />}
          </p>
          <p className="truncate text-[12px] text-ui-muted">
            {brand.category}
            {brand.paidOnTime >= 3 && " · Pays on time"}
          </p>
        </div>
      </>
    ) : (
      <>
        <CreatorMark name={creator.name} src={creator.avatar} size={38} />
        <div className="min-w-0">
          <p className="truncate font-heading text-[15px] font-semibold">{creator.name}</p>
          <p className="truncate text-[12px] text-ui-muted">
            {creator.handle} · {creator.niche}
          </p>
        </div>
      </>
    );

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-ui-line bg-ui-bg px-3 py-2.5 sm:px-4">
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Back to chats" className="grid size-9 place-items-center rounded-full hover:bg-ui-sunken lg:hidden">
              <ArrowLeft className="size-5" />
            </button>
          )}
          {party}
          <div className="ml-auto flex items-center gap-2">
            {thread.stage !== "chat" && (
              <span className="hidden items-center gap-2 sm:inline-flex">
                <Chip tone={STAGE_TONE[thread.stage]}>{STAGE_LABEL[thread.stage]}</Chip>
                {dealBrief && (
                  <span className="text-right leading-tight">
                    <span className="block font-heading text-[14px] font-semibold tabular-nums">{inr(viewer === "creator" ? money!.payout : money!.brandPays)}</span>
                    <span className="block text-[10.5px] text-ui-muted">{viewer === "creator" ? (inEscrow ? "in escrow for you" : "your payout") : inEscrow ? "in escrow" : "you pay"}</span>
                  </span>
                )}
              </span>
            )}
            {viewer === "creator" && thread.briefs.length > 0 && (
              <Link href="/kit/deals" className="ui-press hidden h-8 items-center gap-1 rounded-lg px-2.5 text-[12.5px] font-semibold text-ui-muted shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken hover:text-ui-ink lg:inline-flex">
                View in Deals <ArrowUpRight className="size-3.5" />
              </Link>
            )}
            <Btn size="sm" variant="ghost" className="lg:hidden" onClick={() => setDealOpen(true)}>
              <Briefcase className="size-3.5" /> Deal
            </Btn>
            {viewer === "creator" && <ThreadMenu thread={thread} />}
          </div>
        </div>

        {/* what's next */}
        <div className={`flex items-center gap-2.5 border-b border-ui-line px-4 py-2 text-[12.5px] ${step.yours ? "bg-ui-accent/25 dark:bg-ui-accent/10" : "bg-ui-sunken/60"}`}>
          <span className={`size-1.5 shrink-0 rounded-full ${step.yours ? "bg-ui-ink" : "bg-ui-muted"}`} />
          <span className={`min-w-0 flex-1 ${step.yours ? "font-semibold" : "text-ui-muted"}`}>{step.text}</span>
          {canBrief && (
            <Btn size="sm" onClick={() => setComposer({ counter: false })}>
              <FilePlus2 className="size-3.5" /> Send brief
            </Btn>
          )}
          {step.yours && !canBrief && thread.stage !== "brief" && (
            <Btn size="sm" variant="ghost" className="lg:hidden" onClick={() => setDealOpen(true)}>
              Open deal
            </Btn>
          )}
        </div>

        {/* messages */}
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 px-3 py-5 sm:px-5">
            {thread.messages.map((m) => (
              <MessageItem key={m.id} m={m} thread={thread} viewer={viewer} names={names} briefActions={briefActions} />
            ))}
            {viewer === "brand" && brand.verification !== "verified" && (
              <div className="mx-auto mt-2 flex w-full max-w-[420px] items-start gap-3 rounded-2xl bg-ui-panel p-3.5 shadow-[0_0_0_1px_var(--ui-line)]">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#d97706]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{brand.verification === "pending" ? "Verification in review" : "Your message landed in Requests"}</p>
                  <p className="text-[12.5px] text-pretty text-ui-muted">
                    {brand.verification === "pending" ? "Once approved, your chats move to creators' main inbox with a Verified badge." : "Creators see verified brands first. Get verified to land in the inbox and message more creators each week."}
                    <span className="mt-1 block font-semibold text-ui-ink">
                      {Math.max(0, WEEKLY_CHAT_LIMIT - (brand.chatsThisWeek ?? 0))} of {WEEKLY_CHAT_LIMIT} new chats left this week
                    </span>
                  </p>
                  {brand.verification === "basic" && (
                    <Link href="/brand/verify" className="mt-2 inline-flex h-8 items-center rounded-lg bg-ui-ink px-3 text-[13px] font-semibold text-ui-bg">
                      Get verified
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* composer */}
        {isRequest ? (
          <div className="flex flex-col gap-2 border-t border-ui-line bg-ui-panel px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="text-[12.5px] text-pretty text-ui-muted">
              {brand.flagged ? "Solo flagged this sender: asking creators to pay is a common scam." : `${brand.name} isn't verified yet. Accept to reply, or ignore it.`}
            </p>
            <div className="flex gap-2">
              <Btn variant="danger" size="sm" onClick={() => reportThread(thread.id)}>
                Report
              </Btn>
              <Btn variant="ghost" size="sm" className="flex-1" onClick={() => declineThread(thread.id)}>
                Ignore
              </Btn>
              <Btn size="sm" className="flex-1" disabled={brand.flagged} onClick={() => acceptRequest(thread.id)}>
                Accept
              </Btn>
            </div>
          </div>
        ) : thread.blocked ? (
          <div className="flex items-center gap-3 border-t border-ui-line bg-ui-panel px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Ban className="size-4 shrink-0 text-ui-muted" />
            <p className="min-w-0 flex-1 text-[13px] text-pretty text-ui-muted">
              {viewer === "creator" ? `You blocked ${brand.name}. They can't message you or send briefs.` : `${names.creator} isn't accepting messages from ${brand.name}.`}
            </p>
            {viewer === "creator" && (
              <Btn size="sm" variant="ghost" onClick={() => toggleBlock(thread.id)}>
                Unblock
              </Btn>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 border-t border-ui-line bg-ui-bg px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
          >
            {viewer === "brand" && (
              <button
                type="button"
                aria-label="Send a brief"
                disabled={!canBrief}
                onClick={() => setComposer({ counter: false })}
                className="ui-press grid size-11 shrink-0 place-items-center rounded-full bg-ui-panel text-ui-ink shadow-[0_0_0_1px_var(--ui-line)] disabled:opacity-40"
              >
                <FilePlus2 className="size-[18px]" />
              </button>
            )}
            {viewer === "creator" && <SavedReplies onPick={(r) => setText((t) => (t.trim() ? `${t.trim()} ${r}` : r))} />}
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${viewer === "creator" ? brand.name : names.creator}`}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] border border-ui-line bg-ui-panel px-4 py-[11px] text-[16px] leading-snug outline-none focus:border-ui-ink/30 sm:text-[14.5px]"
            />
            <button type="submit" aria-label="Send" disabled={!text.trim()} className="ui-press grid size-11 shrink-0 place-items-center rounded-full bg-ui-ink text-ui-bg disabled:opacity-30">
              <ArrowUp className="size-5" />
            </button>
          </form>
        )}
      </div>

      {/* deal panel: a column on desktop, a sheet on phones */}
      <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-ui-line bg-ui-panel lg:block xl:w-[380px]">
        <DealPanel thread={thread} viewer={viewer} names={names} />
      </aside>
      <Sheet open={dealOpen} onOpenChange={setDealOpen} title="Deal" description={step.text}>
        <div className="-mx-6 -mt-3">
          <DealPanel thread={thread} viewer={viewer} names={names} />
        </div>
      </Sheet>

      {composer && (
        <BriefComposer
          key={`${thread.id}-${composer.counter ? lb?.version : "new"}`}
          open
          onOpenChange={(o) => !o && setComposer(null)}
          threadId={thread.id}
          by={viewer}
          base={composer.counter ? lb : undefined}
        />
      )}

      <Sheet
        open={nudge}
        onOpenChange={(o) => {
          if (!o) {
            setNudge(false);
            dismissAppNudge();
          }
        }}
        title="Your first funded deal 🎉"
        description="Everything works right here on the web. The Solo app just makes deal days smoother."
        footer={
          <div className="flex gap-2">
            <Btn
              size="lg"
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setNudge(false);
                dismissAppNudge();
              }}
            >
              Not now
            </Btn>
            <Btn
              size="lg"
              className="flex-1"
              onClick={() => {
                setNudge(false);
                dismissAppNudge();
                toast.success("Link sent to your WhatsApp");
              }}
            >
              <Smartphone className="size-4" /> Get the app
            </Btn>
          </div>
        }
      >
        <ul className="flex flex-col gap-3 pb-2">
          {[
            [BellRing, "Instant alerts instead of WhatsApp pings"],
            [UploadCloud, "Big video drafts upload in the background"],
            [Briefcase, "All your deals and payouts on the go"],
          ].map(([Icon, t]) => {
            const I = Icon as typeof BellRing;
            return (
              <li key={t as string} className="flex items-center gap-3 text-sm">
                <span className="grid size-9 place-items-center rounded-lg bg-ui-sunken">
                  <I className="size-4" />
                </span>
                {t as string}
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
