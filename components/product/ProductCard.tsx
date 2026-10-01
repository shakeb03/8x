import Image from "next/image";
import Link from "next/link";
import { getRatingCount } from "@/lib/catalog";
import { listPrice, savingsPercent } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ListPrice, Price } from "./Price";
import { Rating } from "./Rating";

type Props = {
  product: Product;
  /** "deal" shows the red discount badge instead of the rating. */
  variant?: "default" | "deal";
};

export function ProductCard({ product, variant = "default" }: Props) {
  const savings = savingsPercent(product);
  const href = `/dp/${product.slug}`;

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden rounded-md bg-[#f7f7f7]"
      >
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 220px, 45vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </Link>

      <div className="mt-2 flex flex-1 flex-col gap-1">
        {variant === "deal" && savings > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="shrink-0 rounded-sm bg-deal px-1.5 py-1 font-semibold whitespace-nowrap text-white">
              {savings}% off
            </span>
            <span className="font-semibold text-deal">Limited time deal</span>
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-x-2">
          <Price value={product.price} />
          {savings > 0 && <ListPrice value={listPrice(product)} />}
        </div>

        <Link
          href={href}
          className="line-clamp-2 text-sm leading-snug text-ink hover:text-link-hover"
        >
          {product.title}
        </Link>

        {variant === "default" && (
          <Rating value={product.rating} count={getRatingCount(product)} />
        )}
      </div>
    </article>
  );
}
