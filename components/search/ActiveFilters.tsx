import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { searchHref, type SearchQuery } from "@/lib/search";

type Chip = { label: string; href: string };

export function activeFilterChips(q: SearchQuery): Chip[] {
  const chips: Chip[] = [];
  for (const b of q.brands) {
    chips.push({ label: b, href: searchHref(q, { brands: q.brands.filter((x) => x !== b) }) });
  }
  if (q.min !== null || q.max !== null) {
    const label =
      q.min !== null && q.max !== null
        ? `${formatPrice(q.min)} – ${formatPrice(q.max)}`
        : q.min !== null
          ? `${formatPrice(q.min)} & above`
          : `Under ${formatPrice(q.max!)}`;
    chips.push({ label, href: searchHref(q, { min: null, max: null }) });
  }
  if (q.rating !== null) chips.push({ label: `${q.rating}★ & up`, href: searchHref(q, { rating: null }) });
  if (q.deals) chips.push({ label: "Today's Deals", href: searchHref(q, { deals: false }) });
  return chips;
}

export function ActiveFilters({ query }: { query: SearchQuery }) {
  const chips = activeFilterChips(query);
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          aria-label={`Remove filter ${c.label}`}
          className="flex items-center gap-1.5 rounded-full border border-[#d5d9d9] bg-white px-3 py-1 text-[13px] hover:bg-[#f7fafa]"
        >
          {c.label}
          <span aria-hidden className="text-muted">✕</span>
        </Link>
      ))}
      <Link
        href={searchHref(query, { brands: [], min: null, max: null, rating: null, deals: false })}
        className="text-[13px] text-link hover:text-link-hover hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
