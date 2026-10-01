import Link from "next/link";
import { BRAND, DEPARTMENTS } from "@/lib/site";

const columns = [
  {
    title: "Shop by Department",
    links: DEPARTMENTS.map((d) => ({ label: d.name, href: `/s?i=${d.slug}` })),
  },
  {
    title: "Let Us Help You",
    links: [
      { label: "Your Account", href: "/account" },
      { label: "Your Orders", href: "/orders" },
      { label: "Your Cart", href: "/cart" },
      { label: "Today's Deals", href: "/deals" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-8 text-white">
      <a href="#top" className="block bg-nav-3 py-4 text-center text-[13px] hover:bg-nav-4">
        Back to top
      </a>

      <div className="bg-nav-2">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-8 px-6 py-10 sm:gap-16">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="mb-2 font-bold">{col.title}</h2>
              <ul className="space-y-2 text-sm text-[#ddd]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 border-t border-nav-3 bg-nav py-6 text-xs text-[#ddd]">
        <span className="font-display text-xl font-extrabold text-white">{BRAND}</span>
        <span>A 24-hour build. Product data from DummyJSON.</span>
      </div>
    </footer>
  );
}
