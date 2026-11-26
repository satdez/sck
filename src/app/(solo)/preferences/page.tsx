import type { Metadata } from "next";
import { PreferencesLoader } from "./loader";

export const metadata: Metadata = { title: "Preferences · Solo" };

export default function Page() {
  return <PreferencesLoader />;
}
