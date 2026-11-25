import Image from "next/image";
import Link from "next/link";
import { SAMPLE } from "@/lib/sample";
import { ClaimForm } from "./claim-form";

export default function Home() {
  return (
    <div className="app relative min-h-dvh overflow-x-clip bg-[#0b0b0b] text-white">
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 sm:px-6">
        {/* the 3D Solo Creator Kit lockup (solo-c-k-01.svg) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/11-imported-solo-c-k-01.svg" alt="Solo Creator Kit" width={284} height={201} className="h-16 w-auto sm:h-20" />
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

        {/* ── three phones: one pre-rendered image (scripts/render-hero.mjs), so phones scroll this page smoothly ── */}
        <div className="enter -mx-5 -mt-10 -mb-12 sm:mx-auto sm:my-0 sm:w-full sm:max-w-[600px]" style={{ ["--i" as string]: 1 }}>
          <Image
            src="/hero-phones.webp"
            alt="Three example creator pages on iPhones"
            width={1440}
            height={1520}
            priority
            sizes="(min-width: 1024px) 600px, (min-width: 640px) 600px, 100vw"
            className="h-auto w-full select-none"
            draggable={false}
          />
        </div>
      </main>
    </div>
  );
}
