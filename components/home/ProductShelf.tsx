import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import type { Shelf } from "@/lib/home";
import { ScrollRow } from "./ScrollRow";

export function ProductShelf({ shelf }: { shelf: Shelf }) {
  return (
    <section className="rounded-lg bg-white px-5 pt-5 pb-4">
      <div className="mb-3 flex items-baseline gap-4">
        <h2 className="font-display text-[22px] font-extrabold tracking-tight text-ink">
          {shelf.title}
        </h2>
        <Link href={shelf.href} className="text-sm text-link hover:text-link-hover hover:underline">
          See all
        </Link>
      </div>

      <ScrollRow label={shelf.title} className="gap-4">
        {shelf.products.map((p) => (
          <div key={p.slug} className="w-[42vw] shrink-0 snap-start sm:w-[200px]">
            <ProductCard product={p} variant={shelf.variant} />
          </div>
        ))}
      </ScrollRow>
    </section>
  );
}
