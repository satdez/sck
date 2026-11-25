import Link from "next/link";
import { IPhoneFrame } from "@/components/editor/iphone-frame";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { SoloCreatorKit } from "@/components/solo-logo";
import { SAMPLE } from "@/lib/sample";
import { getPreset, presetTheme, resolveTheme } from "@/lib/themes";
import { ClaimForm } from "./claim-form";

/** One live phone: the real frame, a real page, no captions. */
function Phone({ preset }: { preset: string }) {
  const theme = presetTheme(getPreset(preset));
  const { palette } = resolveTheme(theme);
  return (
    <IPhoneFrame barBg={palette.bg} barInk={palette.ink}>
      <PortfolioView portfolio={{ ...SAMPLE, theme }} className="min-h-full" />
    </IPhoneFrame>
  );
}

export default function Home() {
  return (
    <div className="app relative min-h-dvh overflow-x-clip bg-[#0b0b0b] text-white">
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 sm:px-6">
        <SoloCreatorKit height={26} />
        <Link
          href="/editor"
          className="ui-press inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white/80 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] hover:text-white"
        >
          Open editor
        </Link>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-6 pb-16 sm:px-6 lg:min-h-[calc(100dvh-88px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-6 lg:pt-0 lg:pb-10">
        {/* ── the ask ── */}
        <section className="enter relative z-20 flex min-w-0 flex-col items-start gap-7" style={{ ["--i" as string]: 0 }}>
          <h1 className="max-w-[13ch] text-[clamp(2.75rem,9vw,4rem)] leading-[0.95] font-semibold tracking-[-0.04em] text-balance xl:text-[4.5rem]">
            Your work, your numbers, one link.
          </h1>
          <p className="max-w-[38ch] text-[17px] leading-relaxed text-pretty text-white/60 sm:text-lg">
            The page brands check before they book you. Build it in minutes, drop it in your bio.
          </p>
          <ClaimForm />
          <Link href={`/${SAMPLE.slug}`} className="text-sm font-medium text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline">
            See a live example
          </Link>
        </section>

        {/* ── three live phones, fanned ── */}
        <section aria-label="Example pages" className="group relative mx-auto h-[500px] w-full max-w-[560px] sm:h-[640px]">
          {/* one soft brand glow, nothing more */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgb(150 255 67 / 0.22), transparent)" }}
          />
          <div
            className="fan-side enter absolute top-[8%] left-1/2 h-[430px] w-[210px] sm:h-[530px] sm:w-[259px]"
            style={{ ["--i" as string]: 2, ["--fan" as string]: "-1" }}
            aria-hidden
            inert
          >
            <Phone preset="golden" />
          </div>
          <div
            className="fan-side enter absolute top-[8%] left-1/2 h-[430px] w-[210px] sm:h-[530px] sm:w-[259px]"
            style={{ ["--i" as string]: 3, ["--fan" as string]: "1" }}
            aria-hidden
            inert
          >
            <Phone preset="acid" />
          </div>
          <div className="fan-center enter absolute top-0 left-1/2 z-10 h-[490px] w-[240px] -translate-x-1/2 sm:h-[613px] sm:w-[300px]" style={{ ["--i" as string]: 1 }}>
            <Phone preset="afterglow" />
          </div>
        </section>
      </main>
    </div>
  );
}
