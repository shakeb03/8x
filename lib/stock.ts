// The single source of truth for whether a product can be bought, and how
// many at once. Used by the storefront, cart, checkout, and Agentic Search.

import type { Product } from "./types";

/** Per-item limit, like Amazon's quantity dropdown. Stock may lower it further. */
export const MAX_QUANTITY = 10;

type StockInfo = Pick<Product, "stock" | "availabilityStatus">;

export function isAvailable(p: StockInfo): boolean {
  return p.stock > 0 && p.availabilityStatus !== "Out of Stock";
}

/** How many can go in the cart at once; 0 when the product can't be bought. */
export function maxQuantity(p: StockInfo): number {
  return isAvailable(p) ? Math.min(MAX_QUANTITY, p.stock) : 0;
}
