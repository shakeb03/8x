import type { Product } from "./types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const int = new Intl.NumberFormat("en-US");

export function formatPrice(value: number): string {
  return usd.format(value);
}

/** Splits a price into parts for the Amazon-style superscript display. */
export function priceParts(value: number) {
  const [whole, fraction] = value.toFixed(2).split(".");
  return { whole: int.format(Number(whole)), fraction };
}

/** The pre-discount price, derived from DummyJSON's discountPercentage. */
export function listPrice(product: Product): number {
  return Math.round((product.price / (1 - product.discountPercentage / 100)) * 100) / 100;
}

/** Whole-number discount, or 0 when it's too small to advertise. */
export function savingsPercent(product: Product): number {
  const pct = Math.round(product.discountPercentage);
  return pct >= 5 ? pct : 0;
}

export function formatCount(value: number): string {
  return int.format(value);
}
