import Image from "next/image";
import Link from "next/link";
import type { HeroCampaign } from "@/lib/home";

/**
 * Tall campaign card: big headline over a collage of three product cut-outs.
 * The images are transparent PNG/WebP, so they sit directly on the color.
 */
export function HeroCard({ campaign, preload }: { campaign: HeroCampaign; preload?: boolean }) {
  const [main, left, right] = campaign.products;

  return (
    <Link
      href={campaign.href}
      style={{ backgroundColor: campaign.bg }}
      className="group relative flex aspect-[4/5] w-[78vw] sm:aspect-[5/8] shrink-0 snap-start flex-col overflow-hidden rounded-xl p-5 sm:w-[44vw] md:w-[30vw] lg:w-[calc((100%-4*1rem)/4.4)] xl:w-[calc((100%-5*1rem)/5.25)]"
    >
      <h2 className="relative z-10 max-w-[12ch] font-display text-[24px] sm:text-[28px] leading-[1.05] font-extrabold tracking-tight text-ink xl:text-[32px]">
        {campaign.title}
      </h2>

      <div className="relative mt-auto h-[72%] w-full">
        <div className="absolute top-[30%] left-[-10%] h-[62%] w-[62%] transition-transform duration-500 group-hover:-translate-x-1 group-hover:-rotate-3">
          <Image src={left.images[0]} alt="" fill sizes="(min-width: 1280px) 160px, 30vw" className="object-contain drop-shadow-lg" />
        </div>
        <div className="absolute top-[40%] left-[48%] h-[62%] w-[62%] transition-transform duration-500 group-hover:translate-x-1 group-hover:rotate-3">
          <Image src={right.images[0]} alt="" fill sizes="(min-width: 1280px) 160px, 30vw" className="object-contain drop-shadow-lg" />
        </div>
        <div className="absolute top-[-4%] left-[5%] h-[90%] w-[90%] transition-transform duration-500 group-hover:scale-105">
          <Image
            src={main.images[0]}
            alt={main.title}
            fill
            preload={preload}
            sizes="(min-width: 1280px) 260px, 60vw"
            className="object-contain drop-shadow-xl"
          />
        </div>
      </div>
    </Link>
  );
}
