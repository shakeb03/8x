import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Stars } from "@/components/product/Rating";
import { formatCount, formatPrice } from "@/lib/format";
import type { AgentProduct } from "@/lib/agent/types";

export function AgentProductCard({ product: p }: { product: AgentProduct }) {
  const href = `/dp/${p.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#e6e1fb] bg-white shadow-[0_1px_2px_rgba(40,20,120,.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(40,20,120,.10)]">
      <Link href={href} className="relative block aspect-[4/3] bg-gradient-to-b from-[#faf9ff] to-[#f3f0ff]">
        <Image
          src={p.image}
          alt={p.title}
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
          className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {p.brand && <p className="text-[11px] font-semibold tracking-wider text-[#7a6bb8] uppercase">{p.brand}</p>}
        <Link href={href} className="line-clamp-2 leading-snug font-medium text-[#1b1530] hover:text-agent">
          {p.title}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-[#6b6684]">
          <Stars value={p.rating} />
          <span>
            {p.rating.toFixed(1)} · {formatCount(p.ratingCount)}
          </span>
        </div>
        <p className="flex items-baseline gap-2">
          <span className="text-xl font-semibold text-[#1b1530]">{formatPrice(p.price)}</span>
          {p.listPrice && <span className="text-xs text-[#9a95ad] line-through">{formatPrice(p.listPrice)}</span>}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {p.highlights.map((h) => (
            <li key={h} className="rounded-full bg-agent-soft px-2 py-0.5 text-[11px] text-[#4a3a9c]">
              {h}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={href}
            className="flex-1 rounded-full border border-[#d9d2f7] px-3 py-1.5 text-center text-[13px] text-[#3b2f7a] hover:bg-[#f7f5ff]"
          >
            View details
          </Link>
          <AddToCartButton slug={p.slug} tone="agent" className="flex-1 shadow-none" />
        </div>
      </div>
    </article>
  );
}
