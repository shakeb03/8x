"use client";

import Link from "next/link";
import { CartIcon } from "@/components/icons";
import { selectCartCount, useCartStore, useHydrated } from "@/lib/cart-store";

export function CartButton() {
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const shown = hydrated ? count : 0;

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${shown} ${shown === 1 ? "item" : "items"}`}
      className="flex shrink-0 items-end rounded-sm border border-transparent px-2 pt-1 pb-2 hover:border-white"
    >
      <span className="relative">
        <CartIcon className="h-8 w-10" />
        <span className="absolute -top-1.5 left-[17px] w-6 text-center text-base font-bold text-badge">
          {shown > 99 ? "99+" : shown}
        </span>
      </span>
      <span className="hidden text-sm font-bold md:inline">Cart</span>
    </Link>
  );
}
