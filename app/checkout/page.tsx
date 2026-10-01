import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getCartCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-3 pt-4 md:px-5">
      <CheckoutView catalog={getCartCatalog()} />
    </div>
  );
}
