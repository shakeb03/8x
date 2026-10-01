import Form from "next/form";
import Link from "next/link";
import { Stars } from "@/components/product/Rating";
import { ChevronIcon } from "@/components/icons";
import { searchHref, type SearchResult } from "@/lib/search";

const PRICE_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: "Under $25", min: null, max: 25 },
  { label: "$25 to $50", min: 25, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $500", min: 100, max: 500 },
  { label: "$500 & above", min: 500, max: null },
];

const BRAND_PREVIEW = 8;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#e7e7e7] py-3 first:pt-0 last:border-0">
      <h3 className="mb-1.5 text-sm font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

const linkCls = "text-sm leading-6 text-ink hover:text-link-hover";

function CheckLink({ href, checked, children }: { href: string; checked: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${linkCls}`} role="checkbox" aria-checked={checked}>
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-[3px] border ${
          checked ? "border-link bg-link text-white" : "border-[#888c8c] bg-white"
        }`}
        aria-hidden
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m2.5 6 2.5 2.5 4.5-5" />
          </svg>
        )}
      </span>
      {children}
    </Link>
  );
}

export function FilterSidebar({ result }: { result: SearchResult }) {
  const { query: q, facets, department } = result;

  return (
    <div className="text-ink">
      <Section title="Department">
        {department ? (
          <ul>
            <li>
              <Link href={searchHref(q, { i: "", c: "" })} className={`flex items-center gap-0.5 ${linkCls}`}>
                <ChevronIcon direction="left" className="size-3" /> Any Department
              </Link>
            </li>
            <li>
              <Link
                href={searchHref(q, { i: department.slug, c: "" })}
                className={`${linkCls} pl-3 ${q.c ? "" : "font-bold"}`}
              >
                {department.name}
              </Link>
            </li>
            {facets.categories.map((f) => (
              <li key={f.value}>
                <Link
                  href={searchHref(q, { i: department.slug, c: f.value })}
                  className={`${linkCls} block pl-6 ${q.c === f.value ? "font-bold" : ""}`}
                >
                  {f.label} <span className="text-muted">({f.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul>
            {facets.departments.map((f) => (
              <li key={f.value}>
                <Link href={searchHref(q, { i: f.value, c: "" })} className={linkCls}>
                  {f.label} <span className="text-muted">({f.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Customer Reviews">
        <ul>
          {[4, 3, 2, 1].map((stars) => {
            const active = q.rating === stars;
            return (
              <li key={stars}>
                <Link
                  href={searchHref(q, { rating: active ? null : stars })}
                  aria-current={active || undefined}
                  className={`flex items-center gap-1.5 ${linkCls} ${active ? "font-bold" : ""}`}
                >
                  <Stars value={stars} />
                  <span>&amp; Up</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {q.rating !== null && (
          <Link href={searchHref(q, { rating: null })} className="text-xs text-link hover:underline">
            Clear
          </Link>
        )}
      </Section>

      <Section title="Price">
        <ul>
          {PRICE_RANGES.map((r) => {
            const active = q.min === r.min && q.max === r.max;
            return (
              <li key={r.label}>
                <Link
                  href={searchHref(q, active ? { min: null, max: null } : { min: r.min, max: r.max })}
                  aria-current={active || undefined}
                  className={`${linkCls} ${active ? "font-bold" : ""}`}
                >
                  {r.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <PriceForm result={result} />
      </Section>

      <Section title="Deals & Discounts">
        <CheckLink href={searchHref(q, { deals: !q.deals })} checked={q.deals}>
          Today&apos;s Deals
        </CheckLink>
      </Section>

      {facets.brands.length > 0 && (
        <Section title="Brands">
          <BrandList result={result} />
        </Section>
      )}
    </div>
  );
}

function BrandList({ result }: { result: SearchResult }) {
  const { query: q, facets } = result;
  // Selected brands always show, even if they'd otherwise be in "See more".
  const preview = facets.brands.filter(
    (b, i) => i < BRAND_PREVIEW || q.brands.includes(b.value),
  );
  const rest = facets.brands.filter((b) => !preview.includes(b));

  const item = (b: (typeof facets.brands)[number]) => {
    const checked = q.brands.includes(b.value);
    const brands = checked ? q.brands.filter((x) => x !== b.value) : [...q.brands, b.value];
    return (
      <li key={b.value}>
        <CheckLink href={searchHref(q, { brands })} checked={checked}>
          {b.label}
        </CheckLink>
      </li>
    );
  };

  return (
    <>
      <ul>{preview.map(item)}</ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm text-link hover:text-link-hover hover:underline group-open:hidden">
            See more
          </summary>
          <ul>{rest.map(item)}</ul>
        </details>
      )}
    </>
  );
}

/** Custom min/max. Hidden inputs carry the rest of the current query. */
function PriceForm({ result }: { result: SearchResult }) {
  const { query: q } = result;
  const keep: [string, string][] = [];
  if (q.k) keep.push(["k", q.k]);
  if (q.i) keep.push(["i", q.i]);
  if (q.c) keep.push(["c", q.c]);
  q.brands.forEach((b) => keep.push(["brand", b]));
  if (q.rating !== null) keep.push(["rating", String(q.rating)]);
  if (q.deals) keep.push(["deals", "1"]);
  if (q.sort !== "featured") keep.push(["sort", q.sort]);

  const input =
    "w-full rounded-md border border-[#888c8c] px-2 py-1 text-sm shadow-[inset_0_1px_2px_rgba(15,17,17,.15)] outline-none focus:border-link focus:ring-2 focus:ring-[#c8f3fa]";

  return (
    <Form action="/s" className="mt-2 flex items-center gap-1.5">
      {keep.map(([name, value], idx) => (
        <input key={`${name}-${idx}`} type="hidden" name={name} value={value} />
      ))}
      <label className="sr-only" htmlFor="price-min">Minimum price</label>
      <input id="price-min" name="min" type="number" min={0} inputMode="decimal" placeholder="$ Min" defaultValue={q.min ?? ""} className={input} />
      <label className="sr-only" htmlFor="price-max">Maximum price</label>
      <input id="price-max" name="max" type="number" min={0} inputMode="decimal" placeholder="$ Max" defaultValue={q.max ?? ""} className={input} />
      <button
        type="submit"
        className="shrink-0 rounded-md border border-[#d5d9d9] bg-white px-2.5 py-1 text-sm shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa]"
      >
        Go
      </button>
    </Form>
  );
}
