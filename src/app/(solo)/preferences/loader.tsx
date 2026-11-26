"use client";

import dynamic from "next/dynamic";

// Preferences read the saved look from localStorage on first render, so the screen renders on the client only.
const Screen = dynamic(() => import("@/components/solo/preferences-screen").then((m) => m.PreferencesScreen), {
  ssr: false,
  loading: () => (
    <div className="grid flex-1 place-items-center py-24">
      <div className="size-6 animate-spin rounded-full border-2 border-ui-line border-t-ui-ink" />
    </div>
  ),
});

export function PreferencesLoader() {
  return <Screen />;
}
