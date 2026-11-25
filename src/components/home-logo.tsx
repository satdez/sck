import { readFileSync } from "node:fs";
import path from "node:path";
import { HomeLogoView } from "./home-logo-view";

// the 3D Solo Creator Kit lockup (solo-c-k-01.svg), inlined so it can animate
const MARKUP = readFileSync(path.join(process.cwd(), "public/logo/11-imported-solo-c-k-01.svg"), "utf8").replace(
  "<svg ",
  '<svg role="img" aria-label="Solo Creator Kit" class="block h-16 w-auto overflow-visible sm:h-20" ',
);

export function HomeLogo() {
  return <HomeLogoView markup={MARKUP} />;
}
