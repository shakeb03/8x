"use client";

import { useEffect, useState } from "react";

/**
 * Samples a product image (via a tiny optimized copy) and returns a soft
 * average of its visible, non-white pixels, used to tint the agent canvas.
 */
export function useAmbientColor(src: string | undefined): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`;
    img.onload = () => {
      if (cancelled) return;
      const size = 32;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const [pr, pg, pb, pa] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (pa < 128) continue; // transparent background
        if (pr > 235 && pg > 235 && pb > 235) continue; // near-white
        r += pr; g += pg; b += pb; n++;
      }
      if (!n) return setColor(null);
      // Lift toward a pastel so text on top stays readable.
      const mix = (c: number) => Math.round((c / n) * 0.7 + 255 * 0.3);
      setColor(`rgb(${mix(r)} ${mix(g)} ${mix(b)})`);
    };
    return () => {
      cancelled = true;
    };
  }, [src]);

  return color;
}
