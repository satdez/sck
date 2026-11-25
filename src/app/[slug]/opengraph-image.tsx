import { ImageResponse } from "next/og";
import { fmtCompact, sum } from "@/lib/format";
import { getPortfolio } from "@/lib/store";
import { resolveTheme } from "@/lib/themes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Creator portfolio on sck.bio";

/** The share card: what shows up when the link is pasted in DMs, X, WhatsApp… */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPortfolio(slug);
  if (!p) return new ImageResponse(<div style={{ display: "flex" }}>sck.bio</div>, size);

  const { palette } = resolveTheme(p.theme);
  const socials = p.sections.find((s) => s.type === "socials");
  const total = socials ? sum(socials.items.map((i) => (i as { followers: number }).followers)) : 0;
  const brands = p.sections.find((s) => s.type === "brands")?.items.length ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 64,
          gap: 56,
          alignItems: "center",
          background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bg2} 100%)`,
          color: palette.ink,
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.profile.avatar} width={300} height={300} style={{ borderRadius: 999, objectFit: "cover" }} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>{p.profile.name}</div>
          <div style={{ fontSize: 30, opacity: 0.7 }}>{p.profile.handle}</div>
          <div style={{ fontSize: 30, lineHeight: 1.3 }}>{p.profile.bio}</div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {total > 0 && (
              <div style={{ display: "flex", padding: "12px 22px", borderRadius: 999, background: palette.accent, color: palette.accentInk, fontSize: 26, fontWeight: 700 }}>
                {fmtCompact(total)} followers
              </div>
            )}
            {brands > 0 && (
              <div style={{ display: "flex", padding: "12px 22px", borderRadius: 999, background: palette.surface2, fontSize: 26 }}>
                {brands} brand collabs
              </div>
            )}
          </div>
          <div style={{ fontSize: 24, opacity: 0.6, marginTop: 8 }}>{p.slug}.sck.bio</div>
        </div>
      </div>
    ),
    size,
  );
}
