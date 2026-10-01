// Pure checkout logic: delivery options, totals, and building an Order.

import type { CartLine } from "./cart-lines";
import { addBusinessDays, FREE_SHIPPING_THRESHOLD, shippingDays, STANDARD_SHIPPING } from "./delivery";
import { taxRate } from "./tax";
import type { DeliverySpeed, Order, PaymentMethodId, ShippingAddress } from "./types";

export const EXPRESS_SHIPPING = 12.99;

export type DeliveryOption = {
  speed: DeliverySpeed;
  label: string;
  cost: number;
  arrives: Date;
};

/**
 * The order ships together, so it arrives when its slowest item does.
 * Express roughly halves that, but never beats next business day.
 */
export function deliveryOptions(lines: CartLine[], subtotal: number, now = new Date()): DeliveryOption[] {
  const slowest = Math.max(1, ...lines.map((l) => shippingDays(l.product)));
  const expressDays = Math.max(1, Math.ceil(slowest / 2));
  const options: DeliveryOption[] = [
    {
      speed: "standard",
      label: "Standard Shipping",
      cost: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING,
      arrives: addBusinessDays(now, slowest),
    },
  ];
  if (expressDays < slowest) {
    options.push({
      speed: "express",
      label: "Express Shipping",
      cost: EXPRESS_SHIPPING,
      arrives: addBusinessDays(now, expressDays),
    });
  }
  return options;
}

export const PAYMENT_METHODS: { id: PaymentMethodId; label: string; detail: string }[] = [
  { id: "demo-card", label: "Demo Visa ending in 4242", detail: "Mock card for this demo — nothing is charged" },
  { id: "gift-card", label: "Gift card balance", detail: "Demo balance: $5,000.00" },
  { id: "pay-on-delivery", label: "Pay on delivery", detail: "Pay the courier when your order arrives" },
];

const round = (n: number) => Math.round(n * 100) / 100;

export function orderTotals(subtotal: number, shipping: number, province: string | null) {
  const beforeTax = round(subtotal + shipping);
  const tax = province ? round(beforeTax * taxRate(province)) : null;
  return { beforeTax, tax, total: round(beforeTax + (tax ?? 0)) };
}

/** Amazon-style order number, e.g. 112-4820193-5571820. */
export function newOrderId(): string {
  const digits = (n: number) => {
    const bytes = crypto.getRandomValues(new Uint8Array(n));
    return Array.from(bytes, (b) => String(b % 10)).join("");
  };
  return `1${digits(2)}-${digits(7)}-${digits(7)}`;
}

export function buildOrder(input: {
  lines: CartLine[];
  address: ShippingAddress;
  delivery: DeliveryOption;
  payment: PaymentMethodId;
  subtotal: number;
}): Order {
  const { lines, address, delivery, payment, subtotal } = input;
  const totals = orderTotals(subtotal, delivery.cost, address.province);
  return {
    id: newOrderId(),
    placedAt: new Date().toISOString(),
    estimatedDelivery: delivery.arrives.toISOString(),
    lines: lines.map(({ product: p, quantity }) => ({
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      thumbnail: p.thumbnail,
      price: p.price,
      quantity,
    })),
    address,
    delivery: { speed: delivery.speed, label: delivery.label, cost: delivery.cost },
    payment: {
      method: payment,
      label: PAYMENT_METHODS.find((m) => m.id === payment)?.label ?? payment,
    },
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    shipping: delivery.cost,
    tax: totals.tax ?? 0,
    total: totals.total,
  };
}
