"use client";

import { Mail, Share } from "lucide-react";
import { resolveTheme } from "@/lib/themes";
import type { Portfolio, Section } from "@/lib/types";
import { LayoutContext } from "./layout-context";
import { EditorialLayout } from "./editorial";
import { ProfileBlock } from "./profile";
import { SectionTiles } from "./sections";
import { SplitLayout } from "./split";
import { ThemeScope } from "./theme-scope";
import { ShareSheet } from "../share-sheet";
import { SoloLogo } from "../solo-logo";

const sectionAnchor = (s: Section) => (s.type === "contact" ? "work-with-me" : s.id);

function SectionHeading({ title, className = "" }: { title: string; className?: string }) {
  return <h2 className={`font-display text-lg font-semibold tracking-tight ${className}`}>{title}</h2>;
}

/**
 * Renders a Portfolio. Responsive via container queries (@container on ThemeScope),
 * so the editor's mobile/desktop preview behaves exactly like real devices.
 */
export function PortfolioView({ portfolio, className = "" }: { portfolio: Portfolio; className?: string }) {
  const layout = resolveTheme(portfolio.theme).layout;
  const hasContact = portfolio.sections.some((s) => s.type === "contact" && s.visible && s.items.length > 0);
  const ctx = { layout, base: 0 };
  const sections = portfolio.sections.filter((s) => s.visible && s.items.length > 0);
  // profile is step 0; each section starts 2 steps after the previous one
  const tiles = (s: Section, i: number) => (
    <LayoutContext.Provider value={{ layout, base: 1 + i * 2 }}>
      <SectionTiles section={s} all={portfolio.sections} />
    </LayoutContext.Provider>
  );

  return (
    <ThemeScope
      theme={portfolio.theme}
      className={className}
      glowSrc={portfolio.profile.banner?.type === "image" && portfolio.profile.banner.url ? portfolio.profile.banner.url : portfolio.profile.avatar}
    >
      <LayoutContext.Provider value={ctx}>
        {layout === "bento" && (
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-6 @4xl:grid-cols-[minmax(300px,360px)_1fr] @4xl:gap-12 @4xl:px-8 @4xl:py-14">
            <aside className="@4xl:sticky @4xl:top-14 @4xl:self-start">
              <ProfileBlock portfolio={portfolio} variant="side" />
            </aside>
            <main className="flex min-w-0 flex-col gap-8">
              {sections.map((s, i) => (
                <section key={s.id} id={sectionAnchor(s)} className="flex scroll-mt-6 flex-col gap-3">
                  <SectionHeading title={s.title} className="px-1" />
                  <div className="grid grid-flow-row-dense auto-rows-[152px] grid-cols-2 gap-3 @2xl:auto-rows-[176px] @2xl:grid-cols-4 @2xl:gap-4">
                    {tiles(s, i)}
                  </div>
                </section>
              ))}
            </main>
          </div>
        )}

        {layout === "split" && <SplitLayout portfolio={portfolio} />}

        {layout === "editorial" && <EditorialLayout portfolio={portfolio} />}

        {layout === "list" && (
          <div className="mx-auto flex max-w-[560px] flex-col gap-8 px-4 py-6 @2xl:py-12">
            <ProfileBlock portfolio={portfolio} variant="center" />
            {sections.map((s, i) => (
              <section key={s.id} id={sectionAnchor(s)} className="flex scroll-mt-6 flex-col gap-3">
                <h2 className="p-label text-center">{s.title}</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {tiles(s, i)}
                </div>
              </section>
            ))}
          </div>
        )}

        {layout === "cards" && (
          <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-6 @3xl:px-8 @3xl:py-12">
            <ProfileBlock portfolio={portfolio} variant="cover" />
            <div className="columns-1 gap-5 @3xl:columns-2">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={sectionAnchor(s)}
                  className="section-card mb-5 flex break-inside-avoid scroll-mt-6 flex-col gap-4 rounded-[var(--p-radius)] bg-surface p-4 shadow-[inset_0_0_0_1px_var(--p-line)] @3xl:p-5"
                >
                  <SectionHeading title={s.title} />
                  <div className="grid grid-cols-2 gap-2.5">
                    {tiles(s, i)}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        <footer className="flex justify-center pt-2 pb-10">
          <a
            href="https://sck.bio"
            target="_blank"
            rel="noopener"
            className="ui-press inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-xs font-medium shadow-[inset_0_0_0_1px_var(--p-line)]"
          >
            <span className="text-muted">Made with</span>
            <SoloLogo height={12} color="currentColor" />
            <span className="text-muted">· get yours</span>
          </a>
        </footer>

        {/* phones: the ask is always one tap away. Sticky (not fixed) so it stays inside
            whatever frame renders the page, and rests after the footer at the very end. */}
        {hasContact && (
          <div className="p-cta sticky z-20 flex gap-2 px-4 pt-2 @3xl:hidden">
            <a href="#work-with-me" className="p-btn h-12 flex-1 text-[15px] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.45)]">
              <Mail className="size-4" /> Work with me
            </a>
            <ShareSheet
              slug={portfolio.slug}
              trigger={
                <button
                  type="button"
                  aria-label="Share page"
                  className="p-btn p-btn--ghost size-12 shadow-[inset_0_0_0_1px_var(--p-line),0_10px_30px_-10px_rgb(0_0_0/0.35)] backdrop-blur-xl"
                >
                  <Share className="size-4" />
                </button>
              }
            />
          </div>
        )}
      </LayoutContext.Provider>
    </ThemeScope>
  );
}
