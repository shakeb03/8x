import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilters, activeFilterChips } from "@/components/search/ActiveFilters";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { MobileFilters } from "@/components/search/MobileFilters";
import { Pagination } from "@/components/search/Pagination";
import { ResultCard } from "@/components/search/ResultCard";
import { SortSelect } from "@/components/search/SortSelect";
import { formatCount } from "@/lib/format";
import {
  PAGE_SIZE,
  SORTS,
  parseSearchParams,
  search,
  searchHref,
  type SearchResult,
  type SortKey,
} from "@/lib/search";
import { DEPARTMENTS } from "@/lib/site";

function scopeName(result: SearchResult): string | undefined {
  return result.categoryName ?? result.department?.name;
}

export async function generateMetadata(props: PageProps<"/s">): Promise<Metadata> {
  const query = parseSearchParams(await props.searchParams);
  const result = search(query);
  const scope = scopeName(result);
  if (query.k) return { title: `Results for “${query.k}”${scope ? ` in ${scope}` : ""}` };
  if (query.deals) return { title: "Today's Deals" };
  return { title: scope ?? "All products" };
}

export default async function SearchPage(props: PageProps<"/s">) {
  const query = parseSearchParams(await props.searchParams);
  const result = search(query);
  const { products, total, pageCount } = result;
  const q = result.query;
  const scope = scopeName(result);

  const start = total === 0 ? 0 : (q.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(q.page * PAGE_SIZE, total);

  const sortOptions = (Object.keys(SORTS) as SortKey[]).map((value) => ({
    value,
    label: SORTS[value],
    href: searchHref(q, { sort: value }),
  }));

  const heading = q.k ? (
    <>
      Results for <span className="text-link-hover">&ldquo;{q.k}&rdquo;</span>
    </>
  ) : q.deals ? (
    "Today's Deals"
  ) : (
    (scope ?? "All products")
  );

  return (
    <div>
      {/* Results summary bar */}
      <div className="border-b border-[#ddd] bg-white shadow-[0_2px_4px_rgba(0,0,0,.06)]">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 md:px-5">
          <p className="text-sm text-ink">
            {total > 0 ? (
              <>
                {start}-{end} of {formatCount(total)} {total === 1 ? "result" : "results"}
              </>
            ) : (
              "0 results"
            )}
            {q.k && (
              <>
                {" "}for <span className="font-bold text-link-hover">&ldquo;{q.k}&rdquo;</span>
              </>
            )}
            {scope && (
              <>
                {" "}in <span className="font-bold">{scope}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilters activeCount={activeFilterChips(q).length}>
              <FilterSidebar result={result} />
            </MobileFilters>
            <SortSelect options={sortOptions} value={q.sort} />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-3 pt-4 md:px-5">
        <aside aria-label="Filters" className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-4 rounded-lg bg-white p-4">
            <FilterSidebar result={result} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-col gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">{heading}</h1>
            <ActiveFilters query={q} />
          </div>

          {products.length > 0 ? (
            <>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p, i) => (
                  <li key={p.slug} className="grid">
                    <ResultCard product={p} preload={i < 4} />
                  </li>
                ))}
              </ul>
              <Pagination query={q} pageCount={pageCount} />
            </>
          ) : (
            <NoResults result={result} />
          )}
        </div>
      </div>
    </div>
  );
}

function NoResults({ result }: { result: SearchResult }) {
  const q = result.query;
  const hasFilters = activeFilterChips(q).length > 0 || q.i || q.c;

  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="text-lg font-bold text-ink">
        No results{q.k ? <> for &ldquo;{q.k}&rdquo;</> : null}.
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
        <li>Check the spelling or try more general terms.</li>
        {hasFilters && (
          <li>
            <Link href={searchHref(q, { i: "", c: "", brands: [], min: null, max: null, rating: null, deals: false })} className="text-link hover:underline">
              Search all departments without filters
            </Link>
          </li>
        )}
      </ul>
      <h3 className="mt-6 mb-2 text-sm font-bold">Browse a department</h3>
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map((d) => (
          <Link
            key={d.slug}
            href={`/s?i=${d.slug}`}
            className="rounded-full border border-[#d5d9d9] px-3 py-1 text-sm hover:bg-[#f7fafa]"
          >
            {d.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
