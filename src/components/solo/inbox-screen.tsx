"use client";

import { Inbox, MessageSquareDashed } from "lucide-react";
import { useEffect, useState } from "react";
import { openThread, useSolo } from "@/lib/solo/store";
import type { Thread } from "@/lib/solo/types";
import { Segmented } from "../editor/ui";
import { AppShell } from "./shell";
import { ThreadList } from "./thread-list";
import { ThreadView } from "./thread-view";
import { Empty } from "./ui";

const latest = (t: Thread) => t.messages.at(-1)?.at ?? t.createdAt;

/** Shared two-pane chat screen. Creator sees Inbox + Requests; a brand sees its own chats. */
export function ChatScreen({ viewer }: { viewer: "creator" | "brand" }) {
  const all = useSolo((s) => s.threads);
  const brandSelf = useSolo((s) => s.brandSelf);
  const openId = useSolo((s) => s.open[viewer]);
  const [tab, setTab] = useState<"inbox" | "requests">("inbox");

  const mine = viewer === "brand" ? all.filter((t) => t.brandId === brandSelf) : all;
  const inbox = mine.filter((t) => viewer === "brand" || t.folder === "inbox").sort((a, b) => latest(b) - latest(a));
  const requests = viewer === "creator" ? mine.filter((t) => t.folder === "requests").sort((a, b) => latest(b) - latest(a)) : [];
  const list = tab === "inbox" ? inbox : requests;
  const active = mine.find((t) => t.id === openId) ?? null;
  const activeUnread = active ? active.unread[viewer] : 0;

  // whatever is open counts as read, including messages that arrive while it's open
  useEffect(() => {
    if (active && activeUnread > 0) openThread(viewer, active.id);
  }, [active, activeUnread, viewer]);

  return (
    <AppShell role={viewer} bleed>
      <div className="flex h-[calc(100dvh-57px-58px-env(safe-area-inset-bottom))] min-h-0 md:h-[calc(100dvh-57px)]">
        {/* list */}
        <div className={`w-full shrink-0 flex-col border-r border-ui-line lg:flex lg:w-[340px] ${active ? "hidden" : "flex"}`}>
          <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{viewer === "creator" ? "Inbox" : "Chats"}</h1>
          </div>
          {viewer === "creator" && (
            <div className="px-4 pb-2">
              <Segmented
                id="inbox-tab"
                size="sm"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "inbox", label: <>Inbox{inbox.filter((t) => t.unread.creator).length > 0 && <span className="rounded-full bg-ui-accent px-1.5 text-[10px] font-bold text-ui-accent-ink tabular-nums">{inbox.filter((t) => t.unread.creator).length}</span>}</> },
                  { value: "requests", label: <>Requests{requests.length > 0 && <span className="rounded-full bg-ui-ink/10 px-1.5 text-[10px] font-bold tabular-nums dark:bg-white/15">{requests.length}</span>}</> },
                ]}
              />
              {tab === "requests" && <p className="px-1 pt-2 text-[12px] text-pretty text-ui-muted">Brands that aren&apos;t verified yet. Replying accepts them into your inbox.</p>}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.length ? (
              <ThreadList threads={list} viewer={viewer} activeId={openId} onOpen={(id) => openThread(viewer, id)} />
            ) : (
              <Empty icon={<Inbox className="size-5" />} title={tab === "requests" ? "No requests" : "No chats yet"} body={viewer === "creator" ? "Brands reach you from the Reach out button on your sck.bio page." : "Reach out to a creator from their sck.bio page."} />
            )}
          </div>
        </div>

        {/* thread */}
        <div className={`min-w-0 flex-1 flex-col ${active ? "flex" : "hidden lg:flex"}`}>
          {active ? (
            <ThreadView key={active.id} thread={active} viewer={viewer} onBack={() => openThread(viewer, null)} />
          ) : (
            <div className="grid flex-1 place-items-center">
              <Empty icon={<MessageSquareDashed className="size-5" />} title="Pick a chat" body="Briefs, drafts and payments all happen inside the chat." />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
