import type { Metadata } from "next";
import { PayoutsScreen } from "@/components/solo/kit-pages";

export const metadata: Metadata = { title: "Payouts · Solo" };

export default function Page() {
  return <PayoutsScreen />;
}
