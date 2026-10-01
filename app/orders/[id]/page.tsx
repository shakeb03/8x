import type { Metadata } from "next";
import { OrderDetail } from "@/components/orders/OrderDetail";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  return (
    <div className="mx-auto max-w-[1000px] px-3 pt-4 md:px-5">
      <OrderDetail orderId={decodeURIComponent(id)} />
    </div>
  );
}
