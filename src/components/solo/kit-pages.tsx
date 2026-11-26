"use client";

import { Download, Lock, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { agreedBrief, dealMoney, fanNet, fmtDay, inr, latestBrief, settled } from "@/lib/solo/money";
import { RAIL, railIndex, STAGE_LABEL, STAGE_TONE } from "@/lib/solo/stages";
import { openThread, useSolo } from "@/lib/solo/store";
import type { Stage } from "@/lib/solo/types";
import { PageHero } from "./page-hero";
import { AppShell } from "./shell";
import { BrandMark, Btn, Card, Chip, Empty, SectionTitle } from "./ui";


/* ───────────── deal tracker ───────────── */

const GROUPS: { label: string; stages: Stage[] }[] = [
  { label: "Negotiating", stages: ["brief", "agreed"] },
  { label: "In progress", stages: ["production", "review", "approved", "live", "dispute"] },
  { label: "Done", stages: ["paid", "declined", "cancelled"] },
];

export function DealsScreen() {
  const s = useSolo((x) => x);
  const router = useRouter();
  const deals = s.threads.filter((t) => t.briefs.length > 0);

  return (
    <AppShell role="creator">
      <div className="flex flex-col gap-8">
        <PageHero
          title="Deals"
          body="Every collaboration from first brief to payout. Tap one to open its chat."
        />
        {deals.length === 0 && <Empty icon={<Wallet className="size-5" />} title="No deals yet" body="Deals start when a brand sends a brief in chat." />}
        {GROUPS.map((g) => {
          const rows = deals.filter((t) => g.stages.includes(t.stage));
          if (!rows.length) return null;
          return (
            <section key={g.label} className="flex flex-col gap-3">
              <SectionTitle>
                {g.label} <span className="font-normal text-ui-muted">· {rows.length}</span>
              </SectionTitle>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
                {rows.map((t) => {
                  const b = s.brands.find((x) => x.id === t.brandId)!;
                  const brief = agreedBrief(t) ?? latestBrief(t)!;
                  const m = dealMoney(brief.budget, s.creator.plan);
                  const at = railIndex(t.stage);
                  const unread = t.unread.creator;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        openThread("creator", t.id);
                        router.push("/inbox");
                      }}
                      className="ui-press flex min-w-0 flex-col gap-4 rounded-2xl bg-ui-panel p-4 text-left shadow-[0_0_0_1px_var(--ui-line)] hover:shadow-[0_0_0_1px_var(--ui-line),0_12px_30px_-18px_rgb(0_0_0/0.3)]"
                    >
                      <div className="flex items-center gap-3">
                        <BrandMark brand={b} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-[15px] font-semibold">{brief.title}</p>
                          <p className="truncate text-[12.5px] text-ui-muted">
                            {b.name} · {brief.items.map((i) => i.kind).join(", ")}
                          </p>
                        </div>
                        <Chip tone={STAGE_TONE[t.stage]}>{STAGE_LABEL[t.stage]}</Chip>
                      </div>
                      <div className="flex gap-1">
                        {RAIL.map((r, i) => (
                          <span key={r.key} className={`h-1 flex-1 rounded-full ${i < at || t.stage === "paid" ? "bg-ui-ink" : i === at ? "bg-ui-accent shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" : "bg-ui-line"}`} />
                        ))}
                      </div>
                      <div className="flex items-end justify-between gap-3 text-[12.5px]">
                        {unread > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-ui-ink">
                            <span className="size-2 rounded-full bg-ui-accent shadow-[0_0_0_1px_rgb(0_0_0/0.2)]" />
                            {unread === 1 ? "New message" : `${unread} new messages`} from {b.name}
                          </span>
                        ) : (
                          <span className="text-ui-muted">
                            {t.stage === "paid" && t.paidAt ? `Paid ${fmtDay(t.paidAt)}` : `Drafts ${fmtDay(brief.draftDue)} · Live ${fmtDay(brief.liveDate)}`}
                          </span>
                        )}
                        <span className="font-heading text-[17px] font-semibold tabular-nums">{inr(m.payout)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

/* ───────────── payouts ───────────── */

export function PayoutsScreen() {
  const s = useSolo((x) => x);
  const paid = s.threads.filter((t) => t.stage === "paid").sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));
  const held = s.threads.filter((t) => ["production", "review", "approved", "live", "dispute"].includes(t.stage));
  const total = (ts: typeof paid) => ts.reduce((n, t) => n + dealMoney(agreedBrief(t)!.budget, s.creator.plan).payout, 0);
  const fanOrders = s.orders.filter(settled);
  const fanTotal = fanOrders.reduce((n, o) => n + fanNet(o, s.creator.plan), 0);
  const fanFees = fanOrders.reduce((n, o) => n + o.amount, 0) - fanTotal;

  return (
    <AppShell role="creator">
      <div className="flex flex-col gap-8">
        <PageHero
          title="Payouts"
          body="Money from Solo deals. Escrowed funds are released after the brand approves and the posts go live."
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-[12.5px] font-semibold text-ui-muted">Paid to you</p>
            <p className="mt-2 font-heading text-[28px] leading-none font-semibold tabular-nums">{inr(total(paid) + fanTotal)}</p>
            <p className="mt-2 text-[12px] text-ui-muted">
              Brand deals {inr(total(paid))} · fan sales {inr(fanTotal)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ui-muted">
              <Lock className="size-3.5" /> In escrow
            </p>
            <p className="mt-2 font-heading text-[28px] leading-none font-semibold tabular-nums">{inr(total(held))}</p>
          </Card>
          <Card className="flex flex-col p-4">
            <p className="text-[12.5px] font-semibold text-ui-muted">Paid to</p>
            <p className="mt-2 truncate font-mono text-[15px] font-semibold">{s.creator.payoutTo}</p>
            <p className="mt-auto pt-2 text-[12px] text-ui-muted">UPI · usually within a day of release</p>
          </Card>
        </div>

        {held.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionTitle>Coming up</SectionTitle>
            <Card className="divide-y divide-ui-line overflow-hidden">
              {held.map((t) => {
                const b = s.brands.find((x) => x.id === t.brandId)!;
                const m = dealMoney(agreedBrief(t)!.budget, s.creator.plan);
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                    <BrandMark brand={b} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{b.name}</p>
                      <p className="text-[12.5px] text-ui-muted">{STAGE_LABEL[t.stage]}</p>
                    </div>
                    <span className="font-semibold tabular-nums">{inr(m.payout)}</span>
                  </div>
                );
              })}
            </Card>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <SectionTitle>Fan sales</SectionTitle>
          <Card className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid size-9 place-items-center rounded-lg bg-ui-sunken">🛍️</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{fanOrders.length} orders from your shop</p>
              <p className="truncate text-[12.5px] text-ui-muted">
                Settled daily to {s.creator.payoutTo} · {inr(fanFees)} Solo fees
              </p>
            </div>
            <span className="font-semibold tabular-nums">{inr(fanTotal)}</span>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Brand deal history</SectionTitle>
          {paid.length === 0 ? (
            <Card>
              <Empty icon={<Wallet className="size-5" />} title="No payouts yet" body="Your first Solo payout shows up here with its invoice." />
            </Card>
          ) : (
            <Card className="divide-y divide-ui-line overflow-hidden">
              {paid.map((t) => {
                const b = s.brands.find((x) => x.id === t.brandId)!;
                const brief = agreedBrief(t)!;
                const m = dealMoney(brief.budget, s.creator.plan);
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                    <BrandMark brand={b} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{brief.title}</p>
                      <p className="truncate text-[12.5px] text-ui-muted">
                        {b.name} · {t.paidAt ? fmtDay(t.paidAt) : ""} · {inr(m.budget)} − {inr(m.creatorFee)} fee
                      </p>
                    </div>
                    <span className="hidden font-semibold tabular-nums sm:inline">{inr(m.payout)}</span>
                    <Btn size="sm" variant="ghost" aria-label="Download invoice" onClick={() => toast.success("Invoice downloaded", { description: `INV-${t.id.slice(-4).toUpperCase()} · GST details included` })}>
                      <Download className="size-3.5" /> <span className="hidden sm:inline">Invoice</span>
                    </Btn>
                  </div>
                );
              })}
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}
