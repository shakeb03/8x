"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

type Props = { slug: string; quantity?: number; className?: string };

export function AddToCartButton({ slug, quantity = 1, className = "" }: Props) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      onClick={() => {
        add(slug, quantity);
        setAdded(true);
      }}
      aria-live="polite"
      className={`rounded-full px-4 py-1.5 text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)] transition-colors ${
        added
          ? "bg-success text-white"
          : "bg-cta text-ink hover:bg-cta-hover active:bg-[#f0b800]"
      } ${className}`}
    >
      {added ? "✓ Added to cart" : "Add to cart"}
    </button>
  );
}
