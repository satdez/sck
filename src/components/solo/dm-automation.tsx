"use client";

import { PageHero } from "./page-hero";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDashed,
  Download,
  Heart,
  Link2,
  Lock,
  MessageCircle,
  MessageCircleReply,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Signal,
  Sparkles,
  Trash2,
  UserPlus,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { agreedBrief, inr } from "@/lib/solo/money";
import { deleteDmRule, newDmRuleId, saveDmRule, setInstagramConnected, toggleDmRule, useSolo } from "@/lib/solo/store";
import type { DmRule, DmTrigger, IgPost, Offer, SoloState } from "@/lib/solo/types";
import { AppShell } from "./shell";
import { Field, fieldCls, Sheet } from "./sheet";
import { BrandMark, Btn, Card, Chip, Empty, SectionTitle } from "./ui";
import { PlatformGlyph } from "./whatsapp-icon";

/* ───────────── shared bits ───────────── */

const TRIGGERS: {
  id: DmTrigger;
  label: string;
  short: string;
  icon: typeof MessageCircle;
  pro?: boolean;
}[] = [
  {
    id: "comment",
    label: "Comments on a post or reel",
    short: "Comments",
    icon: MessageCircle,
  },
  {
    id: "story",
    label: "Replies to a story",
    short: "Story replies",
    icon: CircleDashed,
  },
  { id: "dm", label: "Sends you a DM", short: "DMs", icon: Send },
  {
    id: "live",
    label: "Comments on a live",
    short: "Live",
    icon: Radio,
    pro: true,
  },
];

const PRO_TOAST = () =>
  toast("Part of Solo Pro · ₹299 a month", {
    description: "Waived for any month you close a Solo deal.",
  });

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-ui-ink" : "bg-ui-line"} ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className="absolute top-0.5 left-0.5 size-5 rounded-full bg-ui-panel shadow transition-transform duration-200"
        style={{
          transform: on ? "translateX(16px)" : "none",
          transitionTimingFunction: "var(--ease-out)",
        }}
      />
    </button>
  );
}

function ProChip() {
  return <span className="rounded-md bg-ui-accent px-1.5 py-px text-[10px] font-bold tracking-wide text-ui-accent-ink uppercase">Pro</span>;
}

function triggerLine(r: DmRule, posts: IgPost[]) {
  if (r.trigger === "comment") {
    if (r.postId === "any") return "Comments on any post or reel";
    if (r.postId === "next") return "Comments on your next post";
    const p = posts.find((x) => x.id === r.postId);
    return p ? `Comments on “${p.caption}”` : "Comments on a post";
  }
  return TRIGGERS.find((t) => t.id === r.trigger)!.label;
}

function outcome(r: DmRule, s: Pick<SoloState, "offers" | "threads" | "brands">): { label: string; value: string; money?: boolean } {
  if (r.deliver.kind === "product")
    return {
      label: `${r.stats.sales} sold`,
      value: inr(r.stats.revenue),
      money: true,
    };
  if (r.deliver.kind === "deal") {
    const d = r.deliver;
    const t = s.threads.find((x) => x.id === d.threadId);
    const b = s.brands.find((x) => x.id === t?.brandId);
    return {
      label: `Taps sent to ${b?.name ?? "brand"}`,
      value: r.stats.tapped.toLocaleString("en-IN"),
    };
  }
  if (r.collectEmail) return { label: "Emails", value: r.stats.emails.toLocaleString("en-IN") };
  if (r.followGate)
    return {
      label: "New followers",
      value: r.stats.follows.toLocaleString("en-IN"),
    };
  return { label: "Link taps", value: r.stats.tapped.toLocaleString("en-IN") };
}

function blankRule(): DmRule {
  return {
    id: newDmRuleId(),
    name: "",
    trigger: "comment",
    postId: "p-desk",
    keywords: [],
    anyWord: false,
    smartMatch: false,
    publicReply: { on: true, texts: ["Sent! Check your DMs 📩"] },
    opener: {
      text: "Hey! Thanks for the comment 🙌 Tap below and I'll send it over.",
      button: "Send it",
    },
    followGate: false,
    collectEmail: false,
    message: "Here you go 👇",
    deliver: { kind: "link", url: "", label: "Open link" },
    on: true,
    sent: 0,
    stats: { sent: 0, tapped: 0, follows: 0, emails: 0, sales: 0, revenue: 0 },
  };
}

const TEMPLATES: {
  title: string;
  body: string;
  icon: typeof Link2;
  make: () => DmRule;
}[] = [
  {
    title: "Send a link",
    body: "Comment LINK, get the link",
    icon: Link2,
    make: () => ({
      ...blankRule(),
      name: "Send a link",
      keywords: ["LINK"],
      message: "Here's the link 👇",
      deliver: { kind: "link", url: "mrwhosetheboss.sck.bio/gear", label: "Open link" },
    }),
  },
  {
    title: "Sell in the DM",
    body: "Comment, pay by UPI, get the file",
    icon: ShoppingBag,
    make: () => ({
      ...blankRule(),
      name: "Sell my guide",
      postId: "p-phone",
      keywords: ["GUIDE"],
      message: "The full guide, updated for 2027. Pay here and it lands in this chat.",
      deliver: { kind: "product", offerId: "o-guide" },
    }),
  },
  {
    title: "Grow followers",
    body: "Ask for a follow first",
    icon: UserPlus,
    make: () => ({
      ...blankRule(),
      name: "Follow to get it",
      keywords: ["SEND"],
      followGate: true,
      deliver: { kind: "link", url: "mrwhosetheboss.sck.bio", label: "Open my page" },
    }),
  },
  {
    title: "Brand deal code",
    body: "Tracked, reported to the brand",
    icon: BadgeCheck,
    make: () => ({
      ...blankRule(),
      name: "boAt code",
      postId: "p-buds",
      keywords: ["CODE"],
      message: "Use ARUN10 for 10% off.",
      deliver: {
        kind: "deal",
        threadId: "t-boat",
        url: "boat-lifestyle.com/arun",
        label: "Shop on boAt",
      },
    }),
  },
];

/* ───────────── screen ───────────── */

