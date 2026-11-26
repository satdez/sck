import type { Metadata } from "next";
import { DmScreen } from "@/components/solo/dm-automation";

export const metadata: Metadata = { title: "DM automation · Solo" };

export default function Page() {
  return <DmScreen />;
}
