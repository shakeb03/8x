import Image from "next/image";
import type { ReactNode } from "react";
import { SparkleIcon } from "@/components/icons";

// Where the floating product images sit around the headline (percentages).
const SPOTS = [
  { top: 8, left: 6, size: 150, tilt: -8 },
  { top: 52, left: 2, size: 120, tilt: 6 },
  { top: 70, left: 18, size: 140, tilt: -4 },
  { top: 14, left: 24, size: 96, tilt: 10 },
  { top: 6, left: 74, size: 140, tilt: 7 },
  { top: 48, left: 84, size: 150, tilt: -6 },
  { top: 72, left: 68, size: 120, tilt: 5 },
  { top: 22, left: 90, size: 96, tilt: -10 },
];

/** First screen: a quiet collage of products drifting around the prompt. */
export function AgentLanding({ images, children }: { images: string[]; children: ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-180px)] items-center justify-center overflow-hidden py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        {images.slice(0, SPOTS.length).map((src, i) => {
          const s = SPOTS[i];
          return (
            <div
              key={src}
              className="agent-drift absolute opacity-80"
              style={
                {
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: s.size,
                  height: s.size,
                  "--tilt": `${s.tilt}deg`,
                  animationDelay: `${i * -1.3}s`,
                } as React.CSSProperties
              }
            >
              <Image src={src} alt="" fill sizes="150px" className="object-contain drop-shadow-[0_18px_22px_rgba(30,20,80,.18)]" />
            </div>
          );
        })}
      </div>

      <div className="agent-rise relative z-10 flex w-full max-w-2xl flex-col items-center px-4 text-center">
        <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-agent text-white shadow-[0_10px_30px_rgba(91,63,214,.4)]">
          <SparkleIcon className="size-6" />
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#17122b] md:text-5xl">
          What are you shopping for?
        </h1>
        <p className="mt-3 max-w-md text-[#5f5a78]">
          Describe it the way you&apos;d tell a friend. The store rearranges itself around your answer.
        </p>
        <div className="mt-8 w-full">{children}</div>
      </div>
    </div>
  );
}
