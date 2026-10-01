"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronIcon } from "@/components/icons";

type Props = {
  children: ReactNode;
  label: string;
  /** Classes for the scrolling track (gap, padding). */
  className?: string;
  /** Visual style of the arrow buttons. */
  arrows?: "tall" | "compact";
};

/**
 * Horizontal scroller with snap points. Touch/trackpad scroll natively;
 * on desktop, arrow buttons page by roughly one viewport of the row.
 */
export function ScrollRow({ children, label, className = "", arrows = "compact" }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = () => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const button =
    arrows === "tall"
      ? "top-1/2 h-32 w-12 -translate-y-1/2 rounded-md bg-white/90 shadow-md"
      : "top-[35%] h-24 w-11 -translate-y-1/2 rounded-sm border border-[#d5d9d9] bg-white shadow-md";

  return (
    <div className="relative" role="region" aria-label={label}>
      <div
        ref={track}
        onScroll={updateEdges}
        className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth ${className}`}
      >
        {children}
      </div>

      {!edges.start && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => page(-1)}
          className={`absolute left-0 hidden items-center justify-center text-ink hover:bg-white md:flex ${button}`}
        >
          <ChevronIcon direction="left" className="size-7" />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => page(1)}
          className={`absolute right-0 hidden items-center justify-center text-ink hover:bg-white md:flex ${button}`}
        >
          <ChevronIcon className="size-7" />
        </button>
      )}
    </div>
  );
}
