import type { Metadata } from "next";
import { StoreScreen } from "@/components/solo/store-screen";

export const metadata: Metadata = { title: "Store · Solo" };

export default function Page() {
  return <StoreScreen />;
}
