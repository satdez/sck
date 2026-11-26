import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ThemeScope } from "@/components/portfolio/theme-scope";
import { ShopView } from "@/components/solo/shop-view";
import { getPortfolio } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/[slug]/shop">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPortfolio(slug);
  return p ? { title: `Shop · ${p.profile.name} · sck.bio`, description: `Guides, calls and more from ${p.profile.name}.` } : { title: "Not found · sck.bio" };
}

/** name.sck.bio/shop: the fan-facing storefront, in the creator's page theme. */
async function Shop({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPortfolio(slug);
  if (!p) notFound();
  return (
    <ThemeScope theme={p.theme} className="min-h-dvh" glowSrc={p.profile.avatar}>
      <ShopView portfolio={p} />
    </ThemeScope>
  );
}

export default function ShopPage({ params }: PageProps<"/[slug]/shop">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Shop params={params} />
    </Suspense>
  );
}
