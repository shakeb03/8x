import type { AgentIntent, AgentProduct } from "@/lib/agent/types";

const money = (n: number) => (Number.isInteger(n) ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`);

/**
 * Short reasons this product fits the current search, written from what the
 * shopper asked for and how it compares with the other results shown.
 */
export function whyThisPick(product: AgentProduct, intent: AgentIntent | null, results: AgentProduct[]): string[] {
  const reasons: string[] = [];
  const n = results.length;

  if (intent) {
    if (intent.maxPrice !== null && product.price <= intent.maxPrice) reasons.push(`Within your ${money(intent.maxPrice)} budget`);
    if (intent.brands.length && product.brand && intent.brands.includes(product.brand)) reasons.push(`From ${product.brand}, as you asked`);
    if (intent.excludeBrands.length) reasons.push(`Not ${intent.excludeBrands.join(" or ")}`);
    if (intent.minRating !== null) reasons.push(`Rated ${product.rating.toFixed(1)}★, above your ${intent.minRating}★ bar`);
  }

  if (n > 1) {
    const cheapest = Math.min(...results.map((r) => r.price));
    const topRated = Math.max(...results.map((r) => r.rating));
    if (product.price === cheapest) reasons.push(`Lowest price of your ${n} results`);
    if (product.rating === topRated) reasons.push(`Highest rated of your ${n} results`);
    if (results[0]?.slug === product.slug && intent?.topic && intent.sort === "relevance") {
      reasons.push(`Closest match for “${intent.topic}”`);
    }
  }

  const deal = product.highlights.find((h) => h.endsWith("% off"));
  if (deal) reasons.push(`On sale: ${deal}`);
  const arrival = product.highlights.find((h) => h.startsWith("Fast delivery"));
  if (arrival) reasons.push(arrival);

  return [...new Set(reasons)].slice(0, 4);
}
