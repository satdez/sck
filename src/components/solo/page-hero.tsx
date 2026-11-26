import type { ReactNode } from "react";

/** A page's title, one line of explanation, and its main action. */
export function PageHero({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-[clamp(1.75rem,4.5vw,2.25rem)] leading-tight font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-[56ch] text-sm text-pretty text-ui-muted">{body}</p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
