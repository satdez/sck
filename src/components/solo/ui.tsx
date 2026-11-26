"use client";

import { BadgeCheck, Clock } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Tone } from "@/lib/solo/stages";
import type { Brand } from "@/lib/solo/types";

/* Shared primitives for the Solo app chrome. Built on the --ui-* tokens (light/dark follow the OS). */

export function BrandMark({ brand, size = 40 }: { brand: Pick<Brand, "initials" | "tint" | "name" | "logo">; size?: number }) {
  if (brand.logo)
    return (
      <span
        className="grid shrink-0 place-items-center overflow-hidden bg-white shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
        style={{ width: size, height: size, borderRadius: size * 0.3 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logo} alt="" className="size-[72%] object-contain" />
      </span>
    );
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center font-heading font-semibold text-white"
      style={{ width: size, height: size, borderRadius: size * 0.3, background: brand.tint, fontSize: size * 0.36 }}
    >
      {brand.initials}
    </span>
  );
}

/** A person: their photo when we have one, initials otherwise. */
export function Person({ name, src, size = 36 }: { name: string; src?: string; size?: number }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full bg-ui-sunken font-semibold text-ui-muted" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
    </span>
  );
}

export function CreatorMark({ name, src, size = 40 }: { name: string; src?: string; size?: number }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="shrink-0 rounded-full object-cover shadow-[0_0_0_2px_var(--ui-accent)]" style={{ width: size, height: size }} />;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-ui-accent font-heading font-semibold text-ui-accent-ink"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function VerifiedBadge({ v, compact }: { v: Brand["verification"]; compact?: boolean }) {
  if (v === "verified")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#3b82f6]/12 px-1.5 py-0.5 text-[11px] font-semibold text-[#2563eb] dark:text-[#7aa7ff]" title="Verified by Solo">
        <BadgeCheck className="size-3.5" />
        {!compact && "Verified"}
      </span>
    );
  if (v === "pending")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ui-sunken px-1.5 py-0.5 text-[11px] font-medium text-ui-muted">
        <Clock className="size-3" />
        {!compact && "In review"}
      </span>
    );
  return null;
}

const toneCls: Record<Tone, string> = {
  neutral: "bg-ui-sunken text-ui-muted",
  accent: "bg-ui-ink/[0.07] text-ui-ink dark:bg-white/10",
  good: "bg-[#22c55e]/14 text-[#15803d] dark:text-[#6ee7a0]",
  warn: "bg-[#f59e0b]/16 text-[#b45309] dark:text-[#fbbf5a]",
  bad: "bg-[#ef4444]/14 text-[#b91c1c] dark:text-[#ff8a8a]",
};

export function Chip({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${toneCls[tone]} ${className}`}>{children}</span>;
}

/*
 * Button hierarchy. Pick by what the action does, not by how important the screen feels.
 *
 *  primary (lime)  The one action that creates something or moves money / a deal forward:
 *                  New offer, New automation, Fund, Accept brief, Send brief, Pay, Save in a sheet.
 *                  At most ONE per region (page header, sheet footer, deal panel). Never in a list row.
 *  solid (white)   The main action inside a repeated item (a row, a card in a list, a queue entry):
 *                  Answer, Join, Upload draft, Review, Verify, Pass. Ink on dark, black on light.
 *  ghost           The alternative beside either: View shop, Mark done, Edit, Counter.
 *  quiet           Undo or step back: Refund, Cancel, Ignore, Remove.
 *  danger          Destructive: Report, Delete.
 */
type BtnVariant = "primary" | "solid" | "ghost" | "quiet" | "danger";
const btnCls: Record<BtnVariant, string> = {
  /* the editor's Publish button: accent fill, lip/flat/pill per the chrome preference */
  primary: "ui-cta hover:brightness-[1.04]",
  solid: "bg-ui-ink text-ui-bg hover:opacity-90",
  ghost: "bg-ui-panel text-ui-ink shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken",
  quiet: "text-ui-muted hover:bg-ui-sunken hover:text-ui-ink",
  danger: "bg-ui-panel text-[#dc2626] shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-[#ef4444]/8",
};

export function Btn({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "h-8 px-3 text-[13px] rounded-lg" : size === "lg" ? "h-11 px-5 text-[15px] rounded-xl" : "h-9 px-4 text-sm rounded-xl";
  return (
    <button
      type="button"
      {...rest}
      className={`ui-press inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 ${sz} ${btnCls[variant]} ${className}`}
    />
  );
}

/** A card on the app surface. Inner radius rule: children with padding p use radius (20 - p). */
export function Card({ children, className = "", as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={`rounded-2xl border border-ui-line bg-ui-panel ${className}`}>{children}</As>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-2xl bg-ui-sunken text-ui-muted">{icon}</span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-[32ch] text-sm text-pretty text-ui-muted">{body}</p>
    </div>
  );
}
