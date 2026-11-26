"use client";

import { ArrowUpRight, BarChart3, Briefcase, ChevronDown, ChevronRight, Copy, Globe, Lock, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { agreedBrief, dealMoney, fanNet, inr, settled } from "@/lib/solo/money";
import { nextStep } from "@/lib/solo/stages";
import { openThread, useSolo } from "@/lib/solo/store";
import { KitTools } from "./kit-tools";
import { SoloMark } from "../solo-logo";
import { AppShell } from "./shell";
import { BrandMark, Card, Chip, SectionTitle } from "./ui";

/** The bolt from the Solo mark (solo-logo SoloMark), alone. viewBox "13 8 25 34". */
const BOLT =
  "M34.3935 10.6074C34.8683 9.812 33.8919 9.0402 33.2119 9.5723L14.7412 24.0351C14.1472 24.4701 14.3755 25.2848 14.9941 25.4473L23.1465 27.5889L16.6084 39.3828C16.131 40.1789 17.1096 40.9512 17.79 40.417L36.3027 25.9219C36.8085 25.5241 36.6461 24.7176 36.0078 24.5478L27.8652 22.3916L34.3935 10.6074Z";

type Kpi = { label: string; value: string; note: string; icon: ReactNode };

/** The money line: one thin row, collapsed by default; opens into the four numbers with their notes. */
function KpiStrip({ items }: { items: Kpi[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 px-4 py-2.5 text-left hover:bg-ui-sunken/50">
        <span className="flex min-w-0 flex-1 items-center gap-x-5 gap-y-1 overflow-hidden">
          {items.map((k, i) => (
            <span key={k.label} className={`flex shrink-0 items-baseline gap-1.5 ${i > 1 ? "hidden md:flex" : ""}`}>
              <span className="text-[12.5px] text-ui-muted">{k.label}</span>
              <span className="font-heading text-[15px] font-semibold tabular-nums">{k.value}</span>
            </span>
          ))}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-ui-muted">
          <span className="hidden sm:inline">{open ? "Less" : "Details"}</span>
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-px border-t border-ui-line bg-ui-line lg:grid-cols-4">
          {items.map((k) => (
            <div key={k.label} className="flex items-center gap-3 bg-ui-panel px-4 py-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ui-sunken text-ui-muted">{k.icon}</span>
              <span className="min-w-0">
                <span className="flex items-baseline gap-1.5">
                  <span className="font-heading text-[17px] font-semibold tabular-nums">{k.value}</span>
                  <span className="truncate text-[12px] font-semibold text-ui-muted">{k.label}</span>
                </span>
                <span className="block truncate text-[11.5px] text-ui-muted">{k.note}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function KitHome() {
  const s = useSolo((x) => x);
  const router = useRouter();
  const first = s.creator.name.split(" ")[0];
  const names = (brandId: string) => ({ brand: s.brands.find((b) => b.id === brandId)!.name, creator: first });

  const dealPaid = s.threads.filter((t) => t.stage === "paid").reduce((n, t) => n + dealMoney(agreedBrief(t)!.budget, s.creator.plan).payout, 0);
  const fanPaid = s.orders.filter(settled).reduce((n, o) => n + fanNet(o, s.creator.plan), 0);
  const paid = dealPaid + fanPaid;
  const questions = s.orders.filter((o) => o.status === "awaiting");
  const escrow = s.threads
    .filter((t) => ["production", "review", "approved", "live", "dispute"].includes(t.stage))
    .reduce((n, t) => n + dealMoney(agreedBrief(t)!.budget, s.creator.plan).payout, 0);
  const active = s.threads.filter((t) => !["paid", "declined", "cancelled", "chat"].includes(t.stage)).length;
  const todo = s.threads.map((t) => ({ t, step: nextStep(t, "creator", names(t.brandId)) })).filter((x) => x.step.yours);

  const go = (id: string) => {
    openThread("creator", id);
    router.push("/inbox");
  };



  return (
    <AppShell role="creator">
      <div className="flex flex-col gap-8">
        {/* hello */}
        <div className="enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" style={{ ["--i" as string]: 0 }}>
          <div>
            <p className="text-sm font-medium text-ui-muted">Thursday, 26 Nov</p>
            <h1 className="font-heading text-[clamp(1.9rem,5vw,2.6rem)] leading-[1.05] font-semibold tracking-tight">Morning, {first}.</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(`https://${s.creator.slug}.sck.bio`).catch(() => {});
              toast.success("Link copied", { description: `${s.creator.slug}.sck.bio` });
            }}
            className="ui-press inline-flex h-10 items-center gap-2 self-start rounded-full bg-ui-panel pr-2 pl-3 text-[13px] font-semibold shadow-[0_0_0_1px_var(--ui-line)] sm:self-auto"
          >
            {/* globe = it's on the internet; the green dot says it's live */}
            <span className="relative">
              <Globe className="size-4 text-ui-muted" strokeWidth={2} />
              <span className="absolute -right-0.5 -bottom-0.5 size-[7px] rounded-full bg-[#22c55e] shadow-[0_0_0_1.5px_var(--ui-panel)]" />
            </span>
            {s.creator.slug}.sck.bio
            <span className="grid size-7 place-items-center rounded-full bg-ui-sunken">
              <Copy className="size-3.5" />
            </span>
          </button>
        </div>

        {/* money */}
        <div className="enter" style={{ ["--i" as string]: 1 }}>
          <KpiStrip
            items={[
              { label: "Earned", value: inr(paid), note: `Deals ${inr(dealPaid)} · fans ${inr(fanPaid)}`, icon: <Wallet className="size-3.5" /> },
              { label: "In escrow", value: inr(escrow), note: "Secured, yours on approval", icon: <Lock className="size-3.5" /> },
              { label: "Active deals", value: String(active), note: "From brief to payout", icon: <Briefcase className="size-3.5" /> },
              { label: "Page visits", value: "3.2k", note: "Last 7 days · 41 brand visits", icon: <BarChart3 className="size-3.5" /> },
            ]}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* needs you */}
          <div className="enter flex flex-col gap-3" style={{ ["--i" as string]: 2 }}>
            <SectionTitle
              action={
                <Link href="/inbox" className="text-[13px] font-semibold text-ui-muted hover:text-ui-ink">
                  Open inbox
                </Link>
              }
            >
              Needs you
            </SectionTitle>
            <Card className="overflow-hidden">
              {questions.length > 0 && (
                <Link href="/kit/store" className="flex items-center gap-3 border-b border-ui-line px-4 py-3.5 transition-colors hover:bg-ui-sunken/60">
                  <span className="grid size-10 place-items-center rounded-lg bg-ui-accent text-ui-accent-ink">
                    <Zap className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">
                      {questions.length} paid question{questions.length === 1 ? "" : "s"} waiting
                    </span>
                    <span className="block truncate text-[13px] text-ui-muted">{inr(questions.reduce((n, o) => n + o.amount, 0))} is yours once you answer</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ui-muted" />
                </Link>
              )}
              {todo.length === 0 ? (
                <p className="p-5 text-sm text-ui-muted">You&apos;re all caught up.</p>
              ) : (
                <ul className="divide-y divide-ui-line">
                  {todo.map(({ t, step }) => {
                    const b = s.brands.find((x) => x.id === t.brandId)!;
                    return (
                      <li key={t.id}>
                        <button type="button" onClick={() => go(t.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ui-sunken/60">
                          <BrandMark brand={b} size={40} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[14px] font-semibold">{b.name}</span>
                              {t.folder === "requests" && <Chip>Request</Chip>}
                              {t.unread.creator > 0 && <span className="size-2 rounded-full bg-ui-accent shadow-[0_0_0_1px_rgb(0_0_0/0.2)]" />}
                            </span>
                            <span className="block truncate text-[13px] text-ui-muted">{step.text}</span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-ui-muted" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* pro */}
          <div className="enter flex flex-col gap-3" style={{ ["--i" as string]: 3 }}>
            <SectionTitle>Your plan</SectionTitle>
            <div className="pro-card relative overflow-hidden rounded-2xl border border-ui-line bg-[#0b0b0b] p-5 text-white">
              <p className="relative text-[12px] font-semibold text-white/50">Free plan · 8% fee on Solo deals</p>
              <p className="relative mt-2 max-w-[24ch] font-heading text-[22px] leading-tight font-semibold tracking-tight">
                Pro is free any month you close a deal on Solo.
              </p>
              <ul className="relative mt-3 flex flex-col gap-1.5 text-[13px] text-white/70">
                {["5% deal fee instead of 8%", "DM automation on stories and lives", "Link analytics and custom domain"].map((t, i) => (
                  <li key={t} className="flex items-center gap-2">
                    <SoloMark className="pro-li-bolt size-4 shrink-0" style={{ ["--i" as string]: i }} />
                    {t}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => toast("Pro is ₹299 a month", { description: "Waived for any month you close a Solo deal." })}
                className="pro-cta ui-press relative mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#96ff43] px-4 text-sm font-semibold text-black"
              >
                <svg aria-hidden viewBox="13 8 25 34" className="pro-cta-bolt h-3.5 w-3">
                  <path d={BOLT} fill="currentColor" />
                </svg>
                See Pro <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* the kit: tools only, grouped by what they help with */}
        <div className="enter flex flex-col gap-6" style={{ ["--i" as string]: 4 }}>
          <div>
            <h2 className="font-heading text-[22px] font-semibold tracking-tight">Your Creator Kit</h2>
            <p className="text-sm text-ui-muted">Tools for your page, your audience and your content. Free to start.</p>
          </div>
          <KitTools />
        </div>
      </div>
    </AppShell>
  );
}
