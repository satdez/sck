"use client";

import { BarChart3, CalendarDays, ChevronRight, Coffee, FileText, MessageCircleReply, Package, PenLine, PhoneCall, Zap } from "lucide-react";
import Link from "next/link";
import { fanNet, fmtSlot, inr, settled } from "@/lib/solo/money";
import { useSolo } from "@/lib/solo/store";
import { SoloLinkMark } from "../solo-logo";
import { Card } from "./ui";

type Tool = { name: string; body: string; icon: React.ReactNode; href: string; meta?: string; alert?: boolean };

/** The Creator Kit as a plain list: what each tool is, and how it's doing. */
export function KitTools() {
  const s = useSolo((x) => x);
  const dmSent = s.dmRules.reduce((n, r) => n + r.sent, 0);
  const sold = (k: string) => s.orders.filter((o) => o.kind === k && settled(o));
  const questions = s.orders.filter((o) => o.status === "awaiting").length;
  const call = s.orders.filter((o) => o.status === "booked").sort((a, b) => (a.slot ?? "").localeCompare(b.slot ?? ""))[0];
  const tips = sold("tip");
  const icon = (I: typeof Package) => <I className="size-[18px]" strokeWidth={1.9} />;

  const groups: { title: string; tools: Tool[] }[] = [
    {
      title: "Your page and reach",
      tools: [
        { name: "sck.bio page", body: "Your portfolio with a Reach out button", icon: <SoloLinkMark className="size-5" />, href: "/editor", meta: `${s.creator.slug}.sck.bio` },
        { name: "DM automation", body: "Auto-reply to comments and story replies", icon: icon(MessageCircleReply), href: "/kit/dm", meta: `${dmSent.toLocaleString("en-IN")} sent` },
      ],
    },
    {
      title: "Earn from fans",
      tools: [
        { name: "Digital store", body: "Guides, presets and templates", icon: icon(Package), href: "/kit/store", meta: `${sold("product").length} sales` },
        { name: "Paid calls", body: "Fans book and pay for 1:1 time", icon: icon(PhoneCall), href: "/kit/store", meta: call ? fmtSlot(call.slot!).split(",").slice(0, 2).join(",") : "None booked" },
        { name: "Priority DM", body: "Paid questions with a reply promise", icon: icon(Zap), href: "/kit/store", meta: questions ? `${questions} to answer` : "All answered", alert: questions > 0 },
        { name: "Tips", body: "One-tap support by UPI", icon: icon(Coffee), href: "/kit/store", meta: tips.length ? inr(tips.reduce((n, o) => n + fanNet(o, s.creator.plan), 0)) : "No tips yet" },
      ],
    },
  ];

  const soon: { name: string; icon: typeof Package; pro?: boolean }[] = [
    { name: "Link analytics", icon: BarChart3, pro: true },
    { name: "Media kit", icon: FileText },
    { name: "Content calendar", icon: CalendarDays },
    { name: "Caption writer", icon: PenLine },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-2">
        {groups.map((g) => (
          <section key={g.title} className="flex min-w-0 flex-col gap-2">
            <h3 className="px-1 text-[12px] font-semibold text-ui-muted">{g.title}</h3>
            <Card className="divide-y divide-ui-line overflow-hidden">
              {g.tools.map((t) => (
                <Link key={t.name} href={t.href} className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-ui-sunken/60">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ui-sunken text-ui-ink">{t.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold">{t.name}</span>
                    <span className="block truncate text-[13px] text-ui-muted">{t.body}</span>
                  </span>
                  {t.meta && (
                    <span className={`hidden shrink-0 text-[12.5px] font-semibold tabular-nums sm:block ${t.alert ? "text-[#b45309] dark:text-[#fbbf24]" : "text-ui-muted"}`}>{t.meta}</span>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-ui-muted transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </Card>
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="px-1 text-[12px] font-semibold text-ui-muted">Coming soon</h3>
        <div className="flex flex-wrap gap-2">
          {soon.map(({ name, icon: I, pro }) => (
            <span key={name} className="inline-flex h-9 items-center gap-2 rounded-full bg-ui-panel pr-3.5 pl-3 text-[13px] font-medium text-ui-muted shadow-[inset_0_0_0_1px_var(--ui-line)]">
              <I className="size-4" strokeWidth={1.9} />
              {name}
              {pro && <span className="rounded-full bg-ui-accent px-1.5 text-[10.5px] font-bold text-ui-accent-ink">Pro</span>}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
