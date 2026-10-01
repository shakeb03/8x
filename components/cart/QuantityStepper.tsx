"use client";

import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

type Props = {
  quantity: number;
  max: number;
  title: string;
  onChange: (quantity: number) => void;
  onRemove: () => void;
};

/** Amazon-style pill stepper: trash replaces minus at quantity 1. */
export function QuantityStepper({ quantity, max, title, onChange, onRemove }: Props) {
  const btn =
    "flex size-8 items-center justify-center rounded-full text-ink hover:bg-[#fff3cd] disabled:cursor-not-allowed disabled:text-[#c5c5c5] disabled:hover:bg-transparent";

  return (
    <div className="inline-flex items-center rounded-full border-[3px] border-cta bg-white">
      {quantity <= 1 ? (
        <button type="button" onClick={onRemove} aria-label={`Remove ${title} from cart`} className={btn}>
          <TrashIcon className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onChange(quantity - 1)}
          aria-label={`Decrease quantity of ${title}`}
          className={btn}
        >
          <MinusIcon className="size-4" />
        </button>
      )}
      <span className="min-w-8 text-center text-sm font-bold" aria-live="polite" aria-label={`Quantity ${quantity}`}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label={`Increase quantity of ${title}`}
        className={btn}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
