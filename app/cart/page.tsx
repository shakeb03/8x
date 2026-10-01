import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getCartCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shopping Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-3 pt-4 md:px-5">
      <CartView catalog={getCartCatalog()} />
    </div>
  );
}
