import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { searchHref, type SearchQuery } from "@/lib/search";

/** Page numbers to show: first, last, current ±1, with gaps as null. */
function pageList(current: number, count: number): (number | null)[] {
  const pages = new Set([1, count, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export function Pagination({ query, pageCount }: { query: SearchQuery; pageCount: number }) {
  if (pageCount <= 1) return null;
  const { page } = query;
  const cell = "flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm";

  return (
    <nav aria-label="Pagination" className="mt-6 flex justify-center">
      <ul className="flex items-center gap-1 rounded-lg border border-[#d5d9d9] bg-white p-1">
        <li>
          {page > 1 ? (
            <Link href={searchHref(query, { page: page - 1 })} className={`${cell} gap-1 hover:bg-[#f7fafa]`}>
              <ChevronIcon direction="left" className="size-4" /> Previous
            </Link>
          ) : (
            <span className={`${cell} gap-1 text-[#a2a6ac]`}>
              <ChevronIcon direction="left" className="size-4" /> Previous
            </span>
          )}
        </li>
        {pageList(page, pageCount).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className={`${cell} text-muted`}>…</li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span aria-current="page" className={`${cell} border border-ink font-bold`}>{p}</span>
              ) : (
                <Link href={searchHref(query, { page: p })} className={`${cell} hover:bg-[#f7fafa]`}>{p}</Link>
              )}
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link href={searchHref(query, { page: page + 1 })} className={`${cell} gap-1 hover:bg-[#f7fafa]`}>
              Next <ChevronIcon className="size-4" />
            </Link>
          ) : (
            <span className={`${cell} gap-1 text-[#a2a6ac]`}>
              Next <ChevronIcon className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
