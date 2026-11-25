import { Suspense } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { LogoGrid, type LogoVariation } from "./logo-grid";

// Exploration route only: not for indexing.
export const metadata = {
  title: "Logo exploration · Solo",
  robots: { index: false, follow: false },
};

async function Variations() {
  // Read the SVG files per request, not at build time.
  await connection();
  const dir = path.join(process.cwd(), "public", "logo");
  const manifest: Omit<LogoVariation, "svg">[] = JSON.parse(
    await readFile(path.join(dir, "manifest.json"), "utf8"),
  );
  const variations: LogoVariation[] = await Promise.all(
    manifest.map(async (v) => ({
      ...v,
      svg: await readFile(path.join(dir, `${v.slug}.svg`), "utf8"),
    })),
  );
  return <LogoGrid variations={variations} />;
}

export default function LogoPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", background: "#0e0e0e" }} />}>
      <Variations />
    </Suspense>
  );
}
