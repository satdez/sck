import type { Metadata } from "next";
import { EditorLoader } from "./loader";

export const metadata: Metadata = { title: "Editor · sck.bio" };

export default function EditorPage() {
  return <EditorLoader />;
}
