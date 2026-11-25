import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { getMovedTo, getPortfolio } from "@/lib/store";

const ROOT_HOSTS = ["sck.bio", "localhost"];

/** A renamed page's new address: same style of URL the visitor used (subdomain or path). */
async function movedUrl(to: string) {
  const h = await headers();
  const host = h.get("host") ?? "";
  const [name, port] = host.split(":");
  const root = ROOT_HOSTS.find((r) => name.endsWith(`.${r}`));
  if (!root) return `/${to}`;
  const proto = h.get("x-forwarded-proto") ?? (root === "localhost" ? "http" : "https");
  return `${proto}://${to}.${root}${port ? `:${port}` : ""}`;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPortfolio(slug);
  if (!p) {
    // redirect here (before streaming starts) so it's a real HTTP 308, not a client-side hop
    const to = await getMovedTo(slug);
    if (to) permanentRedirect(await movedUrl(to));
    return { title: "Not found · sck.bio" };
  }
  return {
    title: `${p.profile.name} (${p.profile.handle}) · sck.bio`,
    description: p.profile.bio,
  };
}

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPortfolio(slug); // cached per slug, busted on publish
  if (!p) {
    const to = await getMovedTo(slug);
    if (to) permanentRedirect(await movedUrl(to));
    notFound();
  }
  return <PortfolioView portfolio={p} className="min-h-dvh" />;
}

export default function PublicPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Page params={params} />
    </Suspense>
  );
}
