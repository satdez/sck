"use client";

import type { ReactNode } from "react";
import { Drawer } from "vaul";

/** Bottom sheet on phones, centred-bottom panel on desktop. One pattern for every Solo form. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <Drawer.Content
          className={`app fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] flex-col rounded-t-[28px] bg-ui-panel text-ui-ink outline-none ${wide ? "max-w-xl" : "max-w-md"}`}
        >
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-ui-line" />
          <div className="px-6 pt-4 pb-3">
            <Drawer.Title className="font-heading text-xl font-semibold tracking-tight">{title}</Drawer.Title>
            {description ? <Drawer.Description className="mt-1 text-sm text-pretty text-ui-muted">{description}</Drawer.Description> : <Drawer.Description className="sr-only">{title}</Drawer.Description>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-4" data-vaul-no-drag>
            {children}
          </div>
          {footer && <div className="border-t border-ui-line px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Same field as the editor (inputCls in editor/ui.tsx), so density preferences apply too. */
export const fieldCls =
  "ed-input w-full rounded-lg border border-ui-line bg-ui-panel px-3 py-2.5 text-[16px] text-ui-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ui-muted/70 focus:border-ui-ink/40 focus:ring-4 focus:ring-ui-ink/5 lg:py-2 lg:text-sm";

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ui-muted">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-ui-muted">{hint}</span>}
    </label>
  );
}
