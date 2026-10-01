import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { OrderLine } from "@/lib/types";

/** Items in an order, linking back to their product pages. */
export function OrderLines({ lines }: { lines: OrderLine[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {lines.map((l) => (
        <li key={l.slug} className="flex gap-4">
          <Link href={`/dp/${l.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-md bg-[#f7f8f8]">
            <Image src={l.thumbnail} alt={l.title} fill sizes="80px" className="object-contain p-1.5" />
            {l.quantity > 1 && (
              <span className="absolute right-1 bottom-1 rounded-full bg-white px-1.5 text-xs font-bold shadow">
                {l.quantity}
              </span>
            )}
          </Link>
          <div className="min-w-0 text-sm">
            <Link href={`/dp/${l.slug}`} className="line-clamp-2 text-link hover:text-link-hover hover:underline">
              {l.title}
            </Link>
            {l.brand && <p className="text-xs text-muted">Sold by: {l.brand}</p>}
            <p className="mt-0.5 text-ink">
              {formatPrice(l.price)}
              {l.quantity > 1 && <span className="text-muted"> · Qty: {l.quantity}</span>}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
