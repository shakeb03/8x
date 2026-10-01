import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/orders/OrderConfirmation";

export const metadata: Metadata = { title: "Order placed" };

export default async function ConfirmationPage(props: PageProps<"/checkout/confirmation">) {
  const { order } = await props.searchParams;
  const orderId = Array.isArray(order) ? order[0] : (order ?? "");

  return (
    <div className="mx-auto max-w-[1000px] px-3 pt-4 md:px-5">
      <OrderConfirmation orderId={orderId} />
    </div>
  );
}
