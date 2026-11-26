import type { Metadata } from "next";
import { AdminScreen } from "@/components/solo/admin-screen";

export const metadata: Metadata = { title: "Ops · Solo" };

export default function Page() {
  return <AdminScreen />;
}
