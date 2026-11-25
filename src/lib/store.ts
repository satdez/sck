import "server-only";
import { promises as fs } from "fs";
import { cacheTag } from "next/cache";
import path from "path";
import { SAMPLE } from "./sample";
import type { Portfolio } from "./types";

/**
 * Prototype persistence: one JSON file per published page in /data/pages.
 * Swap this module for a real DB (Postgres/Supabase/KV) later — callers only
 * use getPortfolio / savePortfolio / isSlugTaken.
 */
const DIR = path.join(process.cwd(), "data", "pages");

export const RESERVED = new Set(["editor", "api", "www", "app", "admin", "solo", "help", "login"]);

export function normalizeSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
}

export const pageTag = (slug: string) => `page-${normalizeSlug(slug)}`;

/** A renamed page leaves a stub at its old address, so links already in bios keep working. */
type Stored = Portfolio | { movedTo: string };

async function read(slug: string): Promise<Stored | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(DIR, `${normalizeSlug(slug)}.json`), "utf8")) as Stored;
  } catch {
    return null;
  }
}

export async function getPortfolio(slug: string): Promise<Portfolio | null> {
  "use cache";
  const clean = normalizeSlug(slug);
  cacheTag(pageTag(clean));
  const s = await read(clean);
  if (s && !("movedTo" in s)) return s;
  return !s && clean === SAMPLE.slug ? SAMPLE : null;
}

/** Where a renamed page went, if this address is an old one. */
export async function getMovedTo(slug: string): Promise<string | null> {
  "use cache";
  const clean = normalizeSlug(slug);
  cacheTag(pageTag(clean));
  const s = await read(clean);
  return s && "movedTo" in s ? s.movedTo : null;
}

/** Taken = a live page or a redirect from a renamed one. */
export async function isTaken(slug: string) {
  return (await read(slug)) !== null;
}

export async function saveRedirect(from: string, to: string) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${normalizeSlug(from)}.json`), JSON.stringify({ movedTo: normalizeSlug(to) }, null, 2));
}

export async function savePortfolio(p: Portfolio) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${normalizeSlug(p.slug)}.json`), JSON.stringify(p, null, 2));
}
