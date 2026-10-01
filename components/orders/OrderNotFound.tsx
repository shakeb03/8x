import Link from "next/link";

export function OrderNotFound() {
  return (
    <div className="rounded-lg bg-white p-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">We couldn&apos;t find that order</h1>
      <p className="mt-2 text-sm">
        Orders are saved in this browser only, so they won&apos;t appear on other devices or after clearing site
        data.{" "}
        <Link href="/orders" className="text-link hover:text-link-hover hover:underline">
          See your orders
        </Link>
        .
      </p>
    </div>
  );
}
