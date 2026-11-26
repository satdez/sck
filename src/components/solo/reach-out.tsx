"use client";

import { BadgeCheck, Lock, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { reachOut, WEEKLY_CHAT_LIMIT } from "@/lib/solo/store";
import { SoloLogo } from "../solo-logo";
import { WhatsAppIcon } from "./whatsapp-icon";

const field =
  "w-full rounded-xl border border-ui-line bg-ui-panel px-3 py-2.5 text-[16px] text-ui-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ui-muted/70 focus:border-ui-ink/40 focus:ring-4 focus:ring-ui-ink/5 sm:text-sm";

/**
 * The Reach out button on every sck.bio page (PRD pillar 2). A brand leaves its details
 * and a note, and a Solo chat opens in the browser. No app, no account wall.
 */
export function ReachOut({ name, trigger }: { name: string; trigger: ReactNode }) {
  const router = useRouter();
  const first = name.split(" ")[0] || "this creator";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ brand: "", email: "", phone: "", note: "" });
  const [sending, setSending] = useState(false);
  const valid = f.brand.trim().length > 1 && /\S+@\S+\.\S+/.test(f.email) && f.note.trim().length > 5;

  const submit = () => {
    if (!valid) return;
    setSending(true);
    if (!reachOut({ ...f, creatorName: name })) {
      setSending(false);
      return;
    }
    setTimeout(() => router.push("/brand"), 350);
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} repositionInputs={false}>
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <Drawer.Content className="app fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] max-w-md flex-col rounded-t-[28px] bg-ui-panel text-ui-ink outline-none">
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-ui-line" />
          <div className="flex items-center gap-2.5 px-6 pt-4">
            <span className="grid h-7 place-items-center rounded-lg bg-[#0b0b0b] px-2">
              <SoloLogo height={12} />
            </span>
            <span className="text-[12px] font-semibold text-ui-muted">Messages go to {first}&apos;s Solo inbox</span>
          </div>
          <div className="px-6 pt-3 pb-2">
            <Drawer.Title className="font-heading text-[22px] leading-tight font-semibold tracking-tight">Reach out to {first}</Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-pretty text-ui-muted">Say what you have in mind. A chat opens right here, and you can send a brief when you&apos;re both ready.</Drawer.Description>
          </div>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-2" data-vaul-no-drag>
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
                  <span className="text-xs font-semibold text-ui-muted">Brand</span>
                  <input className={field} placeholder="boAt" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} autoComplete="organization" />
                </label>
                <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
                  <span className="text-xs font-semibold text-ui-muted">Work email</span>
                  <input className={field} type="email" placeholder="you@brand.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ui-muted">
                  WhatsApp number <span className="font-normal">· for reply alerts</span>
                </span>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2">
                    <WhatsAppIcon />
                  </span>
                  <input className={`${field} pl-9`} inputMode="tel" placeholder="+91 98765 43210" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" />
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ui-muted">Message</span>
                <textarea
                  rows={4}
                  className={field}
                  placeholder={`Hi ${first}! We're launching… and would love…`}
                  value={f.note}
                  onChange={(e) => setF({ ...f, note: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="self-start text-[12px] font-semibold text-ui-muted underline underline-offset-2 hover:text-ui-ink"
                onClick={() =>
                  setF({ brand: "Minimalist", email: "collabs@beminimalist.co", phone: "+91 98765 43210", note: `Hi ${first}! Minimalist here. Our new SPF is made for people at screens all day, and your desk-setup audience is a great fit. Open to a reel in January?` })
                }
              >
                Fill an example
              </button>
              <ul className="mt-1 flex flex-col gap-2 rounded-xl bg-ui-sunken p-3 text-[12.5px] text-ui-muted">
                <li className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-[#2563eb]" /> Verified brands go straight to {first}&apos;s inbox. New brands land in Requests and can start {WEEKLY_CHAT_LIMIT} new chats a week.
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 size-3.5 shrink-0" /> Deals paid through Solo are held in escrow until the work is approved.
                </li>
              </ul>
            </div>
            <div className="border-t border-ui-line px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="submit"
                disabled={!valid || sending}
                className="ui-press inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ui-ink text-[15px] font-semibold text-ui-bg disabled:opacity-40"
              >
                <MessageCircle className="size-4" /> {sending ? "Opening chat…" : "Send and open chat"}
              </button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
