import { HeroCard } from "@/components/home/HeroCard";
import { ProductShelf } from "@/components/home/ProductShelf";
import { QuadCard } from "@/components/home/QuadCard";
import { ScrollRow } from "@/components/home/ScrollRow";
import { getHeroCampaigns, getQuadCards, getShelves } from "@/lib/home";

export default function Home() {
  const campaigns = getHeroCampaigns();
  const [quadsTop, quadsBottom] = getQuadCards();
  const [deals, ...shelves] = getShelves();

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-3 pt-4 md:px-5">
      <ScrollRow label="Featured collections" arrows="tall" className="gap-4">
        {campaigns.map((c, i) => (
          <HeroCard key={c.title} campaign={c} preload={i < 3} />
        ))}
      </ScrollRow>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {quadsTop.map((card) => (
          <QuadCard key={card.title} card={card} />
        ))}
      </div>

      <ProductShelf shelf={deals} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {quadsBottom.map((card) => (
          <QuadCard key={card.title} card={card} />
        ))}
      </div>

      {shelves.map((shelf) => (
        <ProductShelf key={shelf.title} shelf={shelf} />
      ))}
    </div>
  );
}
