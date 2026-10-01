"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Desktop: vertical thumbnail rail beside a large image; hovering or clicking
 * a thumbnail swaps the main image. Mobile: thumbnails sit below.
 */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const multiple = images.length > 1;

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {multiple && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Product images">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active || undefined}
                className={`relative block size-14 overflow-hidden rounded-md border bg-white md:size-12 ${
                  i === active
                    ? "border-[#007185] shadow-[0_0_3px_2px_rgba(228,121,17,.5)]"
                    : "border-[#d5d9d9] hover:border-[#007185]"
                }`}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
        <Image
          key={images[active]}
          src={images[active]}
          alt={multiple ? `${title}, image ${active + 1} of ${images.length}` : title}
          fill
          preload={active === 0}
          sizes="(min-width: 1024px) 480px, 100vw"
          className="object-contain p-4"
        />
      </div>
    </div>
  );
}
