"use client";

import { BadgeCheck, MapPin, Share } from "lucide-react";
import type { Portfolio } from "@/lib/types";
import { ShareSheet } from "../share-sheet";
import { ReachOut } from "../solo/reach-out";

type Variant = "side" | "center" | "cover";

export function Banner({ p, className = "" }: { p: Portfolio["profile"]; className?: string }) {
  if (!p.banner.url) return <div className={`bg-surface-2 ${className}`} />;
  return p.banner.type === "video" ? (
    <video src={p.banner.url} autoPlay muted loop playsInline className={`object-cover ${className}`} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.banner.url} alt="" className={`object-cover ${className}`} />
  );
}

export function Avatar({ src, name, className = "" }: { src: string; name: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`relative z-10 shrink-0 rounded-full object-cover ring-4 ring-[var(--p-bg)] ${className}`}
    />
  );
}

export function Availability({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium shadow-[inset_0_0_0_1px_var(--p-line)]">
      <span className="live-dot size-2 rounded-full bg-[#22c55e]" />
      Open to collabs
    </span>
  );
}

export function Actions({ slug, name, center }: { slug: string; name: string; center?: boolean }) {
  return (
    <div className={`flex gap-2 ${center ? "justify-center" : ""}`}>
      <ReachOut
        name={name}
        trigger={
          <button type="button" className="p-btn h-11 px-5 text-sm">
            Reach out
          </button>
        }
      />
      <ShareSheet
        slug={slug}
        trigger={
          <button type="button" aria-label="Share page" className="p-btn p-btn--ghost size-11">
            <Share className="size-4" />
          </button>
        }
      />
    </div>
  );
}

export function ProfileBlock({ portfolio, variant }: { portfolio: Portfolio; variant: Variant }) {
  const p = portfolio.profile;

  const name = (
    <h1 className="font-display text-[2.25rem] leading-[1.02] tracking-tight text-balance @4xl:text-5xl">
      {p.name}
    </h1>
  );
  const handle = (
    <p className="flex items-center gap-1.5 text-sm text-muted">
      {p.handle}
      {p.verified && <BadgeCheck className="size-4 text-[var(--p-accent)]" aria-label="Stats synced from platforms" />}
    </p>
  );
  const meta = (center?: boolean) => (
    <div className={`flex flex-wrap items-center gap-1.5 ${center ? "justify-center" : ""}`}>
      {p.tags.map((t) => (
        <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">
          {t}
        </span>
      ))}
      {p.location && (
        <span className="inline-flex items-center gap-1 px-1 text-xs text-muted">
          <MapPin className="size-3.5" />
          {p.location}
        </span>
      )}
    </div>
  );

  if (variant === "side") {
    return (
      <div className="enter flex flex-col gap-5" style={{ ["--i" as string]: 0 }}>
        <div className="tile relative">
          <Banner p={p} className="aspect-[16/7] w-full" />
        </div>
        <div className="-mt-14 flex items-end justify-between px-2">
          <Avatar src={p.avatar} name={p.name} className="size-24 @4xl:size-28" />
          <Availability on={p.available} />
        </div>
        <div className="flex flex-col gap-2 px-1">
          {name}
          {handle}
        </div>
        <p className="px-1 text-[15px] leading-relaxed text-pretty">{p.bio}</p>
        <div className="px-1">{meta()}</div>
        <div className="px-1">
          <Actions slug={portfolio.slug} name={p.name} />
        </div>
      </div>
    );
  }

  if (variant === "center") {
    return (
      <div className="enter flex flex-col items-center gap-4 text-center" style={{ ["--i" as string]: 0 }}>
        <div className="tile w-full">
          <Banner p={p} className="aspect-[16/7] w-full" />
        </div>
        <Avatar src={p.avatar} name={p.name} className="-mt-16 size-24" />
        <div className="flex flex-col items-center gap-1.5">
          {name}
          {handle}
        </div>
        <p className="max-w-[38ch] text-[15px] leading-relaxed text-pretty">{p.bio}</p>
        {meta(true)}
        <Availability on={p.available} />
        <Actions slug={portfolio.slug} name={p.name} center />
      </div>
    );
  }

  // cover
  return (
    <div className="enter flex flex-col gap-4" style={{ ["--i" as string]: 0 }}>
      <div className="tile w-full">
        <Banner p={p} className="aspect-[16/8] w-full @3xl:aspect-[16/5]" />
      </div>
      <div className="flex flex-col gap-4 px-2 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-end @3xl:gap-5">
          <Avatar src={p.avatar} name={p.name} className="-mt-14 size-24 @3xl:-mt-20 @3xl:size-32" />
          <div className="flex flex-col gap-1.5">
            {name}
            {handle}
          </div>
        </div>
        <Actions slug={portfolio.slug} name={p.name} />
      </div>
      <div className="flex flex-col gap-3 px-2 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p className="max-w-[56ch] text-[15px] leading-relaxed text-pretty">{p.bio}</p>
        <Availability on={p.available} />
      </div>
      <div className="px-2">{meta()}</div>
    </div>
  );
}
