// Search + filtering over the local catalog, driven entirely by URL params so
// every result page is linkable and works without client JS.

import { getCategories, getPopularity, getProducts } from "./catalog";
import { DEPARTMENTS, UNFEATURED_CATEGORIES, type Department } from "./site";
import type { Product } from "./types";

export const PAGE_SIZE = 24;

export const SORTS = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Avg. Customer Review",
  discount: "Biggest Discount",
} as const;

export type SortKey = keyof typeof SORTS;

export type SearchQuery = {
  k: string;
  /** Department slug */
  i: string;
  /** Category slug */
  c: string;
  brands: string[];
  min: number | null;
  max: number | null;
  rating: number | null;
  deals: boolean;
  sort: SortKey;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const num = (v: string) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

export function parseSearchParams(params: RawParams): SearchQuery {
  const sort = first(params.sort);
  const rating = num(first(params.rating));
  return {
    k: first(params.k).trim().slice(0, 100),
    i: first(params.i),
    c: first(params.c),
    brands: all(params.brand),
    min: num(first(params.min)),
    max: num(first(params.max)),
    rating: rating !== null && rating >= 1 && rating <= 4 ? Math.floor(rating) : null,
    deals: first(params.deals) === "1",
    sort: sort in SORTS ? (sort as SortKey) : "featured",
    page: Math.max(1, Math.floor(num(first(params.page)) ?? 1)),
  };
}

/** Serializes a query back to a /s URL, dropping defaults. */
export function searchHref(q: SearchQuery, patch: Partial<SearchQuery> = {}): string {
  const next = { ...q, page: 1, ...patch };
  const sp = new URLSearchParams();
  if (next.k) sp.set("k", next.k);
  if (next.i) sp.set("i", next.i);
  if (next.c) sp.set("c", next.c);
  for (const b of next.brands) sp.append("brand", b);
  if (next.min !== null) sp.set("min", String(next.min));
  if (next.max !== null) sp.set("max", String(next.max));
  if (next.rating !== null) sp.set("rating", String(next.rating));
  if (next.deals) sp.set("deals", "1");
  if (next.sort !== "featured") sp.set("sort", next.sort);
  if (next.page > 1) sp.set("page", String(next.page));
  const qs = sp.toString();
  return qs ? `/s?${qs}` : "/s";
}

// --- Text matching -----------------------------------------------------------

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, " ");

/** Very light plural stemming: phones→phone, dresses→dress, accessories→accessory. */
function stem(w: string): string {
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/(ss|ch|sh|x)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

const tokenize = (s: string) =>
  normalize(s)
    .split(/[\s-]+/)
    .filter((w) => w.length > 1)
    .map(stem);

const categoryNames = new Map(getCategories().map((c) => [c.slug, c.name]));

type Indexed = { product: Product; fields: { tokens: Set<string>; weight: number }[] };

const index: Indexed[] = getProducts().map((product) => ({
  product,
  fields: [
    { tokens: new Set(tokenize(product.title)), weight: 4 },
    { tokens: new Set(tokenize(product.brand ?? "")), weight: 3 },
    {
      tokens: new Set(
        tokenize(`${categoryNames.get(product.category) ?? ""} ${product.tags.join(" ")}`),
      ),
      weight: 2,
    },
    { tokens: new Set(tokenize(product.description)), weight: 1 },
  ],
}));

/**
 * Every query word must match some field (AND). Exact word matches score
 * highest; partial matches (prefix for 3+ chars: "mac" → "macbook", substring
 * for 4+ chars: "phone" → "smartphone") count for less, and are skipped for
 * descriptions where they mostly add noise.
 */
function score(entry: Indexed, terms: string[]): number {
  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const { tokens, weight } of entry.fields) {
      if (tokens.has(term)) {
        best = Math.max(best, weight * 2);
        continue;
      }
      if (weight < 2 || term.length < 3) continue;
      for (const t of tokens) {
        if (t.startsWith(term)) best = Math.max(best, weight * 0.75);
        else if (term.length >= 4 && t.includes(term)) best = Math.max(best, weight * 0.5);
      }
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

// --- Search ------------------------------------------------------------------

export type Facet = { value: string; label: string; count: number };

export type SearchResult = {
  query: SearchQuery;
  products: Product[];
  total: number;
  pageCount: number;
  department: Department | undefined;
  categoryName: string | undefined;
  facets: {
    departments: Facet[];
    categories: Facet[];
    brands: Facet[];
  };
};

function countBy(products: Product[], key: (p: Product) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of products) {
    const k = key(p);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

const departmentOf = (category: string) =>
  DEPARTMENTS.find((d) => d.categories.includes(category));

export function search(query: SearchQuery): SearchResult {
  const terms = tokenize(query.k);

  // 1. Text match. An empty query browses everything except unfeatured
  //    categories (cars etc.), which only show up when searched for.
  let matched = index
    .map((e) => ({
      product: e.product,
      score: terms.length ? score(e, terms) : UNFEATURED_CATEGORIES.has(e.product.category) ? 0 : 1,
    }))
    .filter((r) => r.score > 0);

  // Facet counts for department/category ignore those filters themselves,
  // so shoppers can see what else their query matches.
  const textMatches = matched.map((r) => r.product);

  // 2. Scope.
  const department = DEPARTMENTS.find((d) => d.slug === query.i) ?? departmentOf(query.c);
  if (query.c) matched = matched.filter((r) => r.product.category === query.c);
  else if (department) matched = matched.filter((r) => department.categories.includes(r.product.category));

  // 3. Attribute filters (brand facet counts are taken before brand filtering).
  matched = matched.filter(({ product: p }) => {
    if (query.min !== null && p.price < query.min) return false;
    if (query.max !== null && p.price > query.max) return false;
    if (query.rating !== null && p.rating < query.rating) return false;
    if (query.deals && p.discountPercentage < 10) return false;
    return true;
  });
  const brandCounts = countBy(matched.map((r) => r.product), (p) => p.brand);
  if (query.brands.length) {
    matched = matched.filter((r) => r.product.brand && query.brands.includes(r.product.brand));
  }

  // 4. Sort.
  const sorters: Record<SortKey, (a: (typeof matched)[number], b: (typeof matched)[number]) => number> = {
    featured: (a, b) => b.score - a.score || getPopularity(b.product) - getPopularity(a.product),
    "price-asc": (a, b) => a.product.price - b.product.price,
    "price-desc": (a, b) => b.product.price - a.product.price,
    rating: (a, b) => b.product.rating - a.product.rating,
    discount: (a, b) => b.product.discountPercentage - a.product.discountPercentage,
  };
  matched.sort(sorters[query.sort]);

  // 5. Paginate.
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const products = matched
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((r) => r.product);

  // Facets.
  const deptCounts = countBy(textMatches, (p) => departmentOf(p.category)?.slug ?? null);
  const catCounts = countBy(textMatches, (p) => p.category);

  return {
    query: { ...query, page },
    products,
    total,
    pageCount,
    department,
    categoryName: query.c ? categoryNames.get(query.c) : undefined,
    facets: {
      departments: DEPARTMENTS.filter((d) => deptCounts.has(d.slug)).map((d) => ({
        value: d.slug,
        label: d.name,
        count: deptCounts.get(d.slug)!,
      })),
      categories: (department?.categories ?? [])
        .filter((c) => catCounts.has(c))
        .map((c) => ({ value: c, label: categoryNames.get(c) ?? c, count: catCounts.get(c)! })),
      brands: [...brandCounts]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: value, count })),
    },
  };
}
