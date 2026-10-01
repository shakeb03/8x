"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = { slug: string; quantity: number };

import { MAX_QUANTITY } from "./stock";

export { MAX_QUANTITY };

const clamp = (n: number) => Math.min(MAX_QUANTITY, n);

/** Bump when the saved shape changes, and handle the old shape in `migrate`. */
const CART_VERSION = 1;

const isCartItem = (v: unknown): v is CartItem =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as CartItem).slug === "string" &&
  Number.isInteger((v as CartItem).quantity) &&
  (v as CartItem).quantity > 0;

type CartState = {
  items: CartItem[];
  add: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (slug, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.slug === slug);
          if (!existing) return { items: [...s.items, { slug, quantity: clamp(quantity) }] };
          return {
            items: s.items.map((i) =>
              i.slug === slug ? { ...i, quantity: clamp(i.quantity + quantity) } : i,
            ),
          };
        }),
      setQuantity: (slug, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.slug !== slug)
              : s.items.map((i) => (i.slug === slug ? { ...i, quantity: clamp(quantity) } : i)),
        })),
      remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cart",
      version: CART_VERSION,
      // v0 → v1: same shape; versioning starts here.
      migrate: (persisted) => persisted as CartState,
      // Keep only well-formed items, so bad saved data can't break the cart.
      merge: (persisted, current) => {
        const items = (persisted as { items?: unknown } | null)?.items;
        return {
          ...current,
          items: Array.isArray(items)
            ? items.filter(isCartItem).map((i) => ({ slug: i.slug, quantity: clamp(i.quantity) }))
            : current.items,
        };
      },
    },
  ),
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

const noopSubscribe = () => () => {};

/**
 * False during SSR and hydration, true afterwards. Use it to gate anything
 * read from the persisted cart so server and client markup match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
