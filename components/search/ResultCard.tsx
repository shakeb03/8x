import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ListPrice, Price } from "@/components/product/Price";
import { Rating } from "@/components/product/Rating";
import { getRatingCount } from "@/lib/catalog";
import { deliveryDate, shippingCost } from "@/lib/delivery";
import { formatPrice, listPrice, savingsPercent } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ResultCard({ product, preload }: { product: Product; preload?: boolean }) {
  const href = `/dp/${product.slug}`;
  const savings = savingsPercent(product);
  const shipping = shippingCost(product);
  const outOfStock = product.stock === 0 || product.availabilityStatus === "Out of Stock";

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-[#e3e6e6] bg-white">
      <Link href={href} className="relative block aspect-square bg-[#f7f8f8]">
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          preload={preload}
          sizes="(min-width: 1280px) 260px, (min-width: 768px) 30vw, 50vw"
          className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && (
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">{product.brand}</span>
        )}

        <Link href={href} className="line-clamp-2 text-[15px] leading-snug text-ink hover:text-link-hover">
          {product.title}
        </Link>

        <Rating value={product.rating} count={getRatingCount(product)} />

        {savings >= 10 && (
          <span className="w-fit rounded-sm bg-deal px-1.5 py-0.5 text-xs font-semibold text-white">
            Limited time deal
          </span>
        )}

        <div className="flex flex-wrap items-baseline gap-x-2">
          <Price value={product.price} />
          {savings > 0 && <ListPrice value={listPrice(product)} />}
        </div>

        {outOfStock ? (
          <p className="text-sm text-deal">Currently unavailable.</p>
        ) : (
          <>
            <p className="text-[13px] text-ink">
              {shipping === 0 ? "FREE delivery " : `${formatPrice(shipping)} delivery `}
              <span className="font-bold">{deliveryDate(product)}</span>
            </p>
            {product.stock < 10 && (
              <p className="text-[13px] text-deal">
                Only {product.stock} left in stock - order soon.
              </p>
            )}
          </>
        )}

        {!outOfStock && (
          <div className="mt-auto pt-2">
            <AddToCartButton slug={product.slug} />
          </div>
        )}
      </div>
    </article>
  );
}
