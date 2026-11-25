import {
  Bricolage_Grotesque,
  DM_Sans,
  Geist,
  Geist_Mono,
  Inter,
  Instrument_Serif,
  Space_Grotesk,
} from "next/font/google";
import localFont from "next/font/local";
// Font *loaders* — import only from the root layout. The CSS stacks live in font-map.ts.

const geist = Geist({ subsets: ["latin"], variable: "--f-geist" });
const inter = Inter({ subsets: ["latin"], variable: "--f-inter" });
// Gilroy (licensed files in src/fonts): headings across the app, optional on creator pages.
const gilroy = localFont({
  src: [
    { path: "../fonts/Gilroy-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Gilroy-Italic.ttf", weight: "400", style: "italic" },
    { path: "../fonts/Gilroy-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Gilroy-SemiBoldItalic.ttf", weight: "600", style: "italic" },
  ],
  variable: "--f-gilroy",
  display: "swap",
});
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-grotesk", preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-bricolage", preload: false });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--f-serif",
  preload: false,
});
const dmsans = DM_Sans({ subsets: ["latin"], variable: "--f-dmsans", preload: false });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono", preload: false });

export const fontVariables = [geist, inter, gilroy, grotesk, bricolage, serif, dmsans, mono]
  .map((f) => f.variable)
  .join(" ");
