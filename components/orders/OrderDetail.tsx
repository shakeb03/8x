"use client";

import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { OrderLines } from "@/components/orders/OrderLines";
import { OrderNotFound } from "@/components/orders/OrderNotFound";
import { OrdersSkeleton } from "@/components/orders/OrdersSkeleton";
import { useHydrated } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { formatPlacedDate, orderStatus } from "@/lib/orders";
import { useOrder } from "@/lib/orders-store";
import { PROVINCES } from "@/lib/tax";

export function OrderDetail({ orderId }: { orderId: string }) {
  const hydrated = useHydrated();
  const order = useOrder(orderId);

  if (!hydrated) return <OrdersSkeleton />;
  if (!order) return <OrderNotFound />;

  const status = orderStatus(order);
  const { address } = order;
  const province = PROVINCES.find((p) => p.code === address.province)?.name ?? address.province;

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex items-center gap-1">
          <li className="flex items-center gap-1">
            <Link href="/orders" className="text-link hover:text-link-hover hover:underline">
              Your Orders
            </Link>
            <ChevronIcon className="size-3" />
          </li>
          <li aria-current="page" className="text-[#c45500]">
            Order Details
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-ink">Order Details</h1>
        <p className="text-sm text-ink">
          Ordered on {formatPlacedDate(order)}
          <span className="mx-2 text-[#ddd]">|</span>
          <span className="whitespace-nowrap">Order# {order.id}</span>
        </p>
      </div>

      <section
        aria-label="Order information"
        className="grid gap-6 rounded-lg border border-[#d5d9d9] bg-white p-5 text-sm md:grid-cols-[1fr_1fr_1.2fr]"
      >
        <div>
          <h2 className="mb-1 font-bold">Shipping Address</h2>
          <address className="not-italic">
            {address.fullName}
            <br />
            {address.street}
            {address.unit && `, ${address.unit}`}
            <br />
            {address.city}, {province} {address.postalCode}
            <br />
            Canada
          </address>
        </div>
        <div>
          <h2 className="mb-1 font-bold">Payment Method</h2>
          <p>{order.payment.label}</p>
          <h2 className="mt-3 mb-1 font-bold">Delivery</h2>
          <p>{order.delivery.label}</p>
        </div>
        <div>
          <h2 className="mb-1 font-bold">Order Summary</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-y-0.5">
            <dt>Item(s) Subtotal:</dt>
            <dd className="text-right">{formatPrice(order.subtotal)}</dd>
            <dt>Shipping &amp; Handling:</dt>
            <dd className="text-right">{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</dd>
            <dt>Total before tax:</dt>
            <dd className="text-right">{formatPrice(order.subtotal + order.shipping)}</dd>
            <dt>Estimated GST/HST/PST:</dt>
            <dd className="text-right">{formatPrice(order.tax)}</dd>
            <dt className="mt-1 border-t border-[#ddd] pt-1 font-bold">Grand Total:</dt>
            <dd className="mt-1 border-t border-[#ddd] pt-1 text-right font-bold">{formatPrice(order.total)}</dd>
          </dl>
        </div>
      </section>

      <section aria-labelledby="shipment-heading" className="rounded-lg border border-[#d5d9d9] bg-white p-5">
        <h2 id="shipment-heading" className={`text-lg font-bold ${status.delivered ? "text-ink" : "text-success"}`}>
          {status.label}
        </h2>
        <p className="mb-4 text-sm text-muted">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"} shipped together
        </p>
        <OrderLines lines={order.lines} />
      </section>
    </div>
  );
}
