"use client";

import { BadgeCheck, CheckCircle2, FileVideo, Gavel, Landmark, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { agreedBrief, dealMoney, fanNet, inr, settled } from "@/lib/solo/money";
import { decideVerification, passAdminReview, releasePayment, resolveDispute, useSolo } from "@/lib/solo/store";
import type { Thread } from "@/lib/solo/types";
import { AppShell } from "./shell";
import { BrandMark, Btn, Card, Chip, Empty } from "./ui";

type Tab = "verify" | "drafts" | "payouts" | "disputes";

export function AdminScreen() {
  const s = useSolo((x) => x);
  const [tab, setTab] = useState<Tab>("verify");
  const brand = (t: Thread) => s.brands.find((b) => b.id === t.brandId)!;

  const pending = s.brands.filter((b) => b.verification === "pending");
  const drafts = s.threads.filter((t) => t.adminReview === "queued" && t.deliverables.some((d) => d.drafts.length > 0));
  const payouts = s.threads.filter((t) => t.stage === "live");
  const disputes = s.threads.filter((t) => t.stage === "dispute");

  const funded = s.threads.filter((t) => t.accepted !== undefined && !["agreed", "declined", "cancelled"].includes(t.stage));
  const gmv = funded.reduce((n, t) => n + agreedBrief(t)!.budget, 0);
  const fan = s.orders.filter(settled);
  const fanGmv = fan.reduce((n, o) => n + o.amount, 0);
  const take = funded.reduce((n, t) => n + dealMoney(agreedBrief(t)!.budget, s.creator.plan).soloEarns, 0) + fan.reduce((n, o) => n + o.amount - fanNet(o, s.creator.plan), 0);
  const volume = gmv + fanGmv;

  const tabs: { k: Tab; label: string; n: number; icon: typeof Landmark }[] = [
    { k: "verify", label: "Brand checks", n: pending.length, icon: BadgeCheck },
    { k: "drafts", label: "Draft checks", n: drafts.length, icon: FileVideo },
    { k: "payouts", label: "Payouts", n: payouts.length, icon: Landmark },
    { k: "disputes", label: "Disputes", n: disputes.length, icon: Gavel },
  ];

  return (
    <AppShell role="admin">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-heading text-[clamp(1.75rem,4.5vw,2.25rem)] leading-tight font-semibold tracking-tight">Solo ops</h1>
          <p className="mt-1 text-sm text-ui-muted">Verify brands, check first-deal drafts, release payouts, settle disputes.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Money through Solo", inr(volume)],
            ["Solo revenue", inr(take)],
            ["Take rate", volume ? `${Math.round((take / volume) * 100)}%` : "0%"],
            ["Open queue", String(pending.length + drafts.length + payouts.length + disputes.length)],
          ].map(([l, v]) => (
            <Card key={l} className="p-4">
              <p className="text-[12.5px] font-semibold text-ui-muted">{l}</p>
              <p className="mt-2 font-heading text-[26px] leading-none font-semibold tabular-nums">{v}</p>
            </Card>
          ))}
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={`ui-press inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold ${tab === t.k ? "bg-ui-ink text-ui-bg" : "bg-ui-panel text-ui-muted shadow-[0_0_0_1px_var(--ui-line)]"}`}
              >
                <Icon className="size-4" /> {t.label}
                {t.n > 0 && <span className={`rounded-full px-1.5 text-[11px] ${tab === t.k ? "bg-ui-accent text-ui-accent-ink" : "bg-ui-sunken"}`}>{t.n}</span>}
              </button>
            );
          })}
        </div>

        {tab === "verify" && (
          <Queue empty="No brands waiting">
            {pending.map((b) => (
              <Card key={b.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <BrandMark brand={b} size={44} />
                  <div className="min-w-0">
                    <p className="font-semibold">{b.name}</p>
                    <p className="truncate text-[12.5px] text-ui-muted">
                      {b.site || "no website"} · GST <span className="font-mono">{b.gst ?? "—"}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Chip tone="good">GST matches name</Chip>
                      <Chip tone="good">Person check done</Chip>
                      <Chip tone="good">UPI on file</Chip>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" onClick={() => decideVerification(b.id, false)}>
                    Reject
                  </Btn>
                  <Btn
                    variant="solid"
                    onClick={() => {
                      decideVerification(b.id, true);
                      toast.success(`${b.name} is verified`, { description: "Its chats move to creators' main inbox." });
                    }}
                  >
                    <BadgeCheck className="size-4" /> Verify
                  </Btn>
                </div>
              </Card>
            ))}
          </Queue>
        )}

        {tab === "drafts" && (
          <Queue empty="No drafts to check">
            {drafts.map((t) => {
              const b = brand(t);
              const brief = agreedBrief(t)!;
              const d = t.deliverables.find((x) => x.drafts.length > 0)!;
              return (
                <Card key={t.id} className="flex flex-col gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <BrandMark brand={b} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {b.name} × {s.creator.name}
                      </p>
                      <p className="truncate text-[12.5px] text-ui-muted">
                        First deal · {d.kind} · {d.drafts.at(-1)!.file}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[`${brief.items.length} deliverables in brief`, `Mentions: ${brief.keyMessages[0] ?? "—"}`, "Disclosure (#ad) present"].map((c) => (
                      <p key={c} className="flex items-start gap-2 rounded-lg bg-ui-sunken px-3 py-2 text-[12.5px]">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#16a34a]" /> <span className="min-w-0">{c}</span>
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2 self-end">
                    <Btn variant="ghost" onClick={() => passAdminReview(t.id, false)}>
                      Flag an issue
                    </Btn>
                    <Btn variant="solid" onClick={() => passAdminReview(t.id, true)}>Pass</Btn>
                  </div>
                </Card>
              );
            })}
          </Queue>
        )}

        {tab === "payouts" && (
          <Queue empty="Nothing to release">
            {payouts.map((t) => {
              const b = brand(t);
              const m = dealMoney(agreedBrief(t)!.budget, s.creator.plan);
              return (
                <Card key={t.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <BrandMark brand={b} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {b.name} → {s.creator.name}
                      </p>
                      <p className="truncate text-[12.5px] text-ui-muted">
                        All posts live · {t.deliverables.map((d) => d.liveUrl).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-[12px] leading-tight text-ui-muted">
                      <p className="font-heading text-[17px] font-semibold text-ui-ink tabular-nums">{inr(m.payout)}</p>
                      Solo keeps {inr(m.soloEarns)}
                    </div>
                    <Btn variant="solid" onClick={() => releasePayment(t.id)}>
                      Release
                    </Btn>
                  </div>
                </Card>
              );
            })}
          </Queue>
        )}

        {tab === "disputes" && (
          <Queue empty="No disputes">
            {disputes.map((t) => (
              <Card key={t.id} className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                  <BrandMark brand={brand(t)} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {brand(t).name} × {s.creator.name}
                    </p>
                    <p className="truncate text-[12.5px] text-ui-muted">“{t.dispute}”</p>
                  </div>
                </div>
                <p className="text-[12.5px] text-pretty text-ui-muted">Read the agreed brief and chat, then decide. The money stays in escrow until you do.</p>
                <div className="flex gap-2 self-end">
                  <Btn variant="ghost" onClick={() => resolveDispute(t.id, "refund")}>
                    Refund brand
                  </Btn>
                  <Btn variant="solid" onClick={() => resolveDispute(t.id, "pay")}>Pay creator</Btn>
                </div>
              </Card>
            ))}
          </Queue>
        )}
      </div>
    </AppShell>
  );
}

function Queue({ children, empty }: { children: React.ReactNode; empty: string }) {
  const items = Array.isArray(children) ? children : [children];
  if (items.length === 0)
    return (
      <Card>
        <Empty icon={<ShieldQuestion className="size-5" />} title={empty} body="New items appear here as deals move." />
      </Card>
    );
  return <div className="flex flex-col gap-3">{children}</div>;
}
