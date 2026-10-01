import { formatCount } from "@/lib/format";

const STAR_PATH =
  "M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z";

function StarRow({ filled }: { filled: boolean }) {
  return (
    <span className="flex gap-px">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden>
          <path
            d={STAR_PATH}
            fill={filled ? "var(--color-star)" : "none"}
            stroke="var(--color-star)"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  // Round to the nearest half star, like Amazon's display.
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-ink">{value.toFixed(1)}</span>
      <span className="relative" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        <StarRow filled={false} />
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(rounded / 5) * 100}%` }}>
          <StarRow filled />
        </span>
      </span>
      {count !== undefined && <span className="text-link">({formatCount(count)})</span>}
    </div>
  );
}
