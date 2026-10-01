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
