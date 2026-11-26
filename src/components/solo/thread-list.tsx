"use client";

import { Ban, BellOff } from "lucide-react";
import { fmtWhen } from "@/lib/solo/money";
import { STAGE_LABEL, STAGE_TONE } from "@/lib/solo/stages";
import { useSolo } from "@/lib/solo/store";
import type { Thread } from "@/lib/solo/types";
import { BrandMark, Chip, CreatorMark, VerifiedBadge } from "./ui";

function preview(t: Thread, viewer: "creator" | "brand") {
  const m = t.messages.at(-1);
  if (!m) return "";
  const you = m.from === viewer ? "You: " : "";
  switch (m.kind) {
    case "text":
      return you + m.text;
    case "brief":
      return `${you}Brief v${m.briefVersion}`;
    case "funded":
      return "Funds secured in escrow";
    case "draft":
      return `${you}Draft submitted`;
    case "review":
      return m.text === "approved" ? "Draft approved" : "Changes requested";
    case "live":
      return "Post is live";
    case "paid":
      return "Payment released";
    default:
      return m.text ?? "";
  }
}

export function ThreadList({ threads, viewer, activeId, onOpen }: { threads: Thread[]; viewer: "creator" | "brand"; activeId: string | null; onOpen: (id: string) => void }) {
  const brands = useSolo((s) => s.brands);
  const creator = useSolo((s) => s.creator);
  return (
    <ul className="flex flex-col p-2">
      {threads.map((t) => {
        const b = brands.find((x) => x.id === t.brandId)!;
        const unread = t.unread[viewer] > 0;
        const active = t.id === activeId;
        const last = t.messages.at(-1);
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onOpen(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${active ? "bg-ui-panel shadow-[0_0_0_1px_var(--ui-line)]" : "hover:bg-ui-sunken/70"}`}
            >
              {viewer === "creator" ? <BrandMark brand={b} size={44} /> : <CreatorMark name={creator.name} src={creator.avatar} size={44} />}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className={`truncate text-[14px] ${unread ? "font-bold" : "font-semibold"}`}>{viewer === "creator" ? b.name : creator.name}</span>
                  {viewer === "creator" && <VerifiedBadge v={b.verification} compact />}
                  {viewer === "creator" && t.muted && <BellOff className="size-3.5 shrink-0 text-ui-muted" aria-label="Muted" />}
                  {viewer === "creator" && t.blocked && <Ban className="size-3.5 shrink-0 text-[#dc2626]" aria-label="Blocked" />}
                  <span className="ml-auto shrink-0 text-[11px] text-ui-muted">{last ? fmtWhen(last.at) : ""}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${unread ? "text-ui-ink" : "text-ui-muted"}`}>{preview(t, viewer)}</span>
                  {unread ? <span className="size-2.5 shrink-0 rounded-full bg-ui-accent shadow-[0_0_0_1px_rgb(0_0_0/0.2)]" /> : t.stage !== "chat" && <Chip tone={STAGE_TONE[t.stage]}>{STAGE_LABEL[t.stage]}</Chip>}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