export function DmScreen() {
  const [draft, setDraft] = useState<DmRule | null>(null);
  const [isNew, setIsNew] = useState(false);
  const connected = useSolo((s) => s.instagram.connected);

  const open = (r: DmRule, fresh: boolean) => {
    setDraft(structuredClone(r));
    setIsNew(fresh);
    window.scrollTo({ top: 0 });
  };

  return (
    <AppShell role="creator">
      {draft ? (
        <Builder
          key={draft.id}
          initial={draft}
          isNew={isNew}
          onClose={() => {
            setDraft(null);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : connected ? (
        <Overview onOpen={open} />
      ) : (
        <Connect />
      )}
    </AppShell>
  );
}

function PageHead({ action }: { action?: ReactNode }) {
  return (
    <PageHero
      title="DM automation"
      body="Someone comments a keyword, Solo DMs them your link, product or brand code. See every rupee it brings in, not just DMs sent."
      action={action}
    />
  );
}

/* ───────────── 0 · connect ───────────── */

const CONNECT_DEMO = TEMPLATES[0].make();

function Connect() {
  const [sheet, setSheet] = useState(false);
  const handle = useSolo((s) => s.creator.handle);
  return (
    <div className="flex flex-col gap-8">
      <PageHead />
      <Card className="grid overflow-hidden md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-ui-ink text-ui-bg">
            <PlatformGlyph platform="instagram" className="size-6" />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Connect {handle}</h2>
            <p className="mt-1 max-w-[46ch] text-sm text-pretty text-ui-muted">
              Takes about 30 seconds. You need an Instagram Creator or Business account, which is free to switch to in Instagram settings.
            </p>
          </div>
          <ol className="flex flex-col gap-3 text-[14px]">
            {[
              ["Log in with Instagram", "On Meta's own screen. Solo never sees your password."],
              ["Allow comments and messages", "So Solo can see keywords and reply in your DMs."],
              ["Pick a post and a keyword", "Your first automation is live in under a minute."],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ui-sunken text-[12px] font-bold tabular-nums">{i + 1}</span>
                <span>
                  <span className="font-semibold">{t}</span>
                  <span className="block text-[13px] text-ui-muted">{b}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <Btn size="lg" onClick={() => setSheet(true)}>
              <PlatformGlyph platform="instagram" className="size-4" /> Connect Instagram
            </Btn>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ui-muted">
              <ShieldCheck className="size-3.5" /> Official Meta API, no password sharing
            </span>
          </div>
        </div>
        <div className="hidden items-center justify-center bg-ui-sunken p-6 md:flex">
          <PhoneSim rule={CONNECT_DEMO} autoplay compact />
        </div>
      </Card>
      {sheet && <ConnectSheet onClose={() => setSheet(false)} />}
    </div>
  );
}

function ConnectSheet({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const creator = useSolo((s) => s.creator);
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title="Allow Solo on Instagram"
      description="This is Meta's permission screen. You can remove access any time in Instagram settings."
      footer={
        <Btn
          size="lg"
          className="w-full"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setTimeout(() => {
              setInstagramConnected(true);
              toast.success(`${creator.handle} is connected`, {
                description: "6 posts and reels found. Pick one to automate.",
              });
              onClose();
            }, 1100);
          }}
        >
          {busy ? "Connecting…" : "Allow"}
        </Btn>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-ui-sunken p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={creator.avatar} alt="" className="size-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">{creator.handle}</p>
            <p className="text-[12.5px] text-ui-muted">Creator account · {(creator.followers.instagram / 1000).toFixed(0)}k followers</p>
          </div>
          <Check className="size-4" />
        </div>
        <ul className="flex flex-col gap-3 text-[14px]">
          {[
            [MessageCircle, "Read comments on your posts, reels and lives"],
            [Send, "Send DMs to people who comment or message you"],
            [AtSign, "See your profile name, photo and posts"],
          ].map(([Icon, t]) => {
            const I = Icon as typeof Send;
            return (
              <li key={t as string} className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ui-sunken">
                  <I className="size-4" />
                </span>
                {t as string}
              </li>
            );
          })}
        </ul>
        <p className="text-[12.5px] text-pretty text-ui-muted">Solo only messages people who commented, replied or wrote to you first. It never posts on your behalf.</p>
      </div>
    </Sheet>
  );
}

/* ───────────── 1 · overview ───────────── */

function Overview({ onOpen }: { onOpen: (r: DmRule, fresh: boolean) => void }) {
  const s = useSolo((x) => x);
  const rules = s.dmRules;
  const [preview, setPreview] = useState(rules[0]?.id ?? "");
  const shown = rules.find((r) => r.id === preview) ?? rules[0];

  const sum = (k: keyof DmRule["stats"]) => rules.reduce((n, r) => n + r.stats[k], 0);
  const sent = sum("sent");
  const tapped = sum("tapped");

  return (
    <div className="flex flex-col gap-8">
      <PageHead
        action={
          <Btn onClick={() => onOpen(blankRule(), true)}>
            <Plus className="size-4" /> New automation
          </Btn>
        }
      />

      {/* totals: one line, opens into the breakdown */}
      <Totals earned={sum("revenue")} sales={sum("sales")} sent={sent} tapped={tapped} follows={sum("follows")} emails={sum("emails")} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <SectionTitle
              action={
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-ui-muted">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#22c55e]" /> <span className="truncate">{s.creator.handle}</span>
                  <button type="button" onClick={() => setInstagramConnected(false)} className="ml-1 shrink-0 font-semibold underline-offset-2 hover:text-ui-ink hover:underline">
                    Disconnect
                  </button>
                </span>
              }
            >
              Automations <span className="font-normal">· {rules.length}</span>
            </SectionTitle>
            {rules.length === 0 && (
              <Card>
                <Empty icon={<MessageCircleReply className="size-5" />} title="No automations yet" body="Start from a template below. It takes under a minute." />
              </Card>
            )}
            <div className="flex flex-col gap-2.5">
              {rules.map((r) => (
                <RuleCard key={r.id} r={r} s={s} selected={shown?.id === r.id} onSelect={() => setPreview(r.id)} onEdit={() => onOpen(r, false)} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionTitle>Start from a template</SectionTitle>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => onOpen(t.make(), true)}
                  className="ui-press flex flex-col gap-3 rounded-2xl border border-ui-line bg-ui-panel p-4 text-left hover:bg-ui-sunken"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-ui-sunken">
                    <t.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold">{t.title}</span>
                    <span className="block text-[12.5px] text-pretty text-ui-muted">{t.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {shown && (
          <div className="hidden flex-col gap-3 lg:sticky lg:top-24 lg:flex lg:self-start">
            <p className="text-[12px] font-semibold text-ui-muted">What your follower sees · {shown.name}</p>
            <PhoneSim rule={shown} autoplay />
          </div>
        )}
      </div>
    </div>
  );
}

const KPI_KEY = "solo.dm.kpis";

function Totals({ earned, sales, sent, tapped, follows, emails }: { earned: number; sales: number; sent: number; tapped: number; follows: number; emails: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only preference, read after hydration
      if (localStorage.getItem(KPI_KEY) === "open") setOpen(true);
    } catch {}
  }, []);
  const toggle = () =>
    setOpen((o) => {
      try {
        localStorage.setItem(KPI_KEY, o ? "closed" : "open");
      } catch {}
      return !o;
    });
  const n = (x: number) => x.toLocaleString("en-IN");
  const tiles = [
    { label: "DMs sent · 30 days", value: n(sent), note: "Free and unlimited" },
    {
      label: "Tapped your button",
      value: n(tapped),
      note: `${sent ? Math.round((tapped / sent) * 100) : 0}% of DMs`,
    },
    {
      label: "New followers",
      value: `+${n(follows)}`,
      note: "From follow-first automations",
    },
    {
      label: "Emails collected",
      value: n(emails),
      note: "Saved to your audience",
    },
  ];
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ui-sunken/50">
        <span className="flex min-w-0 flex-1 items-baseline gap-x-2 overflow-hidden whitespace-nowrap">
          <span className="text-[12.5px] font-semibold text-ui-muted">Earned from DMs</span>
          <span className="font-heading text-[17px] font-semibold tracking-tight tabular-nums">{inr(earned)}</span>
          <span className="hidden truncate text-[12.5px] text-ui-muted sm:inline">
            · {sales} sales · {n(sent)} DMs sent · 30 days
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-ui-muted">
          <span className="hidden sm:inline">{open ? "Hide" : "Breakdown"}</span>
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-px border-t border-ui-line bg-ui-line sm:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-col gap-0.5 bg-ui-panel px-4 py-3">
              <span className="text-[12px] font-semibold text-ui-muted">{t.label}</span>
              <span className="font-heading text-[17px] font-semibold tabular-nums">{t.value}</span>
              <span className="text-[11.5px] text-ui-muted">{t.note}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Desktop: tapping a card previews it in the phone. Phones (no side preview): it opens the editor. */
const wide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

function RuleCard({ r, s, selected, onSelect, onEdit }: { r: DmRule; s: SoloState; selected: boolean; onSelect: () => void; onEdit: () => void }) {
  const post = s.instagram.posts.find((p) => p.id === r.postId);
  const out = outcome(r, s);
  const tapRate = r.stats.sent ? Math.round((r.stats.tapped / r.stats.sent) * 100) : 0;
  const T = TRIGGERS.find((t) => t.id === r.trigger)!;
  const earning = out.money && r.stats.revenue > 0;
  const fresh = r.stats.sent === 0;
  const open = () => (wide() ? onSelect() : onEdit());
  const shortLabel = out.label === "New followers" ? "follows" : out.label === "Emails" ? "emails" : "taps";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      aria-current={selected || undefined}
      className={`ui-press relative flex cursor-pointer flex-col rounded-2xl bg-ui-panel transition-[box-shadow,transform] duration-200 shadow-[0_0_0_1px_var(--ui-line)] ${selected ? "lg:shadow-[0_0_0_2px_var(--ui-ink),0_18px_40px_-22px_rgb(0_0_0/0.6)]" : "hover:shadow-[0_0_0_1px_var(--ui-line),0_12px_30px_-18px_rgb(0_0_0/0.3)]"}`}
    >
      <div className="flex items-start gap-3 p-3 pb-2.5">
        <span className={`relative shrink-0 transition-opacity ${r.on ? "" : "opacity-45 grayscale"}`}>
          {r.trigger === "comment" && post ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image} alt="" className="h-[60px] w-12 rounded-[10px] object-cover" />
          ) : (
            <span className="grid h-[60px] w-12 place-items-center rounded-[10px] bg-ui-sunken">
              <T.icon className="size-4" />
            </span>
          )}
          {r.trigger === "comment" && post && (
            <span className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full bg-ui-panel shadow-[0_0_0_1px_var(--ui-line)]">
              <T.icon className="size-2.5" strokeWidth={2.6} />
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5">
            <span className="truncate font-heading text-[15px] leading-tight font-semibold">{r.name || "Untitled"}</span>
            {!r.on && <Chip className="!px-1.5 !py-0 !text-[10.5px]">Paused</Chip>}
            {selected && (
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#96ff43] px-1.5 py-px text-[10.5px] font-bold text-black lg:inline-flex">
                <span className="size-1.5 rounded-full bg-black" /> In preview
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-ui-muted">{triggerLine(r, s.instagram.posts)}</p>
          <p className="mt-2 flex flex-wrap items-center gap-1">
            {r.anyWord ? (
              <span className="rounded-md bg-ui-sunken px-1.5 py-px text-[11.5px] font-semibold">Any comment</span>
            ) : (
              r.keywords.map((k) => (
                <span key={k} className="rounded-md bg-ui-sunken px-1.5 py-px font-mono text-[11.5px] font-bold">
                  {k}
                </span>
              ))
            )}
            {r.followGate && (
              <span className="inline-flex items-center gap-0.5 px-1 text-[11.5px] text-ui-muted">
                <UserPlus className="size-3" /> Follow first
              </span>
            )}
            {r.collectEmail && (
              <span className="inline-flex items-center gap-0.5 px-1 text-[11.5px] text-ui-muted">
                <AtSign className="size-3" /> Email
              </span>
            )}
          </p>
        </div>

        <Switch on={r.on} onChange={() => toggleDmRule(r.id)} label={`Turn ${r.name} ${r.on ? "off" : "on"}`} />
      </div>

      {/* results: one quiet line, money gets the accent */}
      <div className="mx-3 flex items-center gap-3 border-t border-ui-line py-2.5 text-[12.5px]">
        {fresh ? (
          <span className="flex-1 text-ui-muted">{r.on ? "Live · waiting for the first comment" : "Not sent yet. Switch it on to start."}</span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-x-3 overflow-hidden whitespace-nowrap tabular-nums">
            <span>
              <b className="font-semibold">{r.stats.sent.toLocaleString("en-IN")}</b> <span className="text-ui-muted">sent</span>
            </span>
            <span>
              <b className="font-semibold">{r.stats.tapped.toLocaleString("en-IN")}</b> <span className="text-ui-muted">tapped · {tapRate}%</span>
            </span>
            {!out.money && (
              <span>
                <b className="font-semibold">{out.value}</b> <span className="text-ui-muted">{shortLabel}</span>
              </span>
            )}
          </span>
        )}
        {earning && (
          <span className="shrink-0 rounded-full bg-ui-accent px-2 py-0.5 text-[12px] font-bold text-ui-accent-ink tabular-nums">
            {out.value} <span className="font-semibold opacity-60">· {r.stats.sales} sold</span>
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="-my-1 hidden h-7 shrink-0 items-center rounded-lg px-2.5 text-[12.5px] font-semibold shadow-[inset_0_0_0_1px_var(--ui-line)] hover:bg-ui-sunken lg:inline-flex"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

/* ───────────── 2 · builder ───────────── */

function Step({ n, title, hint, children, aside }: { n: number; title: string; hint?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ui-ink text-[13px] font-bold text-ui-bg tabular-nums">{n}</span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="font-heading text-[16px] leading-tight font-semibold">{title}</h2>
          {hint && <p className="mt-1 text-[12.5px] text-pretty text-ui-muted">{hint}</p>}
        </div>
        {aside}
      </div>
      <div className="flex flex-col gap-4 sm:pl-10">{children}</div>
    </Card>
  );
}

function ToggleRow({ icon, title, body, on, onChange, pro }: { icon: ReactNode; title: string; body: string; on: boolean; onChange: (v: boolean) => void; pro?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-ui-sunken p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ui-panel">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          {title} {pro && <ProChip />}
        </p>
        <p className="text-[12.5px] text-pretty text-ui-muted">{body}</p>
      </div>
      <Switch on={on} onChange={onChange} label={title} />
    </div>
  );
}

function Builder({ initial, isNew, onClose }: { initial: DmRule; isNew: boolean; onClose: () => void }) {
  const s = useSolo((x) => x);
  const [r, setR] = useState<DmRule>(initial);
  const [kw, setKw] = useState("");
  const set = (patch: Partial<DmRule>) => setR((x) => ({ ...x, ...patch }));
  const pro = s.creator.plan === "pro";
  const gate = (fn: () => void) => (pro ? fn() : PRO_TOAST());

  const products = s.offers.filter((o) => o.active && o.kind !== "tip");
  const deals = s.threads.filter((t) => agreedBrief(t) && ["agreed", "production", "review", "approved", "live"].includes(t.stage));
  const publicOk = r.trigger === "comment" || r.trigger === "live";

  const addKeyword = (raw: string) => {
    const words = raw
      .split(/[,\s]+/)
      .map((w) => w.trim().toUpperCase())
      .filter(Boolean);
    if (!words.length) return;
    set({ keywords: [...new Set([...r.keywords, ...words])] });
    setKw("");
  };

  const clash = (() => {
    if (r.anyWord) return null;
    for (const o of s.dmRules) {
      if (o.id === r.id || !o.on || o.trigger !== r.trigger) continue;
      if (r.trigger === "comment" && o.postId !== r.postId && o.postId !== "any" && r.postId !== "any") continue;
      const k = o.keywords.find((x) => r.keywords.includes(x));
      if (k) return { k, name: o.name };
    }
    return null;
  })();

  const problems = [
    !r.anyWord && r.keywords.length === 0 && "Add at least one keyword",
    (!r.opener.text.trim() || !r.opener.button.trim()) && "Write the first DM and its button",
    r.deliver.kind === "link" && !r.deliver.url.trim() && "Add the link to send",
    r.deliver.kind === "deal" && !r.deliver.url.trim() && "Add the brand's link",
  ].filter(Boolean) as string[];

  const goLive = () => {
    const name = r.name.trim() || (r.anyWord ? "Any comment" : r.keywords.join(", "));
    saveDmRule({ ...r, name, on: true });
    const post = s.instagram.posts.find((p) => p.id === r.postId);
    toast.success(`${name} is live`, {
      description:
        r.trigger === "comment" ? `Comment ${r.anyWord ? "anything" : r.keywords[0]} on ${post ? `“${post.caption}”` : "your post"} from another account to test it.` : "Test it from another account.",
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Btn variant="ghost" size="sm" onClick={onClose} aria-label="Back to automations">
          <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Automations</span>
        </Btn>
        <input
          value={r.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Name this automation"
          aria-label="Automation name"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 font-heading text-[22px] font-semibold tracking-tight outline-none placeholder:text-ui-muted/60 focus:bg-ui-sunken"
        />
        {!isNew && (
          <Btn
            variant="quiet"
            size="sm"
            aria-label="Delete automation"
            onClick={() => {
              deleteDmRule(r.id);
              toast(`${r.name || "Automation"} deleted`);
              onClose();
            }}
          >
            <Trash2 className="size-4" />
          </Btn>
        )}
        <Btn onClick={goLive} disabled={problems.length > 0} title={problems[0]}>
          <Zap className="size-4" /> {isNew ? "Go live" : "Save"}
        </Btn>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* 1 trigger */}
          <Step n={1} title="When someone…">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TRIGGERS.map((t) => {
                const on = r.trigger === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      t.pro && !pro
                        ? PRO_TOAST()
                        : set({
                            trigger: t.id,
                            publicReply: {
                              ...r.publicReply,
                              on: t.id === "comment" || t.id === "live" ? r.publicReply.on : false,
                            },
                          })
                    }
                    className={`ui-press flex flex-col items-start gap-2 rounded-xl p-3 text-left text-[13px] font-semibold transition-shadow ${on ? "bg-ui-panel shadow-[0_0_0_2px_var(--ui-ink)]" : "bg-ui-sunken hover:shadow-[inset_0_0_0_1px_var(--ui-line)]"}`}
                  >
                    <span className="flex w-full items-center justify-between">
                      <t.icon className="size-4" />
                      {t.pro && !pro ? <ProChip /> : on ? <Check className="size-3.5" /> : null}
                    </span>
                    {t.short}
                  </button>
                );
              })}
            </div>

            {r.trigger === "comment" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-ui-muted">On which post?</p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-2 [scrollbar-width:none]">
                  {[
                    { id: "any", label: "Any post or reel" },
                    { id: "next", label: "My next post" },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => set({ postId: o.id })}
                      className={`ui-press flex h-[132px] w-[92px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl p-2 text-center text-[12px] font-semibold ${r.postId === o.id ? "bg-ui-panel shadow-[0_0_0_2px_var(--ui-ink)]" : "bg-ui-sunken"}`}
                    >
                      {o.id === "any" ? <Sparkles className="size-4" /> : <Plus className="size-4" />}
                      {o.label}
                    </button>
                  ))}
                  {s.instagram.posts.map((p) => {
                    const on = r.postId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => set({ postId: p.id })}
                        aria-label={p.caption}
                        className={`ui-press relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-xl ${on ? "shadow-[0_0_0_2px_var(--ui-panel),0_0_0_4px_var(--ui-ink)]" : ""}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt="" className="absolute inset-0 size-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1 text-left text-[10.5px] leading-tight font-medium text-white">
                          <span className="line-clamp-2">{p.caption}</span>
                        </span>
                        <span className="absolute top-1.5 left-1.5 rounded-md bg-black/55 px-1 py-px text-[10px] font-semibold text-white capitalize">{p.kind}</span>
                        {on && (
                          <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-ui-accent text-ui-accent-ink">
                            <Check className="size-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Step>

          {/* 2 keywords */}
          <Step
            n={2}
            title={r.trigger === "dm" ? "…and their message has" : r.trigger === "story" ? "…and their reply has" : "…and their comment has"}
            hint="Capitals and extra words don't matter. “link pls 🙏” matches LINK."
          >
            <div className={`flex flex-wrap items-center gap-1.5 rounded-lg border border-ui-line bg-ui-panel p-1.5 ${r.anyWord ? "pointer-events-none opacity-40" : ""}`}>
              {r.keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-md bg-ui-sunken py-1 pr-1 pl-2 font-mono text-[13px] font-bold">
                  {k}
                  <button
                    type="button"
                    aria-label={`Remove ${k}`}
                    onClick={() => set({ keywords: r.keywords.filter((x) => x !== k) })}
                    className="grid size-5 place-items-center rounded hover:bg-ui-line"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addKeyword(kw);
                  } else if (e.key === "Backspace" && !kw && r.keywords.length) set({ keywords: r.keywords.slice(0, -1) });
                }}
                onBlur={() => addKeyword(kw)}
                placeholder={r.keywords.length ? "Add another" : "Type a keyword, press Enter"}
                className="min-w-[10ch] flex-1 bg-transparent px-1.5 py-1 font-mono text-[16px] uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-ui-muted/70 lg:text-sm"
              />
            </div>
            {clash && (
              <p className="rounded-lg bg-[#f59e0b]/14 px-3 py-2 text-[12.5px] text-[#b45309] dark:text-[#fbbf5a]">
                {clash.k} already triggers “{clash.name}”. Only one of them will reply.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <ToggleRow
                icon={<MessageCircle className="size-4" />}
                title="Reply to every comment"
                body="No keyword needed. Good for giveaways."
                on={r.anyWord}
                onChange={(v) => set({ anyWord: v })}
              />
              <ToggleRow
                icon={<Sparkles className="size-4" />}
                title="Smart match"
                body="Also catches typos and Hinglish: “lnik”, “link bhejo”, “लिंक”."
                on={r.smartMatch}
                onChange={(v) => gate(() => set({ smartMatch: v }))}
                pro={!pro}
              />
            </div>
          </Step>

          {/* 3 public reply */}
          {publicOk && (
            <Step
              n={3}
              title="Reply under their comment"
              hint="Solo rotates these so your replies don't look copy-pasted. Public replies also lift the post's engagement."
              aside={
                <Switch
                  on={r.publicReply.on}
                  onChange={(v) =>
                    set({
                      publicReply: {
                        ...r.publicReply,
                        on: v,
                        texts: r.publicReply.texts.length ? r.publicReply.texts : ["Sent! Check your DMs 📩"],
                      },
                    })
                  }
                  label="Reply publicly"
                />
              }
            >
              {r.publicReply.on && (
                <div className="flex flex-col gap-2">
                  {r.publicReply.texts.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className={fieldCls}
                        value={t}
                        onChange={(e) =>
                          set({
                            publicReply: {
                              ...r.publicReply,
                              texts: r.publicReply.texts.map((x, j) => (j === i ? e.target.value : x)),
                            },
                          })
                        }
                        aria-label={`Public reply ${i + 1}`}
                      />
                      {r.publicReply.texts.length > 1 && (
                        <Btn
                          size="sm"
                          variant="quiet"
                          aria-label="Remove reply"
                          onClick={() =>
                            set({
                              publicReply: {
                                ...r.publicReply,
                                texts: r.publicReply.texts.filter((_, j) => j !== i),
                              },
                            })
                          }
                        >
                          <X className="size-3.5" />
                        </Btn>
                      )}
                    </div>
                  ))}
                  {r.publicReply.texts.length < 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        set({
                          publicReply: {
                            ...r.publicReply,
                            texts: [...r.publicReply.texts, ["Done, it's in your inbox ✨", "Check your DMs 🙌"][r.publicReply.texts.length - 1] ?? ""],
                          },
                        })
                      }
                      className="self-start text-[13px] font-semibold text-ui-muted hover:text-ui-ink"
                    >
                      + Add a variation
                    </button>
                  )}
                </div>
              )}
            </Step>
          )}

          {/* 4 opener */}
          <Step n={publicOk ? 4 : 3} title="Send the first DM" hint="They tap the button to get the goods. That reply starts a real conversation, so your link isn't stuck in their message requests.">
            <Field label="Message">
              <textarea rows={2} className={fieldCls} value={r.opener.text} onChange={(e) => set({ opener: { ...r.opener, text: e.target.value } })} />
            </Field>
            <Field label="Button">
              <input className={fieldCls} maxLength={20} value={r.opener.button} onChange={(e) => set({ opener: { ...r.opener, button: e.target.value } })} />
            </Field>
          </Step>

          {/* 5 grow */}
          <Step n={publicOk ? 5 : 4} title="Before you send it" hint="Optional. Both are free on Solo.">
            <div className="flex flex-col gap-2">
              <ToggleRow
                icon={<UserPlus className="size-4" />}
                title="Ask for a follow"
                body="If they don't follow you, Solo asks them to, checks, then sends it."
                on={r.followGate}
                onChange={(v) => set({ followGate: v })}
              />
              <ToggleRow
                icon={<AtSign className="size-4" />}
                title="Ask for their email"
                body="Instagram fills it in with one tap. Saved to your audience for launches."
                on={r.collectEmail}
                onChange={(v) => set({ collectEmail: v })}
              />
            </div>
          </Step>

          {/* 6 deliver */}
          <Step n={publicOk ? 6 : 5} title="Then send them">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-ui-sunken p-1">
              {(
                [
                  ["link", "A link", Link2],
                  ["product", "A product", ShoppingBag],
                  ["deal", "A brand deal", BadgeCheck],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() =>
                    set({
                      deliver:
                        k === "link"
                          ? {
                              kind: "link",
                              url: r.deliver.kind === "link" ? r.deliver.url : "",
                              label: "Open link",
                            }
                          : k === "product"
                            ? {
                                kind: "product",
                                offerId: products[0]?.id ?? "",
                              }
                            : {
                                kind: "deal",
                                threadId: deals[0]?.id ?? "",
                                url: deals[0] ? `${s.brands.find((b) => b.id === deals[0].brandId)?.site}/arun` : "",
                                label: `Shop on ${s.brands.find((b) => b.id === deals[0]?.brandId)?.name ?? "brand"}`,
                              },
                    })
                  }
                  className={`ui-press flex h-10 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold ${r.deliver.kind === k ? "bg-ui-panel shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : "text-ui-muted hover:text-ui-ink"}`}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>

            <Field label="Message">
              <textarea rows={2} className={fieldCls} value={r.message} onChange={(e) => set({ message: e.target.value })} />
            </Field>

            {r.deliver.kind === "link" && (
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                <Field label="Link">
                  <input
                    className={fieldCls}
                    placeholder="mrwhosetheboss.sck.bio/gear"
                    value={r.deliver.url}
                    onChange={(e) =>
                      set({
                        deliver: {
                          ...(r.deliver as Extract<DmRule["deliver"], { kind: "link" }>),
                          url: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Button">
                  <input
                    className={fieldCls}
                    maxLength={20}
                    value={r.deliver.label}
                    onChange={(e) =>
                      set({
                        deliver: {
                          ...(r.deliver as Extract<DmRule["deliver"], { kind: "link" }>),
                          label: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
              </div>
            )}

            {r.deliver.kind === "product" && (
              <div className="flex flex-col gap-2">
                {products.map((o) => {
                  const on = r.deliver.kind === "product" && r.deliver.offerId === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => set({ deliver: { kind: "product", offerId: o.id } })}
                      className={`ui-press flex items-center gap-3 rounded-xl p-2.5 text-left ${on ? "bg-ui-panel shadow-[0_0_0_2px_var(--ui-ink)]" : "bg-ui-sunken"}`}
                    >
                      <OfferThumb o={o} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">{o.title}</span>
                        <span className="block text-[12.5px] text-ui-muted capitalize">{o.kind === "pdm" ? "Priority DM" : o.kind}</span>
                      </span>
                      <span className="font-semibold tabular-nums">{inr(o.price)}</span>
                    </button>
                  );
                })}
                <p className="text-[12.5px] text-pretty text-ui-muted">
                  They pay by UPI without leaving Instagram. Solo sends the file or booking link in the same chat, and the money joins your Store payouts.
                </p>
              </div>
            )}

            {r.deliver.kind === "deal" && (
              <div className="flex flex-col gap-3">
                {deals.length === 0 ? (
                  <p className="rounded-xl bg-ui-sunken p-3 text-[13px] text-ui-muted">No active deals. Brand deal links unlock when a brief is agreed in Inbox.</p>
                ) : (
                  deals.map((t) => {
                    const b = s.brands.find((x) => x.id === t.brandId)!;
                    const on = r.deliver.kind === "deal" && r.deliver.threadId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          set({
                            deliver: {
                              kind: "deal",
                              threadId: t.id,
                              url: `${b.site}/arun`,
                              label: `Shop on ${b.name}`,
                            },
                          })
                        }
                        className={`ui-press flex items-center gap-3 rounded-xl p-2.5 text-left ${on ? "bg-ui-panel shadow-[0_0_0_2px_var(--ui-ink)]" : "bg-ui-sunken"}`}
                      >
                        <BrandMark brand={b} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{agreedBrief(t)!.title}</span>
                          <span className="block text-[12.5px] text-ui-muted">{b.name}</span>
                        </span>
                        {on && <Check className="size-4" />}
                      </button>
                    );
                  })
                )}
                {r.deliver.kind === "deal" && deals.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <Field label="Brand's link">
                      <input
                        className={fieldCls}
                        value={r.deliver.url}
                        onChange={(e) =>
                          set({
                            deliver: {
                              ...(r.deliver as Extract<DmRule["deliver"], { kind: "deal" }>),
                              url: e.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field label="Button">
                      <input
                        className={fieldCls}
                        maxLength={20}
                        value={r.deliver.label}
                        onChange={(e) =>
                          set({
                            deliver: {
                              ...(r.deliver as Extract<DmRule["deliver"], { kind: "deal" }>),
                              label: e.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                )}
                <p className="text-[12.5px] text-pretty text-ui-muted">Solo wraps the link so every tap is counted, then shares the numbers in your deal chat as proof of results.</p>
              </div>
            )}
          </Step>

          {problems.length > 0 && <p className="text-center text-[12.5px] text-ui-muted">To go live: {problems.join(" · ")}</p>}
          <Btn size="lg" className="self-end" onClick={goLive} disabled={problems.length > 0}>
            <Zap className="size-4" /> {isNew ? "Go live" : "Save changes"}
          </Btn>
        </div>

        <div className="hidden flex-col gap-3 lg:sticky lg:top-24 lg:flex lg:self-start">
          <p className="text-[12px] font-semibold text-ui-muted">Live preview · updates as you type</p>
          <PhoneSim rule={r} />
        </div>
      </div>

      {/* phones and tablets: the preview floats above the nav and opens as a sheet */}
      <PreviewFab rule={r} />
    </div>
  );
}

function PreviewFab({ rule }: { rule: DmRule }) {
  const [open, setOpen] = useState(false);
  const avatar = useSolo((s) => s.creator.avatar);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ui-press fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-40 flex h-12 -translate-x-1/2 items-center gap-2.5 rounded-full bg-ui-ink py-1.5 pr-5 pl-1.5 text-[14px] font-semibold text-ui-bg shadow-[0_12px_32px_-8px_rgb(0_0_0/0.55)] md:bottom-6 lg:hidden"
      >
        <span className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" className="size-9 rounded-full object-cover" />
          <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-ui-accent text-ui-accent-ink shadow-[0_0_0_2px_var(--ui-ink)]">
            <Play className="size-2 fill-current" />
          </span>
        </span>
        Preview
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="What your follower sees" description="Plays the flow you're editing. Tap the buttons as your follower.">
        <PhoneSim rule={rule} autoplay compact controls />
      </Sheet>
    </>
  );
}

function OfferThumb({ o, size }: { o: Offer; size: number }) {
  if (o.image)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={o.image} alt="" className="shrink-0 rounded-[10px] object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="grid shrink-0 place-items-center rounded-[10px] bg-ui-panel" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {o.emoji}
    </span>
  );
}

/* ───────────── 3 · phone simulator ───────────── */

const FAN = {
  handle: "ananya.shoots",
  name: "Ananya",
  avatar: "/demo/people/ananya.jpg",
  email: "ananya.p@gmail.com",
};

type SimStep = {
  key: string;
  who: "fan" | "me" | "sys" | "post";
  /** label of a button the follower taps to move on */
  gate?: string;
  render: (p: { waiting: boolean; tap: (label: string) => void }) => ReactNode;
};

function useScript(rule: DmRule): SimStep[] {
  const s = useSolo((x) => x);
  const post = s.instagram.posts.find((p) => p.id === rule.postId) ?? s.instagram.posts[0];
  const handle = s.creator.handle.replace("@", "");
  const said = rule.anyWord ? "this setup is so clean 😍" : `${(rule.keywords[0] ?? "LINK").toLowerCase()} pls 🙏`;

  const steps: SimStep[] = [];

  // what the follower does on Instagram
  if (rule.trigger === "comment" || rule.trigger === "live") {
    steps.push({
      key: "comment",
      who: "post",
      render: () => (
        <div className="flex gap-2.5 rounded-2xl bg-white/[0.06] p-2.5">
          {rule.trigger === "live" ? (
            <span className="grid h-14 w-10 shrink-0 place-items-center rounded-lg bg-[#e1306c] text-[9px] font-bold">LIVE</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1 text-[12.5px]">
            <p className="truncate text-[11px] text-white/45">{rule.trigger === "live" ? "Comment on your live" : `Comment on “${post.caption}”`}</p>
            <p className="mt-1 flex items-start gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FAN.avatar} alt="" className="size-5 shrink-0 rounded-full object-cover" />
              <span>
                <span className="font-semibold">{FAN.handle}</span> {said}
              </span>
              <Heart className="ml-auto size-3 shrink-0 text-white/40" />
            </p>
          </div>
        </div>
      ),
    });
    if (rule.trigger === "comment" && rule.publicReply.on && rule.publicReply.texts[0])
      steps.push({
        key: "public",
        who: "post",
        render: () => (
          <div className="-mt-1 ml-12 flex items-start gap-1.5 text-[12.5px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.creator.avatar} alt="" className="size-5 shrink-0 rounded-full object-cover" />
            <span>
              <span className="font-semibold">{handle}</span> <span className="text-[#5b8cff]">@{FAN.handle}</span> {rule.publicReply.texts[0]}
            </span>
          </div>
        ),
      });
  } else if (rule.trigger === "story") {
    steps.push({
      key: "story",
      who: "fan",
      render: () => (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10.5px] text-white/40">Replied to your story</span>
          <span className="h-20 w-12 rounded-lg bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${s.instagram.posts[0].image})` }} />
          <Bubble fan>{said}</Bubble>
        </div>
      ),
    });
  } else {
    steps.push({
      key: "dm",
      who: "fan",
      render: () => <Bubble fan>{said}</Bubble>,
    });
  }

  const divider = rule.trigger === "comment" || rule.trigger === "live";
  if (divider)
    steps.push({
      key: "div",
      who: "sys",
      render: () => <Divider>DM from {handle}</Divider>,
    });

  // first DM with a button
  steps.push({
    key: "opener",
    who: "me",
    gate: rule.opener.button || "Send it",
    render: ({ waiting, tap }) => (
      <Bubble>
        {rule.opener.text || "…"}
        <DmButton label={rule.opener.button || "Send it"} waiting={waiting} tap={tap} />
      </Bubble>
    ),
  });
  steps.push({
    key: "opener-tap",
    who: "fan",
    render: () => <Bubble fan>{rule.opener.button || "Send it"}</Bubble>,
  });

  if (rule.followGate) {
    steps.push({
      key: "follow",
      who: "me",
      gate: "I'm following",
      render: ({ waiting, tap }) => (
        <Bubble>
          Looks like you don&apos;t follow me yet 👀 Follow @{handle} and tap below. I&apos;ll send it right away.
          <span className="mt-2 grid grid-cols-2 gap-1.5">
            <span className="grid h-8 place-items-center rounded-lg bg-white/10 text-[12px] font-semibold">Visit profile</span>
            <DmButton label="I'm following" waiting={waiting} tap={tap} inline />
          </span>
        </Bubble>
      ),
    });
    steps.push({
      key: "follow-tap",
      who: "fan",
      render: () => <Bubble fan>I&apos;m following</Bubble>,
    });
    steps.push({
      key: "follow-ok",
      who: "sys",
      render: () => (
        <Divider>
          <UserPlus className="size-3" /> Solo checked: {FAN.handle} follows you
        </Divider>
      ),
    });
  }

  if (rule.collectEmail) {
    steps.push({
      key: "email",
      who: "me",
      gate: FAN.email,
      render: ({ waiting, tap }) => (
        <div className="flex flex-col gap-1.5">
          <Bubble>Where should I send a copy? Tap your email 👇</Bubble>
          <button
            type="button"
            onClick={() => tap(FAN.email)}
            className={`ml-auto rounded-full px-3 py-1.5 text-[12px] font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] ${waiting ? "animate-pulse bg-white/10" : "text-white/50"}`}
          >
            {FAN.email}
          </button>
        </div>
      ),
    });
    steps.push({
      key: "email-tap",
      who: "fan",
      render: () => <Bubble fan>{FAN.email}</Bubble>,
    });
    steps.push({
      key: "email-ok",
      who: "sys",
      render: () => <Divider>Saved to your Solo audience</Divider>,
    });
  }

  // the payoff
  const d = rule.deliver;
  if (d.kind === "product") {
    const o = s.offers.find((x) => x.id === d.offerId);
    steps.push({
      key: "product",
      who: "me",
      gate: "Buy",
      render: ({ waiting, tap }) => (
        <Bubble>
          {rule.message}
          {o && (
            <span className="mt-2 block overflow-hidden rounded-xl bg-white text-black">
              {o.image ? (
                <span className="block h-24 bg-cover bg-center" style={{ backgroundImage: `url(${o.image})` }} />
              ) : (
                <span className="grid h-20 place-items-center bg-neutral-100 text-3xl">{o.emoji}</span>
              )}
              <span className="block px-3 pt-2 text-[13px] font-semibold">{o.title}</span>
              <span className="block px-3 text-[11.5px] text-neutral-500">{s.creator.slug}.sck.bio · UPI, cards</span>
              <span className="block p-2">
                <button
                  type="button"
                  onClick={() => tap("Buy")}
                  className={`h-8 w-full rounded-lg bg-black text-[12.5px] font-semibold text-white transition-shadow ${waiting ? "shadow-[0_0_0_3px_#96ff43]" : ""}`}
                >
                  Buy · {inr(o.price)}
                </button>
              </span>
            </span>
          )}
        </Bubble>
      ),
    });
    steps.push({
      key: "paid",
      who: "sys",
      render: () => (
        <Divider>
          <Lock className="size-3" /> Paid {o ? inr(o.price) : ""} by UPI
        </Divider>
      ),
    });
    steps.push({
      key: "file",
      who: "me",
      render: () => (
        <Bubble>
          Thank you {FAN.name}! Here&apos;s your download 👇
          <span className="mt-2 flex items-center gap-2 rounded-lg bg-white/12 px-3 py-2 text-[12.5px] font-semibold">
            <Download className="size-3.5" /> {o?.file ?? o?.title ?? "Your file"}
          </span>
        </Bubble>
      ),
    });
  } else {
    const t = d.kind === "deal" ? s.threads.find((x) => x.id === d.threadId) : undefined;
    const b = t ? s.brands.find((x) => x.id === t.brandId) : undefined;
    steps.push({
      key: "link",
      who: "me",
      gate: d.label || "Open link",
      render: ({ waiting, tap }) => (
        <Bubble>
          {rule.message}
          <span className="mt-2 block overflow-hidden rounded-xl bg-white/10">
            <span className="flex items-center gap-2 px-3 pt-2.5 text-[12px] text-white/60">
              {b ? <BrandMark brand={b} size={18} /> : <Link2 className="size-3.5" />}
              <span className="truncate">{d.url || "your link"}</span>
            </span>
            <span className="block p-2">
              <DmButton label={d.label || "Open link"} waiting={waiting} tap={tap} inline />
            </span>
          </span>
        </Bubble>
      ),
    });
    steps.push({
      key: "opened",
      who: "sys",
      render: () => <Divider>{b ? `Tap counted on your ${b.name} deal` : `Opened ${d.url || "your link"}`}</Divider>,
    });
  }
  return steps;
}

function Bubble({ fan, children }: { fan?: boolean; children: ReactNode }) {
  return (
    <div className={`max-w-[84%] px-3 py-2 text-[13px] leading-snug text-pretty ${fan ? "ml-auto rounded-[18px] rounded-br-[6px] bg-[#3b5bfd]" : "rounded-[18px] rounded-bl-[6px] bg-[#262626]"}`}>
      {children}
    </div>
  );
}

function DmButton({ label, waiting, tap, inline }: { label: string; waiting: boolean; tap: (l: string) => void; inline?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => tap(label)}
      className={`${inline ? "" : "mt-2"} grid h-8 w-full place-items-center rounded-lg bg-white/90 px-2 text-[12px] font-semibold text-black transition-shadow ${waiting ? "shadow-[0_0_0_3px_#96ff43]" : ""}`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

function Divider({ children }: { children: ReactNode }) {
  return <p className="flex items-center justify-center gap-1.5 py-1 text-center text-[10.5px] text-white/40">{children}</p>;
}

/**
 * A phone running the automation from the follower's side. Static (whole flow) while
 * editing; Play animates it step by step and the follower's buttons are tappable.
 */
function PhoneSim({ rule, autoplay, compact, controls }: { rule: DmRule; autoplay?: boolean; compact?: boolean; controls?: boolean }) {
  const script = useScript(rule);
  const creator = useSolo((s) => s.creator);
  const [playing, setPlaying] = useState(!!autoplay);
  const [at, setAt] = useState(autoplay ? 1 : script.length);
  const [nudgeAt, setNudgeAt] = useState(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const key = rule.id;

  // a different automation restarts the demo
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setPlaying(!!autoplay);
    setAt(autoplay ? 1 : script.length);
  }

  const shownCount = playing ? Math.min(at, script.length) : script.length;
  const last = script[shownCount - 1];
  const waitingGate = playing && last?.gate && shownCount < script.length ? last.gate : null;
  const next = playing && shownCount < script.length ? script[shownCount] : null;

  useEffect(() => {
    if (!playing) return;
    if (shownCount >= script.length) return;
    const delay = waitingGate ? 2200 : next?.who === "me" ? 1100 : next?.who === "sys" ? 500 : 800;
    const nudgeT = waitingGate ? setTimeout(() => setNudgeAt(shownCount), 900) : undefined;
    const t = setTimeout(() => setAt((n) => n + 1), delay);
    return () => {
      clearTimeout(t);
      if (nudgeT) clearTimeout(nudgeT);
    };
  }, [playing, shownCount, script.length, waitingGate, next?.who]);

  useEffect(() => {
    const el = scroller.current;
    if (el)
      el.scrollTo({
        top: el.scrollHeight,
        behavior: playing ? "smooth" : "auto",
      });
  }, [shownCount, playing, rule]);

  const tap = (label: string) => {
    if (!playing) {
      setPlaying(true);
      setAt(1);
      return;
    }
    if (waitingGate && label === waitingGate) setAt((n) => n + 1);
  };

  const done = playing && shownCount >= script.length;
  const typing = playing && next?.who === "me" && !waitingGate;

  return (
    <div className="flex flex-col gap-3">
      {/* device: titanium rail → black bezel → screen. Radii are concentric: 54 − 3 = 51, 51 − 10 = 41. */}
      <div className={`relative mx-auto w-full ${compact ? "max-w-[280px]" : "max-w-[320px]"}`}>
        {/* side buttons */}
        <span aria-hidden className="absolute top-[108px] -left-[3px] h-7 w-[3px] rounded-l-sm bg-[#3a3a3d]" />
        <span aria-hidden className="absolute top-[152px] -left-[3px] h-12 w-[3px] rounded-l-sm bg-[#3a3a3d]" />
        <span aria-hidden className="absolute top-[212px] -left-[3px] h-12 w-[3px] rounded-l-sm bg-[#3a3a3d]" />
        <span aria-hidden className="absolute top-[170px] -right-[3px] h-[72px] w-[3px] rounded-r-sm bg-[#3a3a3d]" />
        <div className="rounded-[54px] bg-[#2c2c2f] p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16),0_0_0_1px_rgb(0_0_0/0.5),0_40px_80px_-32px_rgb(0_0_0/0.7)]">
          <div className="rounded-[51px] bg-black p-[10px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <div className="relative flex flex-col overflow-hidden rounded-[41px] bg-black text-white">
              {/* status bar + dynamic island */}
              <div className="relative flex h-11 items-center justify-between px-6 pt-1 text-[13px] font-semibold tabular-nums">
                <span>9:41</span>
                <span
                  aria-hidden
                  className="absolute top-2.5 left-1/2 flex h-[26px] w-[88px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5 shadow-[0_0_0_1px_rgb(255_255_255/0.07)]"
                >
                  <span className="size-2 rounded-full bg-[#14161c] shadow-[inset_0_0_0_1.5px_#23262e]" />
                </span>
                <span className="flex items-center gap-1">
                  <Signal className="size-3.5" strokeWidth={2.6} />
                  <Wifi className="size-3.5" strokeWidth={2.6} />
                  <span className="relative ml-0.5 flex h-[11px] w-[22px] items-center rounded-[3.5px] p-[1.5px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.45)]">
                    <span className="h-full w-[75%] rounded-[1.5px] bg-white" />
                    <span className="absolute top-1/2 -right-[3px] h-1 w-[1.5px] -translate-y-1/2 rounded-r-sm bg-white/45" />
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 border-b border-white/10 px-3.5 py-2.5">
                <ArrowLeft className="size-4 text-white/80" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={creator.avatar} alt="" className="size-8 rounded-full object-cover" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[13px] font-semibold">{creator.name}</p>
                  <p className="truncate text-[11px] text-white/45">{creator.handle.replace("@", "")}</p>
                </div>
                <PlatformGlyph platform="instagram" className="size-4 text-white/60" />
              </div>

              <div ref={scroller} className={`flex flex-col gap-2.5 overflow-y-auto px-3 py-3 [scrollbar-width:none] ${compact ? "h-[380px]" : "h-[460px]"}`}>
                {script.slice(0, shownCount).map((st, i) => (
                  <div key={st.key} className={playing ? "animate-[sim-in_260ms_var(--ease-out)]" : ""}>
                    {st.render({
                      waiting: !!waitingGate && i === shownCount - 1 && nudgeAt === shownCount,
                      tap,
                    })}
                  </div>
                ))}
                {typing && (
                  <div className="flex w-14 items-center justify-center gap-1 rounded-[18px] rounded-bl-[6px] bg-[#262626] py-3">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: `${d * 120}ms` }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5">
                <span className="h-8 flex-1 rounded-full bg-white/[0.07] px-3 text-[12px] leading-8 text-white/35">Message…</span>
              </div>
              {/* home indicator */}
              <div className="flex h-5 items-start justify-center">
                <span className="h-[5px] w-[108px] rounded-full bg-white/70" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {(!compact || controls) && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-pretty text-ui-muted">
            {waitingGate ? (
              <>
                Tap <span className="font-semibold text-ui-ink">{waitingGate}</span> as {FAN.name}, or wait
              </>
            ) : done ? (
              "That's the whole flow."
            ) : playing ? (
              "Playing…"
            ) : (
              "The whole flow, start to finish."
            )}
          </p>
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => {
              setPlaying(true);
              setAt(1);
            }}
          >
            {playing ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5" />} {playing ? "Replay" : "Play"}
          </Btn>
        </div>
      )}
    </div>
  );
}
