// Turns stored cart items into priced lines. Shared by the cart and checkout.

import type { CartItem } from "./cart-store";
import type { CartProduct } from "./types";

export const MAX_QUANTITY = 10;

export type CartLine = { product: CartProduct; quantity: number };

export const isUnavailable = (p: CartProduct) =>
  p.stock === 0 || p.availabilityStatus === "Out of Stock";

export const maxQuantity = (p: CartProduct) => Math.max(1, Math.min(MAX_QUANTITY, p.stock));

/**
 * Items whose product no longer exists in the catalog are dropped, and
 * quantities are capped at current stock.
 */
export function buildCartLines(items: CartItem[], catalog: Record<string, CartProduct>): CartLine[] {
  return items.flatMap((i) => {
    const product = catalog[i.slug];
    return product ? [{ product, quantity: Math.min(i.quantity, maxQuantity(product)) }] : [];
  });
}

/** Totals over the lines that can actually be bought. */
export function summarizeLines(lines: CartLine[]) {
  const purchasable = lines.filter((l) => !isUnavailable(l.product));
  return {
    purchasable,
    count: purchasable.reduce((n, l) => n + l.quantity, 0),
    subtotal: Math.round(purchasable.reduce((sum, l) => sum + l.product.price * l.quantity, 0) * 100) / 100,
  };
}
