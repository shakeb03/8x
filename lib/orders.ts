// Display helpers for persisted orders.

import type { Order } from "./types";

const placedFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const arrivalFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });

export function formatPlacedDate(order: Order): string {
  return placedFmt.format(new Date(order.placedAt));
}

/** Orders count as delivered once their estimated date has passed. */
export function orderStatus(order: Order, now = new Date()) {
  const arrives = new Date(order.estimatedDelivery);
  const delivered = now >= arrives;
  return {
    delivered,
    label: `${delivered ? "Delivered" : "Arriving"} ${arrivalFmt.format(arrives)}`,
  };
}
