import Link from "next/link";
import { DEPARTMENTS } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
        Sorry, we couldn&apos;t find that page
      </h1>
      <p className="mt-3 text-muted">
        The item may have been removed, or the link may be wrong. Try searching, or browse a department.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {DEPARTMENTS.map((d) => (
          <Link
            key={d.slug}
            href={`/s?i=${d.slug}`}
            className="rounded-full border border-[#d5d9d9] bg-white px-3 py-1 text-sm hover:bg-[#f7fafa]"
          >
            {d.name}
          </Link>
        ))}
      </div>
      <Link href="/" className="mt-6 inline-block text-sm text-link hover:text-link-hover hover:underline">
        Go to the homepage
      </Link>
    </div>
  );
}
