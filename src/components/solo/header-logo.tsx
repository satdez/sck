import { readFileSync } from "node:fs";
import path from "node:path";
import { HomeLogoView } from "../home-logo-view";

// Same animated 3D Solo Creator Kit lockup as the home page, sized for a 56px bar.
// Plays on load, replays on hover/tap (see .hl in globals.css).
const MARKUP = readFileSync(path.join(process.cwd(), "public/logo/11-imported-solo-c-k-01.svg"), "utf8").replace(
  "<svg ",
  '<svg role="img" aria-label="Solo Creator Kit" class="block h-11 w-auto overflow-visible" ',
);

export function HeaderLogo() {
  return <HomeLogoView markup={MARKUP} />;
}
