"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CaretDownIcon } from "@/components/icons";
import { useCartStore } from "@/lib/cart-store";

const MAX_QUANTITY = 10;

export function BuyActions({ slug, stock }: { slug: string; stock: number }) {
  const add = useCartStore((s) => s.add);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState<number | null>(null);
  const max = Math.max(1, Math.min(MAX_QUANTITY, stock));

  const button =
    "w-full rounded-full py-2 text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link";

  return (
    <div className="flex flex-col gap-3">
      <label className="relative flex w-fit items-center gap-1 rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] px-3 py-1.5 text-[13px] shadow-[0_2px_5px_rgba(15,17,17,.15)] hover:bg-[#e3e6e6]">
        <span>Quantity:</span>
        <span className="font-medium">{quantity}</span>
        <CaretDownIcon className="ml-1 size-2 text-muted" />
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          aria-label="Quantity"
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => {
          add(slug, quantity);
          setAdded(quantity);
        }}
        className={`${button} bg-cta hover:bg-cta-hover active:bg-[#f0b800]`}
      >
        Add to Cart
      </button>
      <button
        type="button"
        onClick={() => {
          add(slug, quantity);
          router.push("/checkout");
        }}
        className={`${button} bg-buy hover:bg-buy-hover`}
      >
        Buy Now
      </button>

      <p aria-live="polite" className="min-h-0 text-sm">
        {added !== null && (
          <span className="flex flex-wrap items-center gap-x-2 rounded-md border border-[#d5d9d9] bg-[#f7fdf9] px-3 py-2">
            <span className="font-bold text-success">
              ✓ Added {added > 1 ? `${added} items ` : ""}to Cart
            </span>
            <Link href="/cart" className="text-link hover:text-link-hover hover:underline">
              Go to Cart
            </Link>
          </span>
        )}
      </p>
    </div>
  );
}
