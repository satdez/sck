import type { Metadata } from "next";
import { DealsScreen } from "@/components/solo/kit-pages";

export const metadata: Metadata = { title: "Deals · Solo" };

export default function Page() {
  return <DealsScreen />;
}
