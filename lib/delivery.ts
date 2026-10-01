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

export function shippingDays(product: Pick<Product, "shippingInformation">): number {
  return BUSINESS_DAYS[product.shippingInformation] ?? 5;
}

export function addBusinessDays(from: Date, days: number): Date {
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
const longDateFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });

export function formatDeliveryDate(date: Date, style: "short" | "long" = "short"): string {
  return (style === "long" ? longDateFmt : dateFmt).format(date);
}

export function deliveryDate(product: Pick<Product, "shippingInformation">, from = new Date()): string {
  return formatDeliveryDate(addBusinessDays(from, shippingDays(product)));
}

/** True when the item ships fast enough to show a fast-delivery note. */
export function isFastShipping(product: Product): boolean {
  return shippingDays(product) <= 2;
}

export function shippingCost(product: Pick<Product, "price">): number {
  return product.price >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}
