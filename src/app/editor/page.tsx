import type { Metadata } from "next";
import { CoinFavicon } from "@/components/coin-favicon";
import { EditorLoader } from "./loader";

export const metadata: Metadata = { title: "Editor · sck.bio" };

export default function EditorPage() {
  return (
    <>
      <CoinFavicon />
      <EditorLoader />
    </>
  );
}
