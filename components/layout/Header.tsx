import Link from "next/link";
import { CaretDownIcon, ChevronIcon, PinIcon, UserIcon } from "@/components/icons";
import { DEPARTMENTS } from "@/lib/site";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { SubNav } from "./SubNav";

const navItem =
  "flex shrink-0 flex-col justify-center rounded-sm border border-transparent px-2 py-1.5 leading-tight hover:border-white";

const departments = DEPARTMENTS.map(({ slug, name }) => ({ slug, name }));

export function Header() {
  return (
    <header className="text-white">
      <div className="bg-nav">
        <div className="flex h-[60px] items-center gap-1 px-2 md:gap-2 md:px-3">
          <Logo />

          <button type="button" className={`${navItem} hidden lg:flex`}>
            <span className="pl-4 text-xs text-[#ccc]">Deliver to</span>
            <span className="flex items-center gap-0.5 text-sm font-bold">
              <PinIcon className="-ml-0.5 size-4" />
              Canada
            </span>
          </button>

          <div className="hidden flex-1 px-2 md:block">
            <SearchBar departments={departments} />
          </div>

          <div className="ml-auto flex items-center md:ml-0">
            <Link href="/account" className={`${navItem} hidden md:flex`}>
              <span className="text-xs">Hello, sign in</span>
              <span className="flex items-center gap-1 text-sm font-bold">
                Account &amp; Lists <CaretDownIcon className="size-2 text-[#a7acb2]" />
              </span>
            </Link>

            <Link href="/account" className={`${navItem} flex-row items-center gap-1 text-sm md:hidden`}>
              Sign in <ChevronIcon className="size-3" />
              <UserIcon className="size-6" />
            </Link>

            <Link href="/orders" className={`${navItem} hidden md:flex`}>
              <span className="text-xs">Returns</span>
              <span className="text-sm font-bold">&amp; Orders</span>
            </Link>

            <CartButton />
          </div>
        </div>

        {/* On small screens the search drops to its own full-width row. */}
        <div className="px-3 pb-2.5 md:hidden">
          <SearchBar departments={departments} />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-nav-3 px-3 py-2 text-sm md:hidden">
        <PinIcon className="size-4" />
        Deliver to Canada
      </div>

      <SubNav departments={departments} />
    </header>
  );
}
