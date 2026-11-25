// Renders the landing page's phone image from the live /hero-render page.
// Usage (dev server running on :3000):  node scripts/render-hero.mjs
// Needs Chrome or Edge installed. Writes public/hero-phones.webp (2x, ~1440×1520).
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const browsers = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
const browser = browsers.find((b) => existsSync(b));
if (!browser) throw new Error("No Chrome/Edge found");

const url = process.env.HERO_URL ?? "http://localhost:3000/hero-render";

// The avatar/banner host sometimes refuses headless Chrome, so render from local copies.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const sample = readFileSync("src/lib/sample.ts", "utf8");
const pick = (re) => sample.match(re)?.[1];
const assets = {
  "avatar.jpg": pick(/avatar:\s*"([^"]+)"/),
  "banner.jpg": pick(/banner:[\s\S]*?url:\s*"([^"]+)"/),
};
const localDir = path.resolve("public/_render");
mkdirSync(localDir, { recursive: true });
for (const [name, src] of Object.entries(assets)) {
  if (!src) throw new Error(`couldn't find ${name} url in sample.ts`);
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  writeFileSync(path.join(localDir, name), Buffer.from(await res.arrayBuffer()));
}
const dir = mkdtempSync(path.join(tmpdir(), "hero-"));
const png = path.join(dir, "hero.png");

execFileSync(
  browser,
  [
    "--headless=new",
    "--hide-scrollbars",
    "--disable-gpu",
    `--user-data-dir=${path.join(dir, "profile")}`,
    "--window-size=720,760",
    "--force-device-scale-factor=2",
    "--virtual-time-budget=25000", // let fonts and remote images load
    "--run-all-compositor-stages-before-draw",
    `--screenshot=${png}`,
    url,
  ],
  { stdio: "inherit" },
);

const out = path.resolve("public/hero-phones.webp");
const info = await sharp(png).webp({ quality: 84, effort: 6 }).toFile(out);
console.log(`wrote ${out} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
rmSync(dir, { recursive: true, force: true });
rmSync(localDir, { recursive: true, force: true });
