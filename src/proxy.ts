import { NextResponse, type NextRequest } from "next/server";

/**
 * name.sck.bio  →  /name
 * Works locally too: http://mrwhosetheboss.localhost:3000
 */
const ROOT_HOSTS = ["sck.bio", "localhost"];

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const root = ROOT_HOSTS.find((r) => host.endsWith(`.${r}`));
  if (!root) return NextResponse.next();

  const sub = host.slice(0, -(root.length + 1));
  if (!sub || sub === "www") return NextResponse.next();

  const url = req.nextUrl.clone();
  // assets & the share-card image keep their own path under the slug
  url.pathname = req.nextUrl.pathname === "/" ? `/${sub}` : `/${sub}${req.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|api/).*)"],
};
