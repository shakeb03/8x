"use client";

import Image from "next/image";
import Link from "next/link";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { buildCartLines, isUnavailable, maxQuantity, summarizeLines } from "@/lib/cart-lines";
import { useCartStore, useHydrated } from "@/lib/cart-store";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/delivery";
import { formatPrice, savingsPercent } from "@/lib/format";
import type { CartProduct } from "@/lib/types";
import { Price } from "@/components/product/Price";

export function CartView({ catalog }: { catalog: Record<string, CartProduct> }) {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);

  if (!hydrated) return <CartSkeleton />;

  const lines = buildCartLines(items, catalog);
  if (lines.length === 0) return <EmptyCart />;

  const { count, subtotal } = summarizeLines(lines);
  const subtotalLabel = (
    <>
      Subtotal ({count} {count === 1 ? "item" : "items"}):{" "}
      <span className="font-bold">{formatPrice(subtotal)}</span>
    </>
  );

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* Summary first on phones so checkout is reachable without scrolling. */}
      <aside aria-label="Order summary" className="order-first rounded-lg bg-white p-5 lg:order-last lg:w-[300px] lg:shrink-0">
        <FreeShippingProgress subtotal={subtotal} />
        <p className="mt-3 text-lg text-ink">{subtotalLabel}</p>
        {count > 0 ? (
          <Link
            href="/checkout"
            className="mt-4 block rounded-full bg-cta py-2 text-center text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-cta-hover"
          >
            Proceed to checkout
          </Link>
        ) : (
          <p className="mt-4 rounded-md bg-[#f0f2f2] p-2 text-center text-sm text-muted">
            Remove unavailable items to check out
          </p>
        )}
      </aside>

      <section aria-labelledby="cart-heading" className="min-w-0 flex-1 rounded-lg bg-white p-5">
        <div className="flex items-end justify-between border-b border-[#ddd] pb-2">
          <h1 id="cart-heading" className="font-display text-[28px] font-extrabold tracking-tight text-ink">
            Shopping Cart
          </h1>
          <span className="hidden text-sm text-muted sm:block">Price</span>
        </div>

        <ul>
          {lines.map(({ product: p, quantity }) => {
            const unavailable = isUnavailable(p);
            const max = maxQuantity(p);
            const savings = savingsPercent(p);
            return (
              <li key={p.slug} className="flex gap-4 border-b border-[#ddd] py-4 last:border-0">
                <Link
                  href={`/dp/${p.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-md bg-[#f7f8f8] sm:size-36"
                >
                  <Image src={p.thumbnail} alt={p.title} fill sizes="144px" className="object-contain p-2" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dp/${p.slug}`}
                      className="line-clamp-2 text-base leading-snug text-ink hover:text-link-hover sm:text-lg"
                    >
                      {p.title}
                    </Link>
                    {p.brand && <p className="text-xs text-muted">by {p.brand}</p>}

                    {unavailable ? (
                      <p className="mt-1 text-sm text-deal">Currently unavailable</p>
                    ) : p.stock < 10 ? (
                      <p className="mt-1 text-sm text-deal">Only {p.stock} left in stock - order soon.</p>
                    ) : (
                      <p className="mt-1 text-sm text-success">In Stock</p>
                    )}
                    {savings >= 10 && (
                      <span className="mt-1 inline-block rounded-sm bg-deal px-1.5 py-0.5 text-xs font-semibold text-white">
                        Limited time deal
                      </span>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {!unavailable && (
                        <>
                          <QuantityStepper
                            quantity={quantity}
                            max={max}
                            title={p.title}
                            onChange={(q) => setQuantity(p.slug, q)}
                            onRemove={() => remove(p.slug)}
                          />
                          <span className="h-4 w-px bg-[#ddd]" aria-hidden />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(p.slug)}
                        className="text-xs text-link hover:text-link-hover hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="order-first sm:order-last sm:text-right">
                    <Price value={p.price} />
                    {quantity > 1 && !unavailable && (
                      <p className="text-xs text-muted">{formatPrice(p.price * quantity)} total</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="border-t border-[#ddd] pt-3 text-right text-lg text-ink">{subtotalLabel}</p>
      </section>
    </div>
  );
}

function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[#e3e6e6]"
        role="progressbar"
        aria-label="Progress toward free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm">
        {remaining <= 0 ? (
          <span className="text-success">
            <span className="font-bold">✓ Your order qualifies for FREE Shipping.</span>
          </span>
        ) : (
          <>
            Add <span className="font-bold text-deal">{formatPrice(remaining)}</span> of eligible items to your
            order for <span className="font-bold">FREE Shipping</span>.
          </>
        )}
      </p>
    </div>
  );
}

function EmptyCart() {
  return (
    <section className="rounded-lg bg-white p-8">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight text-ink">Your cart is empty</h1>
      <p className="mt-2 text-sm text-ink">
        Browse{" "}
        <Link href="/s?deals=1&sort=discount" className="text-link hover:text-link-hover hover:underline">
          today&apos;s deals
        </Link>{" "}
        or{" "}
        <Link href="/" className="text-link hover:text-link-hover hover:underline">
          continue shopping
        </Link>
        .
      </p>
    </section>
  );
}

function CartSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row" aria-busy="true" aria-label="Loading cart">
      <div className="h-80 flex-1 animate-pulse rounded-lg bg-white" />
      <div className="h-40 animate-pulse rounded-lg bg-white lg:w-[300px]" />
    </div>
  );
}
