// Turns stored cart items into priced lines. Shared by the cart and checkout.

import type { CartItem } from "./cart-store";
import { isAvailable, maxQuantity } from "./stock";
import type { CartProduct } from "./types";

export { maxQuantity };

export type CartLine = { product: CartProduct; quantity: number };

export const isUnavailable = (p: CartProduct) => !isAvailable(p);

/**
 * Items whose product no longer exists in the catalog are dropped, and
 * quantities of buyable items are capped at current stock. Unavailable items
 * keep their stored quantity; they're excluded from totals instead.
 */
export function buildCartLines(items: CartItem[], catalog: Record<string, CartProduct>): CartLine[] {
  return items.flatMap((i) => {
    const product = catalog[i.slug];
    if (!product) return [];
    const quantity = isAvailable(product) ? Math.min(i.quantity, maxQuantity(product)) : i.quantity;
    return [{ product, quantity }];
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
