"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** "yourname.sck.bio  [Claim]": the one thing the landing page asks you to do. */
export function ClaimForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(slug ? `/editor?slug=${encodeURIComponent(slug)}` : "/editor");
      }}
      className="flex w-full max-w-[440px] items-center gap-1.5 rounded-[20px] bg-white/[0.06] p-1.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_rgb(150_255_67/0.55),0_0_0_4px_rgb(150_255_67/0.12)]"
    >
      <label className="flex min-w-0 flex-1 cursor-text items-center pl-3.5 text-[16px]">
        <span className="sr-only">Choose your page name</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30))}
          placeholder="yourname"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="go"
          size={Math.max(slug.length, 8)}
          // the whole pill shows the focus ring, so the field itself drops the global outline
          style={{ fieldSizing: "content", outline: "none" } as React.CSSProperties}
          className="max-w-[18ch] min-w-[2ch] bg-transparent font-semibold text-white placeholder:text-white/35"
        />
        <span className="truncate text-white/45">.sck.bio</span>
      </label>
      <button
        type="submit"
        className="ui-press inline-flex h-12 shrink-0 items-center gap-2 rounded-[14px] bg-[#96ff43] px-5 text-[15px] font-semibold text-[#0b0b0b] shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]"
      >
        Claim <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
