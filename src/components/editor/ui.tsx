"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";

/* Small set of editor primitives on the --ui-* tokens. */

export const inputCls =
  "ed-input w-full rounded-lg border border-ui-line bg-ui-panel px-3 py-2 text-sm text-ui-ink placeholder:text-ui-muted/70 outline-none transition-[border-color,box-shadow] duration-150 focus:border-ui-ink/40 focus:ring-4 focus:ring-ui-ink/5";

export function FieldRow({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-ui-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-ui-muted">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, hint, id, ...rest } = props;
  const auto = useId();
  return (
    <FieldRow label={label} hint={hint} htmlFor={id ?? auto}>
      <input id={id ?? auto} className={inputCls} {...rest} />
    </FieldRow>
  );
}

/** Segmented control with a sliding pill (shared layout animation). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  id: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" className="relative flex rounded-xl bg-ui-sunken p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 ${
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm"
            } ${active ? "text-ui-ink" : "text-ui-muted hover:text-ui-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-ui-panel shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--ui-line)]"
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1 text-sm"
    >
      <span>{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-ui-ink" : "bg-ui-line"}`}
      >
        <span
          className="absolute top-0.5 left-0.5 size-4 rounded-full bg-ui-panel shadow transition-transform duration-200"
          style={{ transform: checked ? "translateX(16px)" : "none", transitionTimingFunction: "var(--ease-out)" }}
        />
      </span>
    </button>
  );
}

export function PanelCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-ui-muted uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
