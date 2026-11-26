import type { Metadata } from "next";
import { ChatScreen } from "@/components/solo/inbox-screen";

export const metadata: Metadata = { title: "Inbox · Solo" };

export default function Page() {
  return <ChatScreen viewer="creator" />;
}
