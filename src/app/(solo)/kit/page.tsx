import type { Metadata } from "next";
import { KitHome } from "@/components/solo/kit-home";

export const metadata: Metadata = { title: "Creator Kit · Solo" };

export default function Page() {
  return <KitHome />;
}
