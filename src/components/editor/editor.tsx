"use client";

import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Eye,
  Globe,
  LoaderCircle,
  Monitor,
  Palette,
  PenLine,
  QrCode,
  SlidersHorizontal,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";
import { checkSlug, publish } from "@/app/actions";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { ShareSheet } from "@/components/share-sheet";
import { SoloCreatorKit, SoloMark } from "@/components/solo-logo";
import { SAMPLE } from "@/lib/sample";
import { resolveTheme } from "@/lib/themes";
import type { Portfolio } from "@/lib/types";
import { ContentPanel } from "./content-panel";
import { DesignPanel } from "./design-panel";
import { IPhoneFrame } from "./iphone-frame";
import { PreferencesPanel } from "./preferences-panel";
import { Segmented } from "./ui";
import { useUiPrefs } from "./use-ui-prefs";

const DRAFT_KEY = "sck.draft.v1";
const PUBLISHED_KEY = "sck.published.v1";
const EASE = [0.23, 1, 0.32, 1] as const;

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeLS(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage blocked: the draft just won't survive a reload */
  }
}

function freshDraft(): Portfolio {
  // Start from the demo so the first view is a realistic page, not an empty form.
  return { ...structuredClone(SAMPLE), slug: "" };
}

type SlugState = { status: "idle" | "checking" | "ok" | "bad"; reason?: string };
type Tab = "content" | "design" | "prefs";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "content", label: "Content", icon: PenLine },
  { id: "design", label: "Design", icon: Palette },
  { id: "prefs", label: "Preferences", icon: SlidersHorizontal },
];

/* Icon rail (the "Rail" navigation preference). */
function Rail({ tab, onTab, side }: { tab: Tab; onTab: (t: Tab) => void; side: "left" | "right" }) {
  return (
    <nav
      aria-label="Editor sections"
      className={`hidden w-[52px] shrink-0 flex-col items-center gap-1 bg-ui-panel py-2.5 lg:flex ${
        side === "left" ? "border-r" : "border-l"
      } border-ui-line`}
    >
      {TABS.map((t) => {
        const on = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            title={t.label}
            aria-label={t.label}
            aria-current={on ? "page" : undefined}
            onClick={() => onTab(t.id)}
            className={`relative grid size-9 place-items-center rounded-lg transition-colors duration-150 ${
              on ? "text-ui-ink" : "text-ui-muted hover:bg-ui-sunken hover:text-ui-ink"
            } ${t.id === "prefs" ? "mt-auto" : ""}`}
          >
            {on && (
              <motion.span
                layoutId="rail-active"
                className="absolute inset-0 rounded-lg bg-ui-sunken shadow-[inset_0_0_0_1px_var(--ui-line)]"
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              />
            )}
            <t.icon className="relative size-[18px]" strokeWidth={1.75} />
          </button>
        );
      })}
    </nav>
  );
}

