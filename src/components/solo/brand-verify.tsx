"use client";

import { BadgeCheck, Check, Clock, CreditCard, FileText, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { submitVerification, useSolo } from "@/lib/solo/store";
import { AppShell } from "./shell";
import { Field, fieldCls } from "./sheet";
import { Btn, Card, Chip } from "./ui";

const LEVELS = [
  { key: "basic", name: "Basic", how: "Work email or phone OTP", gets: ["Message creators", "Lands in their Requests", "5 new chats a week"] },
  { key: "verified", name: "Verified by Solo", how: "GST, a person check, payment on file", gets: ["Blue badge on every message", "Straight to the creator's inbox", "50 new chats a week"] },
  { key: "trusted", name: "Trusted", how: "Earned: 3+ deals paid on time", gets: ["“Pays on time” label", "Shown first to creators", "Faster payout terms"] },
] as const;

export function BrandVerify() {
  const brand = useSolo((s) => s.brands.find((b) => b.id === s.brandSelf)!);
  const [done, setDone] = useState({ business: !!brand.gst, person: false, payment: false });
  const [gst, setGst] = useState(brand.gst ?? "");
  const [legal, setLegal] = useState(`${brand.name} Pvt Ltd`);
  const level = brand.verification === "verified" ? (brand.paidOnTime >= 3 ? 2 : 1) : 0;
  const ready = done.business && done.person && done.payment;

  return (
    <AppShell role="brand">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div>
          <h1 className="font-heading text-[clamp(1.75rem,4.5vw,2.25rem)] leading-tight font-semibold tracking-tight">Get Verified by Solo</h1>
          <p className="mt-1 max-w-[56ch] text-sm text-pretty text-ui-muted">Creators ignore brands they don&apos;t know. The badge tells them you&apos;re real and you pay. It takes about 10 minutes.</p>
        </div>

        {/* ladder */}
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l, i) => (
            <Card key={l.key} className={`flex flex-col gap-3 p-4 ${i === level ? "shadow-[0_0_0_2px_var(--ui-ink)]" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-heading text-[15px] font-semibold">
                  {i > 0 && <BadgeCheck className={`size-4 ${i === 1 ? "text-[#2563eb]" : "text-[#16a34a]"}`} />}
                  {l.name}
                </p>
                {i === level && <Chip tone="accent">You</Chip>}
              </div>
              <p className="text-[12.5px] text-ui-muted">{l.how}</p>
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {l.gets.map((g) => (
                  <li key={g} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-ui-muted" />
                    {g}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {brand.verification === "verified" ? (
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="flex items-center gap-2 font-heading text-lg font-semibold">
              <BadgeCheck className="size-5 text-[#2563eb]" /> {brand.name} is Verified by Solo
            </p>
            <p className="text-sm text-ui-muted">Your chats go straight to creators&apos; inboxes. {brand.paidOnTime} deals paid on time so far.</p>
            <Link href="/brand" className="ui-press inline-flex h-10 items-center rounded-xl bg-ui-ink px-4 text-sm font-semibold text-ui-bg">
              Back to chats
            </Link>
          </Card>
        ) : brand.verification === "pending" ? (
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Clock className="size-5 text-[#d97706]" /> In review
            </p>
            <p className="text-sm text-pretty text-ui-muted">The Solo team checks your documents within a working day. You&apos;ll get a WhatsApp when it&apos;s done.</p>
            <p className="text-[12.5px] text-ui-muted">Prototype: switch to Solo admin to approve it.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <Step n={1} title="Business details" icon={<FileText className="size-4" />} done={done.business}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Legal name">
                  <input className={fieldCls} value={legal} onChange={(e) => setLegal(e.target.value)} />
                </Field>
                <Field label="GSTIN or CIN">
                  <input className={`${fieldCls} font-mono uppercase`} placeholder="29ABCDE1234F1Z5" value={gst} onChange={(e) => setGst(e.target.value)} />
                </Field>
              </div>
              <Btn size="sm" variant="solid" className="self-start" disabled={gst.length < 10} onClick={() => setDone((d) => ({ ...d, business: true }))}>
                Save
              </Btn>
            </Step>
            <Step n={2} title="A quick person check" icon={<Video className="size-4" />} done={done.person}>
              <p className="text-[13px] text-pretty text-ui-muted">A 2-minute video call or Aadhaar-based KYC for the person who runs your creator deals.</p>
              <Btn size="sm" variant="solid" className="self-start" onClick={() => setDone((d) => ({ ...d, person: true }))}>
                Start check
              </Btn>
            </Step>
            <Step n={3} title="Payment method on file" icon={<CreditCard className="size-4" />} done={done.payment}>
              <p className="text-[13px] text-pretty text-ui-muted">Used to fund escrow. Nothing is charged now.</p>
              <Btn size="sm" variant="solid" className="self-start" onClick={() => setDone((d) => ({ ...d, payment: true }))}>
                Add UPI or card
              </Btn>
            </Step>
            <Btn size="lg" disabled={!ready} onClick={() => submitVerification(brand.id, gst.toUpperCase())}>
              Submit for review
            </Btn>
            <p className="text-center text-[12px] text-ui-muted">Free while we&apos;re in beta. Later a one-time fee, waived if you fund your first deal.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Step({ n, title, icon, done, children }: { n: number; title: string; icon: React.ReactNode; done: boolean; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className={`grid size-8 place-items-center rounded-full text-[13px] font-bold ${done ? "bg-[#22c55e] text-white" : "bg-ui-sunken text-ui-muted"}`}>{done ? <Check className="size-4" /> : n}</span>
        <p className="flex-1 font-semibold">{title}</p>
        <span className="text-ui-muted">{icon}</span>
      </div>
      {!done && <div className="flex flex-col gap-3 pl-11">{children}</div>}
    </Card>
  );
}
