import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Stars } from "@/components/product/Rating";
import { formatCount, formatPrice } from "@/lib/format";
import type { AgentProduct } from "@/lib/agent/types";

/** Shared-element name so a tile and the hero morph into each other. */
export const transitionName = (slug: string) => `agent-${slug}`;

/** The focused result: a large floating image with its details beside it. */
export function AgentHero({ product: p }: { product: AgentProduct }) {
  const href = `/dp/${p.slug}`;
  return (
    <section aria-label={`Featured: ${p.title}`} className="relative flex h-full flex-col">
      <Link
        href={href}
        className="group relative block aspect-square w-full md:aspect-auto md:min-h-0 md:flex-1"
        aria-label={`View ${p.title}`}
      >
        {/* On desktop the image sits right of the details card instead of under it. */}
        <div
          className="absolute inset-[6%] md:inset-y-[5%] md:right-[3%] md:left-[33%]"
          style={{ viewTransitionName: transitionName(p.slug) }}
        >
          <Image
            src={p.image}
            alt={p.title}
            fill
            preload
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-contain drop-shadow-[0_30px_40px_rgba(30,20,80,.25)] transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div
        key={p.slug}
        className="agent-rise relative mt-2 rounded-3xl bg-white/70 p-5 shadow-[0_10px_40px_rgba(40,20,120,.10)] ring-1 ring-white/60 backdrop-blur-xl md:absolute md:bottom-4 md:left-4 md:mt-0 md:w-[22rem]"
      >
        {p.brand && <p className="text-[11px] font-semibold tracking-[.14em] text-[#6a5bb0] uppercase">{p.brand}</p>}
        <h2 className="mt-0.5 font-display text-2xl leading-tight font-extrabold tracking-tight text-[#17122b]">
          {p.title}
        </h2>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#5f5a78]">
          <Stars value={p.rating} />
          {p.rating.toFixed(1)} · {formatCount(p.ratingCount)} ratings
        </div>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-[#17122b]">{formatPrice(p.price)}</span>
          {p.listPrice && <span className="text-sm text-[#8d88a3] line-through">{formatPrice(p.listPrice)}</span>}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {p.highlights.map((h) => (
            <li key={h} className="rounded-full bg-agent-soft px-2.5 py-0.5 text-[11px] text-[#43358f]">
              {h}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <Link
            href={href}
            className="flex-1 rounded-full border border-[#d9d2f7] bg-white/80 px-4 py-2 text-center text-sm whitespace-nowrap text-[#3b2f7a] hover:bg-white"
          >
            View details
          </Link>
          <AddToCartButton slug={p.slug} tone="agent" className="flex-1 py-2 text-sm whitespace-nowrap shadow-none" />
        </div>
      </div>
    </section>
  );
}
