import type { Metadata } from "next";
import { OrdersList } from "@/components/orders/OrdersList";

export const metadata: Metadata = { title: "Your Orders" };

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-3 pt-4 md:px-5">
      <OrdersList />
    </div>
  );
}
