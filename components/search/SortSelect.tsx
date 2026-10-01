"use client";

import { useRouter } from "next/navigation";
import { CaretDownIcon } from "@/components/icons";

type Option = { value: string; label: string; href: string };

export function SortSelect({ options, value }: { options: Option[]; value: string }) {
  const router = useRouter();
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <label className="relative flex items-center gap-1 rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] px-2.5 py-1 text-[13px] shadow-[0_2px_5px_rgba(15,17,17,.15)] hover:bg-[#e3e6e6]">
      <span className="text-muted">Sort by:</span>
      <span className="text-ink">{current.label}</span>
      <CaretDownIcon className="ml-0.5 size-2 text-muted" />
      <select
        aria-label="Sort results"
        value={current.value}
        onChange={(e) => {
          const next = options.find((o) => o.value === e.target.value);
          if (next) router.push(next.href);
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
