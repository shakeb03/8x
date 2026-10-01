"use client";

import Link from "next/link";
import { OrderLines } from "@/components/orders/OrderLines";
import { OrderNotFound } from "@/components/orders/OrderNotFound";
import { OrdersSkeleton } from "@/components/orders/OrdersSkeleton";
import { useHydrated } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { orderStatus } from "@/lib/orders";
import { useOrder } from "@/lib/orders-store";

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const hydrated = useHydrated();
  const order = useOrder(orderId);

  if (!hydrated) return <OrdersSkeleton />;
  if (!order) return <OrderNotFound />;

  const { label } = orderStatus(order);
  const { address } = order;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border-l-4 border-success bg-white p-6" aria-labelledby="placed-heading">
        <div className="flex items-start gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-lg text-white"
            aria-hidden
          >
            ✓
          </span>
          <div>
            <h1 id="placed-heading" className="text-xl font-bold text-success">
              Order placed, thank you!
            </h1>
            <p className="mt-1 text-sm text-ink">
              Order number <span className="font-bold">{order.id}</span>
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-[#ddd] pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Delivery estimate</dt>
            <dd className="mt-0.5 font-bold text-ink">{label}</dd>
            <dd className="text-xs text-muted">{order.delivery.label}</dd>
          </div>
          <div>
            <dt className="text-muted">Shipping to</dt>
            <dd className="mt-0.5 font-bold text-ink">{address.fullName}</dd>
            <dd className="text-xs text-muted">
              {address.city}, {address.province} {address.postalCode}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Order total</dt>
            <dd className="mt-0.5 text-lg font-bold text-deal">{formatPrice(order.total)}</dd>
            <dd className="text-xs text-muted">
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {order.payment.label}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/orders/${order.id}`}
            className="rounded-full bg-cta px-5 py-2 text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-cta-hover"
          >
            View order
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#d5d9d9] bg-white px-5 py-2 text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa]"
          >
            Continue shopping
          </Link>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6" aria-labelledby="items-heading">
        <h2 id="items-heading" className="mb-3 text-lg font-bold">
          Items in this order
        </h2>
        <OrderLines lines={order.lines} />
      </section>
    </div>
  );
}
