"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronIcon, MinusIcon, PlusIcon, SparkleIcon } from "@/components/icons";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Stars } from "@/components/product/Rating";
import { useCartStore } from "@/lib/cart-store";
import { formatCount, formatPrice } from "@/lib/format";
import type { AgentProduct, AgentProductDetail } from "@/lib/agent/types";
import { transitionName } from "./AgentHero";

type Props = {
  product: AgentProduct;
  /**
   * Fuller data: undefined while loading (the view renders from `product`
   * meanwhile), null if it couldn't be loaded.
   */
  detail: AgentProductDetail | null | undefined;
  reasons: string[];
  /** The other results from the current search, for quick switching. */
  others: AgentProduct[];
  onBack: () => void;
  onOpen: (slug: string) => void;
};

const panel = "rounded-3xl bg-white/70 p-5 shadow-[0_10px_40px_rgba(40,20,120,.10)] ring-1 ring-white/70 backdrop-blur-xl";

/**
 * A product, focused inside the agent canvas: the gallery takes the stage
 * and the details float beside it, framed by why it fits the search.
 */
export function AgentProductView({ product: p, detail, reasons, others, onBack, onOpen }: Props) {
  const images = detail?.images.length ? detail.images : [p.image];
  // Keyed by product so switching products resets the gallery and quantity.
  return (
    <div key={p.slug} className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-sm text-[#3b2f7a] ring-1 ring-white/80 backdrop-blur hover:bg-white"
      >
        <ChevronIcon direction="left" className="size-4" /> Back to results
      </button>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start">
        <Gallery slug={p.slug} title={p.title} images={images} />

        <div className="flex flex-col gap-4">
          {/* Identity, price, and why it fits */}
          <section aria-labelledby="agent-product-title" className={`agent-rise ${panel}`}>
            {p.brand && (
              <p className="text-[11px] font-semibold tracking-[.14em] text-[#6a5bb0] uppercase">{p.brand}</p>
            )}
            <h1
              id="agent-product-title"
              className="mt-0.5 font-display text-3xl leading-tight font-extrabold tracking-tight text-[#17122b]"
            >
              {p.title}
            </h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#5f5a78]">
              <Stars value={p.rating} />
              {p.rating.toFixed(1)} · {formatCount(p.ratingCount)} ratings
            </div>
            <p className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-4xl font-semibold text-[#17122b]">{formatPrice(p.price)}</span>
              {p.listPrice && <span className="text-sm text-[#8d88a3] line-through">{formatPrice(p.listPrice)}</span>}
              {detail && detail.savings > 0 && (
                <span className="rounded-full bg-[#ffe9ee] px-2 py-0.5 text-xs font-semibold text-deal">
                  {detail.savings}% off
                </span>
              )}
            </p>

            {reasons.length > 0 && (
              <div className="mt-4 rounded-2xl bg-agent-soft/80 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-agent uppercase">
                  <SparkleIcon className="size-3.5" /> Why this pick
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {reasons.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-[#2a2342]">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-agent" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Delivery, stock, quantity, and actions */}
          <section aria-label="Buy" className={`agent-rise ${panel}`} style={{ animationDelay: "80ms" }}>
            {detail ? (
              <Purchase product={p} detail={detail} />
            ) : detail === null ? (
              <PurchaseFallback product={p} />
            ) : (
              <PurchaseSkeleton />
            )}
          </section>

          {/* Key details */}
          {detail && (
            <section aria-labelledby="agent-details-title" className={`agent-rise ${panel}`} style={{ animationDelay: "160ms" }}>
              <h2 id="agent-details-title" className="text-sm font-semibold text-[#17122b]">
                Key details
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#4a4562]">{detail.description}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["Warranty", detail.warranty],
                  ["Returns", detail.returnPolicy],
                  ["Ships", detail.shipping.replace(/^Ships /, "")],
                  ["Size", detail.dimensions],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-[#ebe7fb]">
                    <dt className="text-[11px] tracking-wide text-[#8d88a3] uppercase">{k}</dt>
                    <dd className="text-sm text-[#2a2342]">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href={`/dp/${p.slug}`}
                className="mt-3 inline-block text-xs text-[#6a5bb0] hover:text-agent hover:underline"
              >
                Open the full product page ↗
              </Link>
            </section>
          )}
        </div>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="agent-others-title" className="pb-2">
          <h2 id="agent-others-title" className="mb-2 text-sm font-semibold text-[#3b2f7a]">
            Also in your results
          </h2>
          <ul className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {others.map((o) => (
              <li key={o.slug} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onOpen(o.slug)}
                  className="group flex w-44 items-center gap-3 rounded-2xl bg-white/40 p-2 pr-3 text-left ring-1 ring-white/60 backdrop-blur transition-colors hover:bg-white/80"
                >
                  <span className="relative size-12 shrink-0">
                    <Image
                      src={o.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain opacity-80 transition-opacity group-hover:opacity-100"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 text-xs text-[#3d3656]">{o.title}</span>
                    <span className="text-sm font-semibold text-[#17122b]">{formatPrice(o.price)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Gallery({ slug, title, images }: { slug: string; title: string; images: string[] }) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, images.length - 1)];

  return (
    <section
      aria-label="Product images"
      className="relative aspect-square overflow-hidden rounded-[2rem] bg-white/35 shadow-[0_40px_90px_-30px_rgba(40,20,120,.35)] ring-1 ring-white/80 md:sticky md:top-4 md:aspect-auto md:h-[clamp(420px,calc(100dvh-300px),640px)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side_at_50%_46%,rgba(255,255,255,.95),rgba(255,255,255,.45)_55%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[12%] left-1/2 h-8 w-[42%] -translate-x-1/2 rounded-[50%] bg-[#1b1240]/20 blur-2xl"
      />
      {/* The first image shares a transition name with the hero, so it morphs in. */}
      <div
        className="absolute inset-[8%] bottom-[18%]"
        style={active === 0 ? { viewTransitionName: transitionName(slug) } : undefined}
      >
        <Image
          key={current}
          src={current}
          alt={images.length > 1 ? `${title}, image ${active + 1} of ${images.length}` : title}
          fill
          preload
          sizes="(min-width: 768px) 55vw, 100vw"
          className="agent-rise object-contain drop-shadow-[0_40px_50px_rgba(30,20,80,.32)]"
        />
      </div>

      {images.length > 1 && (
        <ul className="absolute inset-x-0 bottom-4 flex justify-center gap-2" aria-label="Choose image">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active || undefined}
                className={`relative block size-14 overflow-hidden rounded-2xl bg-white/70 ring-2 backdrop-blur transition-all ${
                  i === active ? "ring-agent" : "ring-white/60 opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Purchase({ product: p, detail }: { product: AgentProduct; detail: AgentProductDetail }) {
  const [quantity, setQuantity] = useState(1);
  const add = useCartStore((s) => s.add);
  const router = useRouter();

  if (!detail.available) {
    return (
      <div>
        <p className="text-lg font-semibold text-deal">Currently unavailable</p>
        <p className="mt-1 text-sm text-[#5f5a78]">Try “Back to results” to see the alternatives.</p>
      </div>
    );
  }

  const step =
    "flex size-9 items-center justify-center rounded-full text-[#3b2f7a] transition-colors hover:bg-agent-soft disabled:text-[#c9c4dc] disabled:hover:bg-transparent";

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-[#2a2342]">
        <p>
          {detail.delivery.cost === 0 ? (
            <span className="font-semibold text-success">FREE delivery</span>
          ) : (
            <span>{formatPrice(detail.delivery.cost)} delivery</span>
          )}{" "}
          <span className="font-semibold">{detail.delivery.date}</span>
          {detail.delivery.fast && <span className="text-[#5f5a78]"> · fast shipping</span>}
        </p>
        <p className={detail.stock < 10 ? "text-deal" : "text-success"}>
          {detail.stock < 10 ? `Only ${detail.stock} left in stock` : "In stock"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full bg-white/80 ring-1 ring-[#e1dbf8]" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className={step}
          >
            <MinusIcon className="size-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-semibold text-[#17122b]" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(detail.maxQuantity, q + 1))}
            disabled={quantity >= detail.maxQuantity}
            aria-label="Increase quantity"
            className={step}
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
        <span className="text-xs text-[#8d88a3]">Max {detail.maxQuantity}</span>
      </div>

      <div className="flex gap-2">
        <AddToCartButton slug={p.slug} quantity={quantity} tone="agent" className="flex-1 py-2.5 text-sm shadow-none" />
        <button
          type="button"
          onClick={() => {
            add(p.slug, quantity);
            router.push("/checkout");
          }}
          className="flex-1 rounded-full bg-[#17122b] py-2.5 text-sm text-white transition-colors hover:bg-[#2a2342]"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}

/** Shown if delivery/stock details couldn't be loaded: buying still works. */
function PurchaseFallback({ product: p }: { product: AgentProduct }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#5f5a78]">We couldn&apos;t load delivery and stock details right now.</p>
      <AddToCartButton slug={p.slug} tone="agent" className="py-2.5 text-sm shadow-none" />
      <Link href={`/dp/${p.slug}`} className="text-xs text-[#6a5bb0] hover:text-agent hover:underline">
        Open the full product page ↗
      </Link>
    </div>
  );
}

function PurchaseSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading delivery and stock">
      <div className="h-4 w-2/3 animate-pulse rounded bg-[#ebe7fb]" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-[#ebe7fb]" />
      <div className="h-9 w-32 animate-pulse rounded-full bg-[#ebe7fb]" />
      <div className="h-10 w-full animate-pulse rounded-full bg-[#ebe7fb]" />
    </div>
  );
}
