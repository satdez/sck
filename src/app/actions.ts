"use server";

import { updateTag } from "next/cache";
import { isTaken, normalizeSlug, pageTag, RESERVED, savePortfolio, saveRedirect } from "@/lib/store";
import { SAMPLE } from "@/lib/sample";
import type { Portfolio } from "@/lib/types";

export type PublishResult = { ok: true; slug: string; publishedAt: string } | { ok: false; error: string };

export async function checkSlug(raw: string, ownerSlug?: string): Promise<{ ok: boolean; reason?: string }> {
  const slug = normalizeSlug(raw);
  if (slug.length < 3) return { ok: false, reason: "Use at least 3 letters or numbers." };
  if (RESERVED.has(slug)) return { ok: false, reason: "That name is reserved." };
  if (slug === ownerSlug) return { ok: true };
  // the demo page is "taken" so people see what a clash looks like
  if (slug === SAMPLE.slug || slug === "arun") return { ok: false, reason: "Taken. Try another." };
  return (await isTaken(slug)) ? { ok: false, reason: "Taken. Try another." } : { ok: true };
}

/**
 * Prototype publish: no auth yet, so a page is owned by whoever knows its
 * previous slug (passed as ownerSlug). Real version: owner = Solo account id.
 */
export async function publish(p: Portfolio, ownerSlug?: string): Promise<PublishResult> {
  const slug = normalizeSlug(p.slug);
  const check = await checkSlug(slug, ownerSlug);
  if (!check.ok) return { ok: false, error: check.reason ?? "Pick another name." };
  const publishedAt = new Date().toISOString();
  await savePortfolio({ ...p, slug, publishedAt });
  updateTag(pageTag(slug));
  // renamed: the old address now forwards here instead of serving the old page
  const old = ownerSlug ? normalizeSlug(ownerSlug) : null;
  if (old && old !== slug) {
    await saveRedirect(old, slug);
    updateTag(pageTag(old));
  }
  return { ok: true, slug, publishedAt };
}