export default function Editor() {
  const ui = useUiPrefs();
  const { prefs } = ui;
  const [draft, setDraft] = useState<Portfolio>(() => {
    const base = readLS<Portfolio>(DRAFT_KEY) ?? freshDraft();
    // arriving from the landing page's "Claim" field: use that name
    const claimed = new URLSearchParams(window.location.search).get("slug");
    if (claimed) {
      return { ...base, slug: claimed.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) };
    }
    return base;
  });
  const [published, setPublished] = useState<Portfolio | null>(() => readLS<Portfolio>(PUBLISHED_KEY));
  const [tab, setTab] = useState<Tab>("content");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [slugState, setSlugState] = useState<SlugState>({ status: "idle" });
  const [publishing, startPublish] = useTransition();
  const device = prefs.device;
  // Safari tints the status bar with the page colour; mirror that in the phone frame.
  const barTint = useMemo(() => {
    const { palette } = resolveTheme(draft.theme);
    return { bg: palette.bg, ink: palette.ink };
  }, [draft.theme]);

  // tidy the URL after taking the claimed name (in an effect: initializers can run twice)
  useEffect(() => {
    if (window.location.search.includes("slug=")) window.history.replaceState(null, "", "/editor");
  }, []);

  // autosave draft (debounced)
  useEffect(() => {
    const t = setTimeout(() => writeLS(DRAFT_KEY, draft), 300);
    return () => clearTimeout(t);
  }, [draft]);

  // Ctrl/⌘ + , opens Preferences, like most desktop apps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setTab("prefs");
        setMobileView("edit");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // live subdomain availability
  const ownerSlug = published?.slug;
  useEffect(() => {
    const slug = draft.slug;
    if (!slug) return;
    let alive = true;
    const t = setTimeout(async () => {
      setSlugState({ status: "checking" });
      const r = await checkSlug(slug, ownerSlug);
      if (alive) setSlugState(r.ok ? { status: "ok" } : { status: "bad", reason: r.reason });
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [draft.slug, ownerSlug]);

  const dirty = useMemo(() => {
    if (!published) return true;
    const strip = ({ publishedAt, ...rest }: Portfolio) => (void publishedAt, rest);
    return JSON.stringify(strip(published)) !== JSON.stringify(strip(draft));
  }, [draft, published]);

  const canPublish = !!draft.slug && slugState.status === "ok" && dirty && !publishing;

  const onPublish = () =>
    startPublish(async () => {
      const r = await publish(draft, ownerSlug);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const next = { ...draft, slug: r.slug, publishedAt: r.publishedAt };
      setDraft(next);
      setPublished(next);
      writeLS(PUBLISHED_KEY, next);
      toast.success("Published", {
        description: `${r.slug}.sck.bio is live`,
        action: { label: "View", onClick: () => window.open(`/${r.slug}`, "_blank") },
      });
    });

  const slugHint =
    !draft.slug ? "Pick your link" :
    slugState.status === "checking" ? "Checking…" :
    slugState.status === "ok" ? "Available" :
    slugState.status === "bad" ? slugState.reason : "";

  const right = prefs.side === "right";

  return (
    <MotionConfig reducedMotion={prefs.motion === "reduced" ? "always" : "user"}>
      <div className="ed flex h-dvh flex-col" {...ui.rootProps}>
        {/* ───────── top bar ───────── */}
        <header className="ed-top flex h-14 shrink-0 items-center gap-3 border-b border-ui-line bg-ui-panel px-3 lg:px-4">
          <Link href="/" aria-label="Solo Creator Kit home" className="ui-press flex shrink-0 items-center">
            <span className="hidden sm:inline-flex">
              <SoloCreatorKit height={22} />
            </span>
            {/* phones: just the bolt mark, so the page address gets the room */}
            <SoloMark className="size-8 sm:hidden" />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:mx-auto sm:flex-none">
            <label
              htmlFor="slug"
              className={`flex h-10 min-w-0 flex-1 cursor-text items-center rounded-xl sm:h-9 sm:flex-none border bg-ui-sunken pr-2.5 pl-2.5 text-sm transition-colors ${
                slugState.status === "bad" && draft.slug ? "border-red-500/50" : "border-ui-line focus-within:border-ui-ink/40"
              }`}
            >
              <Globe className="mr-2 size-3.5 shrink-0 text-ui-muted" strokeWidth={1.75} />
              <input
                id="slug"
                value={draft.slug}
                placeholder="yourname"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => {
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
                  setDraft((d) => ({ ...d, slug }));
                  setSlugState({ status: slug ? "checking" : "idle" });
                }}
                // grows with the name (field-sizing), so "name.sck.bio" reads as one address with no dead gap
                size={Math.max(draft.slug.length, 8)}
                style={{ fieldSizing: "content" } as CSSProperties}
                className="max-w-[16ch] min-w-[2ch] bg-transparent text-[16px] font-medium outline-none placeholder:text-ui-muted/60 sm:text-sm"
              />
              <span className="text-ui-muted">.sck.bio</span>
              <span className="ml-2 hidden items-center sm:flex" aria-live="polite" title={slugHint}>
                {slugState.status === "checking" && <LoaderCircle className="size-4 animate-spin text-ui-muted" />}
                {slugState.status === "ok" && draft.slug && <CircleCheck className="size-4 text-green-600" />}
                {slugState.status === "bad" && draft.slug && <CircleAlert className="size-4 text-red-500" />}
              </span>
            </label>
            <span className="hidden text-xs text-ui-muted xl:inline">{slugHint}</span>
          </div>

          <div className="hidden lg:block">
            <Segmented
              id="device"
              size="sm"
              value={device}
              onChange={(v) => ui.set("device", v)}
              options={[
                { value: "mobile", label: <Smartphone className="size-3.5" />, title: "Phone preview" },
                { value: "desktop", label: <Monitor className="size-3.5" />, title: "Desktop preview" },
              ]}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {published && (
              <>
                <a
                  href={`/${published.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  title={dirty ? "Your live page is behind this draft. Publish to update it." : "Open your live page"}
                  className="ui-press relative hidden h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ui-muted hover:bg-ui-sunken hover:text-ui-ink md:inline-flex"
                >
                  <ExternalLink className="size-4" /> View live
                  {/* draft is ahead of what's live: say so, instead of silently opening old content */}
                  {dirty && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#f5a524]" aria-label="Unpublished changes" />}
                </a>
                <ShareSheet
                  slug={published.slug}
                  trigger={
                    <button type="button" aria-label="Share" className="ui-press grid size-9 place-items-center rounded-xl text-ui-muted hover:bg-ui-sunken hover:text-ui-ink">
                      <QrCode className="size-4" />
                    </button>
                  }
                />
              </>
            )}
            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish}
              className={`ui-cta ui-press relative inline-flex h-10 shrink-0 items-center sm:h-9 gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:active:scale-100 ${
                !dirty && published ? "" : "disabled:opacity-45"
              }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={publishing ? "p" : dirty ? "d" : "c"}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="inline-flex items-center gap-1.5"
                >
                  {publishing ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" /> Publishing
                    </>
                  ) : !published ? (
                    "Publish"
                  ) : dirty ? (
                    <>
                      Publish<span className="hidden sm:inline"> changes</span>
                    </>
                  ) : (
                    <>
                      <CircleCheck className="size-4" /> Live
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </header>

        <div className={`flex min-h-0 flex-1 ${right ? "flex-row-reverse" : ""}`}>
          {prefs.nav === "rail" && <Rail tab={tab} onTab={setTab} side={prefs.side} />}

          {/* ───────── side panel ───────── */}
          <aside
            className={`${mobileView === "edit" ? "flex" : "hidden"} w-full shrink-0 flex-col border-ui-line bg-ui-panel lg:flex lg:w-[var(--pw)] ${
              right ? "border-l" : "border-r"
            }`}
            style={{ "--pw": `${prefs.width}px` } as CSSProperties}
          >
            <div className={`border-b border-ui-line p-3 ${prefs.nav === "rail" ? "lg:hidden" : ""}`}>
              <Segmented
                id="tab"
                value={tab}
                onChange={setTab}
                options={TABS.map((t) => ({
                  value: t.id,
                  title: t.label,
                  label: (
                    <>
                      <t.icon className="size-3.5" />
                      <span className={t.id === "prefs" ? "sr-only" : ""}>{t.label}</span>
                    </>
                  ),
                }))}
              />
            </div>
            {prefs.nav === "rail" && (
              <div className="hidden h-12 shrink-0 items-center border-b border-ui-line px-4 text-sm font-semibold lg:flex">
                {TABS.find((t) => t.id === tab)?.label}
              </div>
            )}
            <div className="ed-scroll min-h-0 flex-1 overflow-y-auto p-4 pb-28 lg:pb-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: EASE }}
                >
                  {tab === "content" && <ContentPanel draft={draft} onChange={setDraft} />}
                  {tab === "design" && (
                    <DesignPanel
                      theme={draft.theme}
                      glowSrc={draft.profile.banner.type === "image" && draft.profile.banner.url ? draft.profile.banner.url : draft.profile.avatar}
                      onChange={(theme) => setDraft((d) => ({ ...d, theme }))}
                    />
                  )}
                  {tab === "prefs" && <PreferencesPanel api={ui} />}
                </motion.div>
              </AnimatePresence>
              {tab !== "prefs" && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...freshDraft(), slug: draft.slug });
                    toast("Reset to the demo content");
                  }}
                  className="mt-10 text-xs text-ui-muted underline-offset-2 hover:text-ui-ink hover:underline"
                >
                  Reset to demo content
                </button>
              )}
            </div>
          </aside>

          {/* ───────── preview ───────── */}
          <main className={`ed-canvas ${mobileView === "preview" ? "flex" : "hidden"} min-w-0 flex-1 items-start justify-center overflow-hidden bg-ui-sunken lg:flex`}>
            {/* phones get a plain full-bleed preview; desktop gets device frames */}
            <div className="ed-mprev size-full overflow-y-auto lg:hidden">
              <PortfolioView portfolio={draft} className="min-h-full" />
            </div>
            <div className="hidden size-full items-center justify-center p-6 lg:flex">
              {device === "mobile" && prefs.frame === "device" ? (
                <motion.div
                  key="phone-device"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="size-full"
                >
                  <IPhoneFrame barBg={barTint.bg} barInk={barTint.ink}>
                    <PortfolioView portfolio={draft} className="min-h-full" />
                  </IPhoneFrame>
                </motion.div>
              ) : device === "mobile" ? (
                <motion.div
                  key="phone-minimal"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="relative h-[min(932px,100%)] w-[430px] shrink-0 overflow-hidden rounded-[28px] bg-ui-panel shadow-[0_0_0_1px_var(--ui-line),0_24px_60px_-24px_rgb(0_0_0/0.35)]"
                >
                  <div className="no-scrollbar size-full overflow-y-auto">
                    <PortfolioView portfolio={draft} className="min-h-full" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="desktop"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex size-full flex-col overflow-hidden rounded-2xl border border-ui-line bg-ui-panel shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)]"
                >
                  <div className="flex h-10 shrink-0 items-center gap-3 border-b border-ui-line px-4">
                    <div className="flex gap-1.5">
                      <span className="size-2.5 rounded-full bg-ui-line" />
                      <span className="size-2.5 rounded-full bg-ui-line" />
                      <span className="size-2.5 rounded-full bg-ui-line" />
                    </div>
                    <div className="mx-auto rounded-lg bg-ui-sunken px-3 py-1 font-mono text-xs text-ui-muted">
                      {draft.slug || "yourname"}.sck.bio
                    </div>
                    <span className="w-12" />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <PortfolioView portfolio={draft} className="min-h-full" />
                  </div>
                </motion.div>
              )}
            </div>
          </main>
        </div>

        {/* ───────── phone: edit / preview switch ───────── */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="w-64 rounded-2xl bg-ui-panel/90 p-1 shadow-[0_8px_30px_-8px_rgb(0_0_0/0.3),0_0_0_1px_var(--ui-line)] backdrop-blur-xl">
            <Segmented
              id="mobile-view"
              value={mobileView}
              onChange={setMobileView}
              options={[
                { value: "edit", label: <><PenLine className="size-3.5" /> Edit</> },
                { value: "preview", label: <><Eye className="size-3.5" /> Preview</> },
              ]}
            />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
