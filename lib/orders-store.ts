"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "./types";

type OrdersState = {
  /** Newest first */
  orders: Order[];
  addOrder: (order: Order) => void;
};

/** Bump when the saved shape changes, and handle the old shape in `migrate`. */
const ORDERS_VERSION = 1;

/** Enough of the Order shape for the order pages to render safely. */
function isOrder(v: unknown): v is Order {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.placedAt === "string" &&
    typeof o.estimatedDelivery === "string" &&
    Array.isArray(o.lines) &&
    typeof o.address === "object" &&
    o.address !== null &&
    typeof o.delivery === "object" &&
    o.delivery !== null &&
    typeof o.payment === "object" &&
    o.payment !== null &&
    ["itemCount", "subtotal", "shipping", "tax", "total"].every((k) => typeof o[k] === "number")
  );
}

/** Completed orders, persisted in this browser only (no accounts). */
export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
    }),
    {
      name: "orders",
      version: ORDERS_VERSION,
      // v0 → v1: same shape; versioning starts here.
      migrate: (persisted) => persisted as OrdersState,
      // Drop malformed entries rather than crashing the order pages.
      merge: (persisted, current) => {
        const orders = (persisted as { orders?: unknown } | null)?.orders;
        return { ...current, orders: Array.isArray(orders) ? orders.filter(isOrder) : current.orders };
      },
    },
  ),
);

/** A single persisted order by id (undefined until hydrated or if missing). */
export function useOrder(id: string): Order | undefined {
  return useOrdersStore((s) => s.orders.find((o) => o.id === id));
}
