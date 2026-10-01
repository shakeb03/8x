// Delivery promises derived from DummyJSON's shippingInformation strings.

import type { Product } from "./types";

export const FREE_SHIPPING_THRESHOLD = 35;
export const STANDARD_SHIPPING = 5.99;

const BUSINESS_DAYS: Record<string, number> = {
  "Ships overnight": 1,
  "Ships in 1-2 business days": 2,
  "Ships in 3-5 business days": 5,
  "Ships in 1 week": 7,
  "Ships in 2 weeks": 12,
  "Ships in 1 month": 22,
};

function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d;
}

const dateFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

export function deliveryDate(product: Product, from = new Date()): string {
  const days = BUSINESS_DAYS[product.shippingInformation] ?? 5;
  return dateFmt.format(addBusinessDays(from, days));
}

/** True when the item ships fast enough to show a "Prime"-style badge. */
export function isFastShipping(product: Product): boolean {
  return (BUSINESS_DAYS[product.shippingInformation] ?? 99) <= 2;
}

export function shippingCost(product: Product): number {
  return product.price >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}
