"use client";

import { Building2, Home, Inbox, Landmark, MessageCircleReply, ShieldCheck, ShoppingBag, Wallet, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useSolo } from "@/lib/solo/store";
import type { Role } from "@/lib/solo/types";
import { SoloCoinWordmark, SoloLinkMark, SoloLogo } from "../solo-logo";
import { ChromePrefs } from "./chrome";
import { useLogo } from "./logo-slot";
import { RoleSwitch } from "./role-switch";
import { BrandMark, CreatorMark, VerifiedBadge } from "./ui";

type NavItem = { href: string; label: string; icon: typeof Home; badge?: number; short?: string; desktopOnly?: boolean };

function useNav(role: Role): NavItem[] {
  const unreadCreator = useSolo((s) => s.threads.reduce((n, t) => n + (t.unread.creator > 0 ? 1 : 0), 0));
  const unreadBrand = useSolo((s) => s.threads.filter((t) => t.brandId === s.brandSelf).reduce((n, t) => n + (t.unread.brand > 0 ? 1 : 0), 0));
  const storeTodo = useSolo((s) => s.orders.filter((o) => o.status === "awaiting").length);
  const adminQueue = useSolo(
    (s) => s.brands.filter((b) => b.verification === "pending").length + s.threads.filter((t) => t.adminReview === "queued" || t.stage === "live" || t.stage === "dispute").length,
  );
  if (role === "creator")
    return [
      { href: "/kit", label: "Home", icon: Home },
      { href: "/inbox", label: "Inbox", icon: Inbox, badge: unreadCreator },
      { href: "/kit/deals", label: "Deals", icon: Briefcase },
      { href: "/kit/store", label: "Store", icon: ShoppingBag, badge: storeTodo },
      { href: "/kit/payouts", label: "Payouts", icon: Wallet },
      { href: "/kit/dm", label: "Automation", short: "DMs", icon: MessageCircleReply, desktopOnly: true },
    ];
  if (role === "brand")
    return [
      { href: "/brand", label: "Chats", icon: Inbox, badge: unreadBrand },
      { href: "/brand/verify", label: "Verification", icon: ShieldCheck },
    ];
  return [{ href: "/admin", label: "Queues", icon: Landmark, badge: adminQueue }];
}

/**
 * The creator's sck.bio page is Solo's core product, so it gets the loudest spot in the bar:
 * the live address (opens the page) joined to a lime Edit button. Small screens keep just the button.
 */
