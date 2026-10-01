import Image from "next/image";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import type { QuadCard as QuadCardData } from "@/lib/home";

// Soft tints behind each tile, cycled so neighbouring tiles differ.
const TINTS = ["#f3ece4", "#e6eef5", "#efe8f5", "#e7f2ea"];

export function QuadCard({ card }: { card: QuadCardData }) {
  return (
    <section className="flex flex-col rounded-lg bg-white p-4 sm:p-5">
      <Link href={card.href} className="group mb-3 flex items-start justify-between gap-2">
        <h2 className="font-display text-xl sm:text-[22px] leading-tight font-extrabold tracking-tight text-ink">
          {card.title}
        </h2>
        <ChevronIcon className="mt-1 size-6 shrink-0 text-ink transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="grid flex-1 grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
        {card.tiles.map((tile, i) => (
          <Link key={tile.label} href={tile.href} className="group">
            <div
              className="relative aspect-square overflow-hidden rounded-md"
              style={{ backgroundColor: TINTS[i % TINTS.length] }}
            >
              <Image
                src={tile.product.images[0]}
                alt=""
                fill
                sizes="(min-width: 1024px) 160px, 40vw"
                className="object-contain p-1.5 sm:p-3 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="mt-1.5 line-clamp-1 text-[11px] sm:text-xs text-ink group-hover:text-link-hover">
              {tile.label}
            </p>
          </Link>
        ))}
      </div>

      <Link href={card.href} className="mt-4 text-[13px] text-link hover:text-link-hover hover:underline">
        {card.linkLabel}
      </Link>
    </section>
  );
}
