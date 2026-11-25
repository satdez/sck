import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { SoloCreatorKit } from "@/components/solo-logo";
import { SAMPLE } from "@/lib/sample";
import { PRESETS, presetTheme } from "@/lib/themes";

export default function Home() {
  return (
    <div className="app min-h-dvh bg-ui-bg pb-24">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <SoloCreatorKit height={26} />

        <Link href="/editor" className="ui-press inline-flex h-9 items-center rounded-xl bg-ui-ink px-4 text-sm font-semibold text-ui-bg">
          Open editor
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 sm:pt-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ui-line bg-ui-panel px-3 py-1 text-xs text-ui-muted">
          <span className="size-1.5 rounded-full bg-ui-accent" /> Mini portfolios for creators
        </p>
        <h1
          className="max-w-3xl text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] font-semibold tracking-[-0.035em] text-balance"
        >
          Your work, your numbers, one link.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-pretty text-ui-muted">
          Show brands your best collabs, real engagement and who your audience is. Publish to{" "}
          <span className="font-mono text-ui-ink">you.sck.bio</span> and drop it in your bio.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/editor" className="ui-press inline-flex h-12 items-center gap-2 rounded-2xl bg-ui-accent px-6 font-semibold text-ui-accent-ink">
            Build yours <ArrowRight className="size-4" />
          </Link>
          <Link href={`/${SAMPLE.slug}`} className="ui-press inline-flex h-12 items-center rounded-2xl border border-ui-line bg-ui-panel px-6 font-semibold">
            See an example
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-ui-muted uppercase">Presets</h2>
          <span className="text-xs text-ui-muted">Same content, {PRESETS.length} looks, 5 layouts</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {PRESETS.map((p) => (
            // The preview contains real links, so the card is a plain container with a
            // stretched link on top (never <a> inside <a>), and the preview is inert.
            <div key={p.id} className="group relative flex flex-col gap-3">
              <div className="relative aspect-[390/760] w-full overflow-hidden rounded-[28px] shadow-[0_0_0_1px_var(--ui-line),0_20px_40px_-24px_rgb(0_0_0/0.4)] transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-1">
                <div
                  className="pointer-events-none absolute top-0 left-0 h-[calc(100%/var(--s))] w-[calc(100%/var(--s))] origin-top-left scale-[var(--s)] [--s:0.42] sm:[--s:0.5]"
                  aria-hidden
                  inert
                >
                  <PortfolioView
                    portfolio={{ ...SAMPLE, theme: presetTheme(p) }}
                    className="h-full overflow-hidden"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-ui-muted">{p.vibe}</p>
              </div>
              <Link
                href="/editor"
                aria-label={`${p.name} preset: open the editor`}
                className="absolute inset-0 rounded-[28px] focus-visible:outline-offset-4"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