function PageButton() {
  const creator = useSolo((s) => s.creator);
  return (
    // one tray, one height: radii are concentric (outer 14 − 4px padding = inner 10)
    <span className="inline-flex h-10 items-center gap-1 rounded-[14px] bg-ui-sunken p-1 shadow-[inset_0_0_0_1px_var(--ui-line)]">
      <Link
        href={`/${creator.slug}`}
        target="_blank"
        title="Open your live page"
        className="ui-press hidden h-8 items-center gap-2 rounded-[10px] pr-2.5 pl-1 text-[13px] font-semibold whitespace-nowrap text-ui-ink hover:bg-ui-panel lg:inline-flex"
      >
        <span className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={creator.avatar} alt="" className="size-6 rounded-[7px] object-cover" />
          <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-[#22c55e] shadow-[0_0_0_1.5px_var(--ui-sunken)]" />
        </span>
        <span>
          {creator.slug}
          <span className="hidden font-medium text-ui-muted 2xl:inline">.sck.bio</span>
        </span>
      </Link>
      <Link
        href="/editor"
        aria-label="Edit your sck.bio page"
        className="ui-press inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-ui-accent px-2 text-[13px] font-semibold whitespace-nowrap text-ui-accent-ink hover:brightness-[1.04] lg:px-3"
      >
        <SoloLinkMark className="size-4" />
        <span className="hidden lg:inline">Edit page</span>
      </Link>
    </span>
  );
}

/**
 * Phones: the page link and Edit live in a notch hanging from the top edge,
 * between the logo and your avatar, with concave ears where it meets the bar.
 */
function MobileNotch() {
  const creator = useSolo((s) => s.creator);
  // the ear: a square whose corner is cut by a circle, so the notch flows into the top edge
  const ear = (side: "left" | "right") => (
    <span
      aria-hidden
      className={`absolute top-0 size-3 ${side === "left" ? "-left-3" : "-right-3"}`}
      style={{ background: `radial-gradient(circle at ${side === "left" ? "0 100%" : "100% 100%"}, transparent 11.5px, #000 12px)` }}
    />
  );
  return (
    <div className="relative mx-3 flex h-[46px] min-w-0 flex-1 items-center gap-2 self-start rounded-b-[20px] bg-black pr-1.5 pl-3 text-white md:hidden">
      {ear("left")}
      {ear("right")}
      {/* metallic rim: a 1px brushed-silver edge round the sides and foot, fading out where the notch meets the bar */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-b-[20px] [mask-image:linear-gradient(180deg,transparent_10%,#000_70%)]">
        <span className="notch-rim absolute inset-0 rounded-b-[20px]" />
      </span>
      <Link href={`/${creator.slug}`} target="_blank" title="Open your live page" className="flex min-w-0 flex-1 items-center gap-2">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#22c55e]/60 [animation-duration:2.4s]" />
          <span className="relative size-2 rounded-full bg-[#22c55e]" />
        </span>
        {/* a slow, endless ticker: two copies side by side, the track slides by exactly one copy */}
        <span className="notch-marquee relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <span className="notch-marquee__track flex w-max text-[12px] font-semibold tracking-[-0.01em] whitespace-nowrap">
            {[0, 1].map((i) => (
              <span key={i} aria-hidden={i === 1 || undefined} className="pr-8">
                {creator.slug}
                <span className="font-medium text-white/50">.sck.bio</span>
              </span>
            ))}
          </span>
        </span>
      </Link>
      <Link href="/editor" aria-label="Edit your sck.bio page" className="ui-press grid size-8 shrink-0 place-items-center rounded-[12px] bg-[#96ff43] text-black">
        <SoloLinkMark className="size-4" />
      </Link>
    </div>
  );
}

const ROLE_LABEL: Record<Role, string> = { creator: "Creator Kit", brand: "Brands", admin: "Ops" };

function Identity({ role }: { role: Role }) {
  const creator = useSolo((s) => s.creator);
  const brand = useSolo((s) => s.brands.find((b) => b.id === s.brandSelf));
  if (role === "creator")
    return (
      <span className="flex items-center gap-2.5">
        <span className="hidden text-right leading-tight sm:block">
          <span className="block text-[13px] font-semibold whitespace-nowrap">{creator.name}</span>
          <span className="block text-[11px] text-ui-muted">{creator.plan === "pro" ? "Pro" : "Free plan"}</span>
        </span>
        <CreatorMark name={creator.name} src={creator.avatar} size={34} />
      </span>
    );
  if (role === "brand" && brand)
    return (
      <span className="flex items-center gap-2.5">
        <span className="hidden text-right leading-tight sm:block">
          <span className="flex items-center justify-end gap-1 text-[13px] font-semibold">
            {brand.name} <VerifiedBadge v={brand.verification} compact />
          </span>
          <span className="block text-[11px] text-ui-muted">{brand.contact}</span>
        </span>
        <BrandMark brand={brand} size={34} />
      </span>
    );
  return (
    <span className="flex items-center gap-2 text-[13px] font-semibold">
      <span className="grid size-[34px] place-items-center rounded-full bg-ui-sunken">
        <Building2 className="size-4" />
      </span>
      <span className="hidden sm:inline">Solo ops</span>
    </span>
  );
}

const isActive = (path: string, href: string) => (href === "/kit" || href === "/brand" ? path === href : path.startsWith(href));

const roleFromPath = (path: string): Role => (path.startsWith("/brand") ? "brand" : path.startsWith("/admin") ? "admin" : "creator");

/**
 * App chrome for every Solo surface: top bar on desktop, bottom tabs on phones.
 * Rendered once by the (solo) layout, so it stays mounted across navigations and the
 * nav highlight slides between tabs instead of re-entering.
 */
export function SoloFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const role = roleFromPath(path);
  const nav = useNav(role);
  const logo = useLogo();

  return (
    <div className="app flex min-h-dvh flex-col bg-ui-bg text-ui-ink">
      <ChromePrefs />
      {/* top bar: same build as the editor's (h-14 panel bar, Solo × Creator Kit lockup, sliding segmented nav) */}
      <header className="ed-top sticky top-0 z-30 border-b border-ui-line bg-ui-panel/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-0 px-3 sm:px-5 md:gap-4">
          <Link href={role === "creator" ? "/kit" : role === "brand" ? "/brand" : "/admin"} aria-label="Solo home" className="ui-press flex shrink-0 items-center gap-2.5">
            {role === "creator" && logo ? (
              <>
                {/* phones: just "solo", its o the tossing bolt coin; tablets and up: the full lockup */}
                {/* optical centre: the letters' x-height sits in the lower 70% of the box, so lift it */}
                <span className="inline-flex -translate-y-1 items-center md:hidden">
                  <SoloCoinWordmark height={24} />
                </span>
                <span className="logo-chip hidden items-center md:inline-flex">{logo}</span>
              </>
            ) : (
              <span className="logo-chip inline-flex items-center">
                <SoloLogo height={19} />
              </span>
            )}
            {role !== "creator" && <span className="rounded-md bg-ui-sunken px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-ui-muted uppercase">{ROLE_LABEL[role]}</span>}
          </Link>

          <nav aria-label="Sections" className="hidden items-center gap-0.5 rounded-xl bg-ui-sunken p-1 md:flex">
            {nav.map((n) => {
              const active = isActive(path, n.href);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 ${active ? "text-ui-ink" : "text-ui-muted hover:text-ui-ink"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="solo-nav"
                      className="absolute inset-0 rounded-lg bg-ui-panel shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--ui-line)]"
                      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    />
                  )}
                  <Icon className="relative size-3.5" strokeWidth={1.9} />
                  <span className="relative hidden lg:inline">{n.label}</span>
                  {!!n.badge && <span className="relative grid h-4 min-w-4 place-items-center rounded-full bg-ui-accent px-1 text-[10px] font-bold text-ui-accent-ink tabular-nums">{n.badge}</span>}
                </Link>
              );
            })}
          </nav>

          {role === "creator" && <MobileNotch />}

          <div className="ml-auto flex items-center gap-2">
            {role === "creator" && (
              <span className="hidden md:contents">
                <PageButton />
              </span>
            )}
            <Identity role={role} />
          </div>
        </div>
      </header>

      {children}

      <RoleSwitch />

      {nav.length > 1 && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ui-line bg-ui-panel/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-md">
            {nav.filter((n) => !n.desktopOnly).map((n) => {
              const active = isActive(path, n.href);
              const Icon = n.icon;
              return (
                <Link key={n.href} href={n.href} className={`relative flex h-[58px] flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold ${active ? "text-ui-ink" : "text-ui-muted"}`}>
                  <span className="relative">
                    <Icon className="size-[21px]" strokeWidth={active ? 2.3 : 1.8} />
                    {!!n.badge && <span className="absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-ui-accent px-1 text-[9px] font-bold text-ui-accent-ink">{n.badge}</span>}
                  </span>
                  {n.short ?? n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/** A page's content area inside the persistent frame. `bleed` pages (chats) manage their own height and padding. */
export function AppShell({ children, bleed }: { role?: Role; children: ReactNode; bleed?: boolean }) {
  return <main className={bleed ? "flex min-h-0 flex-1 flex-col" : "mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-36 sm:px-6 md:pb-24"}>{children}</main>;
}
