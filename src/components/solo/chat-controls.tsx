"use client";

import { Ban, Bell, BellOff, Bot, Flag, MessageSquareText, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { addSavedReply, deleteSavedReply, reportThread, setAutoReply, toggleBlock, toggleMute, useSolo } from "@/lib/solo/store";
import type { Thread } from "@/lib/solo/types";
import { Field, fieldCls, Sheet } from "./sheet";
import { Btn } from "./ui";

/** Small anchored menu that closes on outside click or Escape. */
function Popover({ open, onClose, children, align = "right", up }: { open: boolean; onClose: () => void; children: ReactNode; align?: "left" | "right"; up?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !ref.current?.parentElement?.contains(e.target as Node) && onClose();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      className={`absolute z-40 min-w-[220px] rounded-xl bg-ui-panel p-1 shadow-[0_0_0_1px_var(--ui-line),0_16px_40px_-12px_rgb(0_0_0/0.35)] ${align === "right" ? "right-0" : "left-0"} ${up ? "bottom-full mb-2" : "top-full mt-1.5"}`}
    >
      {children}
    </div>
  );
}

function Item({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium hover:bg-ui-sunken ${danger ? "text-[#dc2626]" : ""}`}>
      <span className="grid size-4 place-items-center text-ui-muted">{icon}</span>
      {children}
    </button>
  );
}

/** Creator controls on a chat (PRD: mute, block, report, auto-reply, saved replies). */
export function ThreadMenu({ thread }: { thread: Thread }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div className="relative">
      <button type="button" aria-label="Chat options" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid size-9 place-items-center rounded-full text-ui-muted hover:bg-ui-sunken hover:text-ui-ink">
        <MoreHorizontal className="size-5" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        <Item icon={thread.muted ? <Bell className="size-4" /> : <BellOff className="size-4" />} onClick={run(() => toggleMute(thread.id))}>
          {thread.muted ? "Unmute alerts" : "Mute alerts"}
        </Item>
        <Item icon={<Bot className="size-4" />} onClick={run(() => setSettings(true))}>
          Auto-reply and saved replies
        </Item>
        <div className="my-1 h-px bg-ui-line" />
        <Item icon={<Ban className="size-4" />} onClick={run(() => toggleBlock(thread.id))} danger={!thread.blocked}>
          {thread.blocked ? "Unblock" : "Block brand"}
        </Item>
        <Item icon={<Flag className="size-4" />} onClick={run(() => reportThread(thread.id))} danger>
          Report as spam or scam
        </Item>
      </Popover>
      {settings && <ReplySettings onClose={() => setSettings(false)} />}
    </div>
  );
}

/** Composer button: pick a saved reply to drop into the message box. */
export function SavedReplies({ onPick }: { onPick: (text: string) => void }) {
  const replies = useSolo((s) => s.creator.savedReplies);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Saved replies"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="ui-press grid size-11 shrink-0 place-items-center rounded-full bg-ui-panel text-ui-ink shadow-[0_0_0_1px_var(--ui-line)]"
      >
        <MessageSquareText className="size-[18px]" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} align="left" up>
        <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-[0.06em] text-ui-muted uppercase">Saved replies</p>
        <div className="flex max-h-64 w-[min(340px,80vw)] flex-col overflow-y-auto">
          {replies.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onPick(r);
                setOpen(false);
              }}
              className="rounded-lg px-2.5 py-2 text-left text-[13px] leading-snug text-pretty hover:bg-ui-sunken"
            >
              {r}
            </button>
          ))}
          {!replies.length && <p className="px-2.5 py-2 text-[13px] text-ui-muted">None yet.</p>}
        </div>
        <div className="my-1 h-px bg-ui-line" />
        <Item
          icon={<Plus className="size-4" />}
          onClick={() => {
            setOpen(false);
            setSettings(true);
          }}
        >
          Manage saved replies
        </Item>
      </Popover>
      {settings && <ReplySettings onClose={() => setSettings(false)} />}
    </div>
  );
}

function ReplySettings({ onClose }: { onClose: () => void }) {
  const auto = useSolo((s) => s.creator.autoReply);
  const replies = useSolo((s) => s.creator.savedReplies);
  const [draft, setDraft] = useState("");
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Replies" description="Answer brands faster. These only apply to brand chats." footer={<Btn size="lg" className="w-full" onClick={onClose}>Done</Btn>}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-4 rounded-xl bg-ui-sunken/60 px-3.5 py-3">
            <span>
              <span className="block text-sm font-semibold">Auto-reply to new brands</span>
              <span className="block text-[12.5px] text-ui-muted">Sent once, right after a brand&apos;s first message.</span>
            </span>
            <input type="checkbox" className="size-4 shrink-0 accent-[var(--ui-ink)]" checked={auto.on} onChange={(e) => setAutoReply({ on: e.target.checked })} />
          </label>
          {auto.on && (
            <Field label="Auto-reply message">
              <textarea rows={3} className={fieldCls} value={auto.text} maxLength={280} onChange={(e) => setAutoReply({ text: e.target.value })} />
            </Field>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ui-muted">Saved replies</span>
          <ul className="flex flex-col gap-1.5">
            {replies.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-ui-sunken/60 px-3 py-2 text-[13px] text-pretty">
                <span className="min-w-0 flex-1">{r}</span>
                <button type="button" aria-label="Delete saved reply" onClick={() => deleteSavedReply(i)} className="shrink-0 text-ui-muted hover:text-[#dc2626]">
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              addSavedReply(draft.trim());
              setDraft("");
            }}
          >
            <input className={fieldCls} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a reply you send often" />
            <Btn type="submit" variant="ghost" className="!h-auto" disabled={!draft.trim()}>
              Add
            </Btn>
          </form>
        </div>
      </div>
    </Sheet>
  );
}
