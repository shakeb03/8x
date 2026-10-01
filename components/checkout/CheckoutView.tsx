"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressForm } from "@/components/checkout/AddressForm";
import { StepSection } from "@/components/checkout/StepSection";
import { buildCartLines, isUnavailable, summarizeLines } from "@/lib/cart-lines";
import { useCartStore, useHydrated } from "@/lib/cart-store";
import { buildOrder, deliveryOptions, orderTotals, PAYMENT_METHODS } from "@/lib/checkout";
import { formatDeliveryDate } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { useOrdersStore } from "@/lib/orders-store";
import { PROVINCES } from "@/lib/tax";
import type { CartProduct, DeliverySpeed, PaymentMethodId, ShippingAddress } from "@/lib/types";

type Step = "address" | "delivery" | "payment" | "review";

export function CheckoutView({ catalog }: { catalog: Record<string, CartProduct> }) {
  const hydrated = useHydrated();
  return hydrated ? <Checkout catalog={catalog} /> : <CheckoutSkeleton />;
}

/** Rendered only after hydration, so it can read persisted stores directly. */
function Checkout({ catalog }: { catalog: Record<string, CartProduct> }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.remove);
  const addOrder = useOrdersStore((s) => s.addOrder);
  // Pre-fill from the most recent order, if there is one.
  const [lastAddress] = useState(() => useOrdersStore.getState().orders[0]?.address ?? null);

  const [address, setAddress] = useState<ShippingAddress | null>(lastAddress);
  const [speed, setSpeed] = useState<DeliverySpeed>("standard");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [payment, setPayment] = useState<PaymentMethodId | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethodId>("demo-card");
  const [step, setStep] = useState<Step>(lastAddress ? "delivery" : "address");
  const [placing, setPlacing] = useState(false);

  if (placing) {
    return (
      <div className="rounded-lg bg-white p-8 text-center" role="status">
        <p className="text-lg font-bold">Placing your order…</p>
      </div>
    );
  }

  const lines = buildCartLines(items, catalog);
  const { purchasable, count, subtotal } = summarizeLines(lines);
  const unavailableCount = lines.filter((l) => isUnavailable(l.product)).length;

  if (purchasable.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">There&apos;s nothing to check out</h1>
        <p className="mt-2 text-sm">
          Your cart has no items available to order.{" "}
          <Link href="/cart" className="text-link hover:text-link-hover hover:underline">
            Return to cart
          </Link>{" "}
          or{" "}
          <Link href="/" className="text-link hover:text-link-hover hover:underline">
            keep shopping
          </Link>
          .
        </p>
      </div>
    );
  }

  const options = deliveryOptions(purchasable, subtotal);
  const delivery = options.find((o) => o.speed === speed) ?? options[0];
  const totals = orderTotals(subtotal, delivery.cost, address?.province ?? null);
  const ready = address !== null && deliveryConfirmed && payment !== null;

  const placeOrder = () => {
    if (!ready || placing) return;
    setPlacing(true);
    const order = buildOrder({ lines: purchasable, address, delivery, payment, subtotal });
    addOrder(order);
    // Only the purchased items leave the cart; unavailable ones stay.
    purchasable.forEach((l) => removeFromCart(l.product.slug));
    router.push(`/checkout/confirmation?order=${order.id}`);
  };

  const provinceName = (code: string) => PROVINCES.find((p) => p.code === code)?.name ?? code;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-ink">
          Checkout{" "}
          <span className="text-lg font-normal text-muted">
            ({count} {count === 1 ? "item" : "items"})
          </span>
        </h1>

        <StepSection
          number={1}
          title={step === "address" ? "Enter a shipping address" : "Shipping address"}
          open={step === "address"}
          onChange={() => setStep("address")}
          summary={
            address && (
              <address className="not-italic">
                {address.fullName}
                <br />
                {address.street}
                {address.unit && `, ${address.unit}`}
                <br />
                {address.city}, {provinceName(address.province)} {address.postalCode}
              </address>
            )
          }
        >
          <AddressForm
            initial={address}
            onSubmit={(a) => {
              setAddress(a);
              setStep(deliveryConfirmed ? (payment ? "review" : "payment") : "delivery");
            }}
          />
        </StepSection>

        <StepSection
          number={2}
          title={step === "delivery" ? "Choose a delivery option" : "Delivery option"}
          open={step === "delivery"}
          onChange={() => setStep("delivery")}
          summary={
            deliveryConfirmed && (
              <>
                {delivery.label} —{" "}
                <span className="font-bold text-success">Arriving {formatDeliveryDate(delivery.arrives)}</span>
              </>
            )
          }
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Delivery option</legend>
            {options.map((o) => (
              <label
                key={o.speed}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                  speed === o.speed ? "border-[#e77600] bg-[#fcf5ee]" : "border-[#d5d9d9] hover:bg-[#f7fafa]"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={o.speed}
                  checked={speed === o.speed}
                  onChange={() => setSpeed(o.speed)}
                  className="mt-1 accent-[#e77600]"
                />
                <span className="text-sm">
                  <span className="block font-bold text-success">{formatDeliveryDate(o.arrives, "long")}</span>
                  <span className="text-ink">
                    {o.cost === 0 ? "FREE" : formatPrice(o.cost)} — {o.label}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {options.length === 1 && (
            <p className="mt-2 text-xs text-muted">Express isn&apos;t available because these items already ship quickly.</p>
          )}
          <button
            type="button"
            onClick={() => {
              setDeliveryConfirmed(true);
              setStep(address ? (payment ? "review" : "payment") : "address");
            }}
            className="mt-3 rounded-full bg-cta px-5 py-2 text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-cta-hover"
          >
            Use this delivery option
          </button>
        </StepSection>

        <StepSection
          number={3}
          title={step === "payment" ? "Choose a payment method" : "Payment method"}
          open={step === "payment"}
          onChange={() => setStep("payment")}
          summary={payment && PAYMENT_METHODS.find((m) => m.id === payment)?.label}
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Payment method</legend>
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                  paymentChoice === m.id ? "border-[#e77600] bg-[#fcf5ee]" : "border-[#d5d9d9] hover:bg-[#f7fafa]"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={paymentChoice === m.id}
                  onChange={() => setPaymentChoice(m.id)}
                  className="mt-1 accent-[#e77600]"
                />
                <span className="text-sm">
                  <span className="block font-bold text-ink">{m.label}</span>
                  <span className="text-muted">{m.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="mt-2 text-xs text-muted">
            This is a demo store. No real payment is taken and no card details are collected.
          </p>
          <button
            type="button"
            onClick={() => {
              setPayment(paymentChoice);
              setStep(address ? (deliveryConfirmed ? "review" : "delivery") : "address");
            }}
            className="mt-3 rounded-full bg-cta px-5 py-2 text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-cta-hover"
          >
            Use this payment method
          </button>
        </StepSection>

        <StepSection number={4} title="Review items and delivery" open={step === "review"}>
          <div className="rounded-md border border-[#d5d9d9] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-base font-bold text-success">
                Arriving {formatDeliveryDate(delivery.arrives, "long")}
              </p>
              <Link href="/cart" className="text-sm text-link hover:text-link-hover hover:underline">
                Change quantities or remove items
              </Link>
            </div>
            <p className="text-xs text-muted">
              {delivery.label} · {delivery.cost === 0 ? "FREE" : formatPrice(delivery.cost)}
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {purchasable.map(({ product: p, quantity }) => (
                <li key={p.slug} className="flex gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded bg-[#f7f8f8]">
                    <Image src={p.thumbnail} alt="" fill sizes="64px" className="object-contain p-1" />
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="line-clamp-2 font-bold text-ink">{p.title}</p>
                    <p className="font-bold text-deal">{formatPrice(p.price)}</p>
                    <p className="text-muted">Qty: {quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
            {unavailableCount > 0 && (
              <p className="mt-3 rounded bg-[#fff8e5] p-2 text-xs text-ink">
                {unavailableCount} unavailable {unavailableCount === 1 ? "item stays" : "items stay"} in your cart
                and won&apos;t be included in this order.
              </p>
            )}
          </div>
        </StepSection>
      </div>

      {/* Order summary */}
      <aside aria-label="Order summary" className="rounded-lg bg-white p-5 lg:sticky lg:top-4 lg:w-[300px] lg:shrink-0">
        <button
          type="button"
          onClick={placeOrder}
          disabled={!ready}
          className="w-full rounded-full bg-cta py-2 text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-cta-hover disabled:cursor-not-allowed disabled:bg-[#f0f2f2] disabled:text-muted disabled:shadow-none"
        >
          Place your order
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          {ready ? "No real payment will be taken." : "Complete each step above to place your order."}
        </p>

        <hr className="my-3 border-[#ddd]" />
        <h2 className="mb-2 text-lg font-bold">Order Summary</h2>
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt>Items ({count}):</dt>
          <dd className="text-right">{formatPrice(subtotal)}</dd>
          <dt>Shipping &amp; handling:</dt>
          <dd className="text-right">{delivery.cost === 0 ? "FREE" : formatPrice(delivery.cost)}</dd>
          <dt className="pt-1">Total before tax:</dt>
          <dd className="border-t border-[#ddd] pt-1 text-right">{formatPrice(totals.beforeTax)}</dd>
          <dt>Estimated GST/HST/PST:</dt>
          <dd className="text-right">{totals.tax === null ? "—" : formatPrice(totals.tax)}</dd>
        </dl>
        <hr className="my-3 border-[#ddd]" />
        <p className="flex justify-between text-lg font-bold text-deal">
          <span>Order total:</span>
          <span>{formatPrice(totals.total)}</span>
        </p>
        {totals.tax === null && <p className="mt-1 text-xs text-muted">Tax is calculated once you add an address.</p>}
      </aside>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row" aria-busy="true" aria-label="Loading checkout">
      <div className="flex flex-1 flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-white lg:w-[300px]" />
    </div>
  );
}
