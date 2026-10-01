"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  number: number;
  title: string;
  open: boolean;
  /** Collapsed summary shown once the step is complete. */
  summary?: ReactNode;
  onChange?: () => void;
  children: ReactNode;
};

export function StepSection({ number, title, open, summary, onChange, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const wasOpen = useRef(open);

  // When a step opens after the first render, bring it into view and move
  // focus to its heading so keyboard and screen reader users follow along.
  useEffect(() => {
    if (open && !wasOpen.current) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      ref.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <section
      ref={ref}
      aria-labelledby={`step-${number}`}
      className={`rounded-lg bg-white p-5 ${open ? "ring-2 ring-[#e77600]/40" : ""}`}
    >
      <div className="flex items-start gap-4">
        <span className="text-lg font-bold text-ink">{number}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h2 id={`step-${number}`} tabIndex={-1} className={`text-lg font-bold outline-none ${open ? "text-[#c45500]" : "text-ink"}`}>
              {title}
            </h2>
            {!open && onChange && summary && (
              <button
                type="button"
                onClick={onChange}
                className="text-sm text-link hover:text-link-hover hover:underline"
              >
                Change
              </button>
            )}
          </div>
          {open ? <div className="mt-3">{children}</div> : summary && <div className="mt-1 text-sm text-ink">{summary}</div>}
        </div>
      </div>
    </section>
  );
}
