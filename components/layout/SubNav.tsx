import Link from "next/link";
import { MenuIcon } from "@/components/icons";

const link =
  "shrink-0 whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white";

export function SubNav({ departments }: { departments: { slug: string; name: string }[] }) {
  return (
    <nav aria-label="Departments" className="bg-nav-2">
      <div className="no-scrollbar flex h-[39px] items-center overflow-x-auto px-2 text-sm">
        <Link href="/s" className={`${link} flex items-center gap-1 font-bold`}>
          <MenuIcon className="size-5" />
          All
        </Link>
        <Link href="/deals" className={link}>
          Today&apos;s Deals
        </Link>
        {departments.map((d) => (
          <Link key={d.slug} href={`/s?i=${d.slug}`} className={link}>
            {d.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
