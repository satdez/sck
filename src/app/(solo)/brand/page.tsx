import type { Metadata } from "next";
import { ChatScreen } from "@/components/solo/inbox-screen";

export const metadata: Metadata = { title: "Chats · Solo for Brands" };

export default function Page() {
  return <ChatScreen viewer="brand" />;
}
