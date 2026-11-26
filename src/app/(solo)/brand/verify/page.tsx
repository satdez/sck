import type { Metadata } from "next";
import { BrandVerify } from "@/components/solo/brand-verify";

export const metadata: Metadata = { title: "Get verified · Solo for Brands" };

export default function Page() {
  return <BrandVerify />;
}
