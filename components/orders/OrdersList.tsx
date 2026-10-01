"use client";

import Image from "next/image";
import Link from "next/link";
import { OrdersSkeleton } from "@/components/orders/OrdersSkeleton";
import { useHydrated } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { formatPlacedDate, orderStatus } from "@/lib/orders";
import { useOrdersStore } from "@/lib/orders-store";
import type { Order } from "@/lib/types";

export function OrdersList() {
  const hydrated = useHydrated();
  const orders = useOrdersStore((s) => s.orders);

  if (!hydrated) return <OrdersSkeleton />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-ink">Your Orders</h1>
        {orders.length > 0 && (
          <p className="text-sm text-muted">
            {orders.length} {orders.length === 1 ? "order" : "orders"} placed
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg bg-white p-8">
          <p className="text-ink">You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="mt-2 inline-block text-sm text-link hover:text-link-hover hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PREVIEW = 4;

function OrderCard({ order }: { order: Order }) {
  const status = orderStatus(order);
  const detailHref = `/orders/${order.id}`;
  const extra = order.lines.length - PREVIEW;

  return (
    <article className="overflow-hidden rounded-lg border border-[#d5d9d9] bg-white" aria-label={`Order ${order.id}`}>
      <header className="flex flex-wrap gap-x-8 gap-y-2 border-b border-[#d5d9d9] bg-[#f0f2f2] px-5 py-3 text-xs text-muted">
        <div>
          <p className="uppercase">Order placed</p>
          <p className="text-sm text-ink">{formatPlacedDate(order)}</p>
        </div>
        <div>
          <p className="uppercase">Total</p>
          <p className="text-sm text-ink">{formatPrice(order.total)}</p>
        </div>
        <div>
          <p className="uppercase">Ship to</p>
          <p className="text-sm text-ink">{order.address.fullName}</p>
        </div>
        <div className="sm:ml-auto sm:text-right">
          <p className="uppercase">Order # {order.id}</p>
          <Link href={detailHref} className="text-sm text-link hover:text-link-hover hover:underline">
            View order details
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className={`text-lg font-bold ${status.delivered ? "text-ink" : "text-success"}`}>{status.label}</p>
          <p className="mb-3 text-sm text-muted">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {order.delivery.label}
          </p>
          <ul className="flex flex-wrap gap-3">
            {order.lines.slice(0, PREVIEW).map((l) => (
              <li key={l.slug} className="w-24">
                <Link href={`/dp/${l.slug}`} className="group block">
                  <span className="relative block size-24 overflow-hidden rounded-md bg-[#f7f8f8]">
                    <Image src={l.thumbnail} alt="" fill sizes="96px" className="object-contain p-1.5" />
                    {l.quantity > 1 && (
                      <span className="absolute right-1 bottom-1 rounded-full bg-white px-1.5 text-xs font-bold shadow">
                        {l.quantity}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs text-link group-hover:text-link-hover group-hover:underline">
                    {l.title}
                  </span>
                </Link>
              </li>
            ))}
            {extra > 0 && (
              <li className="flex size-24 items-center justify-center rounded-md bg-[#f7f8f8] text-sm text-muted">
                +{extra} more
              </li>
            )}
          </ul>
        </div>
        <Link
          href={detailHref}
          className="shrink-0 rounded-full border border-[#d5d9d9] bg-white px-5 py-1.5 text-center text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa] sm:w-48"
        >
          View order details
        </Link>
      </div>
    </article>
  );
}
