import Image from "next/image";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Stars } from "@/components/product/Rating";
import { formatCount, formatPrice } from "@/lib/format";
import type { AgentProduct } from "@/lib/agent/types";

/** Shared-element name so a tile and the hero morph into each other. */
export const transitionName = (slug: string) => `agent-${slug}`;

/**
 * The focused result: a large floating image with its details beside it.
 * "View details" opens the product inside the agent experience.
 */
export function AgentHero({ product: p, onOpen }: { product: AgentProduct; onOpen: () => void }) {
  return (
    <section
      aria-label={`Featured: ${p.title}`}
      className="relative flex h-full flex-col md:rounded-[2rem] md:bg-white/35 md:shadow-[0_40px_90px_-30px_rgba(40,20,120,.35)] md:ring-1 md:ring-white/80"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group relative block aspect-square w-full overflow-hidden rounded-[2rem] bg-white/35 ring-1 ring-white/80 md:aspect-auto md:min-h-0 md:flex-1 md:bg-transparent md:ring-0"
        aria-label={`View details for ${p.title}`}
      >
        {/* Spotlight behind the product and a soft ground shadow beneath it.
            On desktop both sit right of the details card, like the image. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side_at_50%_48%,rgba(255,255,255,.95),rgba(255,255,255,.45)_55%,transparent)] md:left-[26%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[6%] left-1/2 h-8 w-[45%] -translate-x-1/2 rounded-[50%] bg-[#1b1240]/20 blur-2xl md:left-[64%] md:w-[38%]"
        />
        <div
          className="absolute inset-[4%] md:inset-y-[3%] md:right-[2%] md:left-[30%]"
          style={{ viewTransitionName: transitionName(p.slug) }}
        >
          <Image
            src={p.image}
            alt={p.title}
            fill
            preload
            sizes="(min-width: 768px) 65vw, 100vw"
            className="object-contain drop-shadow-[0_40px_50px_rgba(30,20,80,.32)] transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
      </button>

      <div
        key={p.slug}
        className="agent-rise relative mt-2 rounded-3xl bg-white/70 p-5 shadow-[0_10px_40px_rgba(40,20,120,.10)] ring-1 ring-white/60 backdrop-blur-xl md:absolute md:bottom-5 md:left-5 md:mt-0 md:w-[23rem]"
      >
        {p.brand && <p className="text-[11px] font-semibold tracking-[.14em] text-[#6a5bb0] uppercase">{p.brand}</p>}
        <h2 className="mt-0.5 font-display text-2xl leading-tight font-extrabold tracking-tight text-[#17122b] md:text-3xl">
          {p.title}
        </h2>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#5f5a78]">
          <Stars value={p.rating} />
          {p.rating.toFixed(1)} · {formatCount(p.ratingCount)} ratings
        </div>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-[#17122b] md:text-4xl">{formatPrice(p.price)}</span>
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
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 rounded-full border border-[#d9d2f7] bg-white/80 px-4 py-2 text-center text-sm whitespace-nowrap text-[#3b2f7a] hover:bg-white"
          >
            View details
          </button>
          <AddToCartButton slug={p.slug} tone="agent" className="flex-1 py-2 text-sm whitespace-nowrap shadow-none" />
        </div>
      </div>
    </section>
  );
}
