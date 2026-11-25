import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { IPhoneFrame } from "@/components/editor/iphone-frame";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { SAMPLE } from "@/lib/sample";
import { getPreset, presetTheme, resolveTheme } from "@/lib/themes";

/**
 * Development-only stage for the landing page's phone image.
 * `node scripts/render-hero.mjs` screenshots this at 2x and writes public/hero-phones.webp,
 * so the landing page ships one light image instead of three live pages.
 */
// local copies written by the render script (remote hosts can refuse headless Chrome)
const local = (f: string) => existsSync(path.join(process.cwd(), "public/_render", f));
const profile = {
  ...SAMPLE.profile,
  avatar: local("avatar.jpg") ? "/_render/avatar.jpg" : SAMPLE.profile.avatar,
  banner: local("banner.jpg") ? { type: "image" as const, url: "/_render/banner.jpg" } : SAMPLE.profile.banner,
};

function Phone({ preset }: { preset: string }) {
  const theme = presetTheme(getPreset(preset));
  const { palette } = resolveTheme(theme);
  return (
    <IPhoneFrame barBg={palette.bg} barInk={palette.ink} still>
      <PortfolioView portfolio={{ ...SAMPLE, profile, theme }} className="min-h-full" />
    </IPhoneFrame>
  );
}

export default function HeroRender() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    // 720 × 760 stage on the landing page's exact background, so the image edges vanish
    <div className="hero-stage relative h-[760px] w-[720px] overflow-hidden bg-[#0b0b0b]">
      {/* keep Next's dev badge out of the screenshot */}
      <style>{"nextjs-portal{display:none!important}"}</style>
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgb(150 255 67 / 0.16), transparent)" }}
      />
      <div className="fan-side absolute top-[118px] left-1/2 h-[530px] w-[259px]" style={{ ["--fan" as string]: "-1" }}>
        <Phone preset="golden" />
      </div>
      <div className="fan-side absolute top-[118px] left-1/2 h-[530px] w-[259px]" style={{ ["--fan" as string]: "1" }}>
        <Phone preset="acid" />
      </div>
      <div className="absolute top-[72px] left-1/2 z-10 h-[613px] w-[300px] -translate-x-1/2">
        <Phone preset="afterglow" />
      </div>
    </div>
  );
}
