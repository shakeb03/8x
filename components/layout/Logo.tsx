import Link from "next/link";
import { BRAND } from "@/lib/site";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label={`${BRAND} home`}
      className="flex shrink-0 flex-col items-start rounded-sm border border-transparent px-2 pt-1 pb-2 hover:border-white"
    >
      <span className="font-display text-[28px] leading-none font-extrabold tracking-tight text-white">
        {BRAND}
      </span>
      <svg viewBox="0 0 60 10" className="-mt-0.5 h-2.5 w-14 text-badge" aria-hidden>
        <path d="M2 3c14 7 38 7 54 0" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      </svg>
    </Link>
  );
}
