"use client";

import dynamic from "next/dynamic";

// The editor reads the draft from localStorage on first render, so it only renders on the client.
const Editor = dynamic(() => import("@/components/editor/editor"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-ui-bg">
      <div className="size-6 animate-spin rounded-full border-2 border-ui-line border-t-ui-ink" />
    </div>
  ),
});

export function EditorLoader() {
  return <Editor />;
}
