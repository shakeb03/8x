"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PlusIcon } from "@/components/icons";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import type { AgentProduct } from "@/lib/agent/types";
import { transitionName } from "./AgentHero";

type Props = {
  product: AgentProduct;
  onFocus: () => void;
  /** Placement classes for the desktop mosaic. */
  className?: string;
  index: number;
};

/** A secondary result: mostly image. Clicking brings it to the hero spot. */
export function AgentTile({ product: p, onFocus, className = "", index }: Props) {
  return (
    <div
      className={`agent-rise group relative overflow-hidden rounded-3xl bg-white/45 ring-1 ring-white/70 backdrop-blur-md transition-[background-color,box-shadow] duration-300 md:bg-white/20 md:ring-white/45 md:hover:bg-white/70 md:hover:shadow-[0_14px_34px_-12px_rgba(40,20,120,.3)] md:hover:ring-white/80 md:focus-within:bg-white/70 md:focus-within:ring-white/80 ${className}`}
      style={{ animationDelay: `${80 + index * 60}ms` }}
    >
      <button
        type="button"
        onClick={onFocus}
        aria-label={`Feature ${p.title}, ${formatPrice(p.price)}`}
        className="absolute inset-0 z-0 rounded-3xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-agent"
      />
      <div
        className="pointer-events-none absolute inset-[12%] bottom-[22%] md:inset-[15%] md:bottom-[24%]"
        style={{ viewTransitionName: transitionName(p.slug) }}
      >
        <Image
          src={p.image}
          alt=""
          fill
          sizes="(min-width: 768px) 22vw, 45vw"
          className="object-contain drop-shadow-[0_14px_18px_rgba(30,20,80,.18)] transition-[transform,opacity,filter] duration-500 group-hover:scale-[1.06] md:scale-90 md:opacity-70 md:saturate-[.5] md:group-hover:scale-110 md:group-hover:opacity-100 md:group-hover:saturate-100 md:group-focus-within:scale-110 md:group-focus-within:opacity-100 md:group-focus-within:saturate-100"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <p className="line-clamp-1 text-xs text-[#3d3656] md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          {p.title}
        </p>
        <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#17122b] shadow-sm transition-colors md:bg-white/50 md:font-medium md:text-[#6b6684] md:shadow-none md:group-hover:bg-white/95 md:group-hover:font-semibold md:group-hover:text-[#17122b] md:group-focus-within:bg-white/95 md:group-focus-within:text-[#17122b]">
          {formatPrice(p.price)}
        </span>
      </div>
      <QuickAdd slug={p.slug} title={p.title} />
    </div>
  );
}

function QuickAdd({ slug, title }: { slug: string; title: string }) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      onClick={() => {
        add(slug);
        setAdded(true);
      }}
      aria-label={added ? `${title} added to cart` : `Add ${title} to cart`}
      className={`absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full shadow-sm transition-all ${
        added
          ? "bg-success text-white"
          : "bg-white/90 text-agent opacity-100 hover:bg-agent hover:text-white md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      }`}
    >
      {added ? <span aria-hidden>✓</span> : <PlusIcon className="size-4" />}
    </button>
  );
}
