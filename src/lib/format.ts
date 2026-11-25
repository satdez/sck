import type { InsightItem, Platform } from "./types";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const fmtCompact = (n: number) => compact.format(n);

export function fmtInsight(item: Pick<InsightItem, "value" | "format">) {
  switch (item.format) {
    case "percent":
      return `${item.value}%`;
    case "currency":
      return `₹${compact.format(item.value)}`;
    case "plain":
      return item.value.toLocaleString("en-IN");
    default:
      return compact.format(item.value);
  }
}

/** Turn a public post URL into an embeddable iframe src (or null → link out). */
export function embedSrc(platform: Platform, url: string): string | null {
  try {
    const u = new URL(url);
    if (platform === "youtube") {
      const id =
        u.searchParams.get("v") ??
        (u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.pathname.split("/").pop());
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (platform === "instagram") {
      const m = u.pathname.match(/\/(p|reel|tv)\/([^/]+)/);
      return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
    }
    if (platform === "tiktok") {
      const m = u.pathname.match(/video\/(\d+)/);
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    }
  } catch {
    /* not a url */
  }
  return null;
}

/** Contact button target + label: email if public, else the contact page link. */
export function contactTarget(c: { email: string; url?: string }) {
  if (c.email) return { href: `mailto:${c.email}`, label: c.email };
  return { href: c.url || "#", label: "Business enquiries", external: !!c.url };
}

export function sum(ns: number[]) {
  return ns.reduce((a, b) => a + b, 0);
}
