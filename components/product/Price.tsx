import { formatPrice, priceParts } from "@/lib/format";

/** Amazon-style price: small superscript "$" and cents around a large whole number. */
export function Price({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  const { whole, fraction } = priceParts(value);
  const big = size === "lg" ? "text-[28px]" : "text-[22px]";
  return (
    <span className="inline-flex items-start leading-none text-ink" aria-label={formatPrice(value)}>
      <span className="mt-[3px] text-xs" aria-hidden>$</span>
      <span className={`${big} font-medium`} aria-hidden>{whole}</span>
      <span className="mt-[3px] text-xs" aria-hidden>{fraction}</span>
    </span>
  );
}

export function ListPrice({ value }: { value: number }) {
  return (
    <span className="text-xs text-muted">
      List: <span className="line-through">{formatPrice(value)}</span>
    </span>
  );
}
