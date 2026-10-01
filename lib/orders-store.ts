"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "./types";

type OrdersState = {
  /** Newest first */
  orders: Order[];
  addOrder: (order: Order) => void;
};

/** Completed orders, persisted in this browser only (no accounts). */
export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
    }),
    { name: "orders" },
  ),
);

/** A single persisted order by id (undefined until hydrated or if missing). */
export function useOrder(id: string): Order | undefined {
  return useOrdersStore((s) => s.orders.find((o) => o.id === id));
}
