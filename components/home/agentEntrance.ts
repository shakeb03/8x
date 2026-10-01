// Choreographs the switch from the classic homepage into Agentic Search:
// product images lift off the page, swirl around the viewport, then settle
// into the agent landing's collage. Built on the Web Animations API.

const BOX = 140; // px; clones are laid out at this size and scaled
const MAX_CLONES = 12;
const MIN_CLONES = 8;
const SWIRL_MS = 620;
const STAGGER_MS = 22;
const SETTLE_MS = 520;

type Clone = { el: HTMLImageElement; src: string; cx: number; cy: number };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** requestAnimationFrame, but never stalls if frames stop (e.g. a hidden tab). */
const nextFrame = () =>
  Promise.race([new Promise((r) => requestAnimationFrame(() => r(null))), wait(50)]);

/**
 * Waits for animations, but no longer than `ms`. Browsers pause animations
 * in hidden tabs, so anything still running at the deadline jumps to its end
 * rather than leaving the transition stuck.
 */
async function finishWithin(anims: Animation[], ms: number) {
  await Promise.race([Promise.all(anims.map((a) => a.finished)), wait(ms)]);
  for (const a of anims) {
    if (a.playState !== "finished") {
      try {
        a.finish();
      } catch {
        // finish() throws for infinite animations; ours are all finite.
      }
    }
  }
}

/** The original catalog path behind a next/image URL (or the src itself). */
function sourcePath(src: string): string {
  try {
    const url = new URL(src, location.href);
    return url.pathname === "/_next/image" ? (url.searchParams.get("url") ?? src) : url.pathname;
  } catch {
    return src;
  }
}

function visible(rect: DOMRect): boolean {
  return rect.width > 20 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
}

function makeClone(layer: HTMLElement, src: string, cx: number, cy: number, startScale: number): Clone {
  const el = document.createElement("img");
  el.src = src;
  el.alt = "";
  el.decoding = "async";
  Object.assign(el.style, {
    position: "absolute",
    left: `${cx - BOX / 2}px`,
    top: `${cy - BOX / 2}px`,
    width: `${BOX}px`,
    height: `${BOX}px`,
    objectFit: "contain",
    filter: "drop-shadow(0 18px 22px rgba(30,20,80,.22))",
    transform: `scale(${startScale})`,
    willChange: "transform, opacity",
  });
  layer.appendChild(el);
  return { el, src: sourcePath(src), cx, cy };
}

/**
 * Plays the entrance and calls `enter` (which must render the agent view
 * synchronously) at the midpoint, while the screen is covered.
 */
export async function playAgentEntrance(fallbackImages: string[], enter: () => void): Promise<void> {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || document.hidden || typeof Element.prototype.animate !== "function") {
    enter();
    scrollTo({ top: 0 });
    return;
  }

  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, { position: "fixed", inset: "0", zIndex: "100", pointerEvents: "none", overflow: "hidden" });
  const backdrop = document.createElement("div");
  backdrop.className = "agent-canvas";
  Object.assign(backdrop.style, { position: "absolute", inset: "0", opacity: "0" });
  overlay.appendChild(backdrop);
  document.body.appendChild(overlay);

  let entered = false;
  const hidden: HTMLElement[] = [];

  try {
    // 1. Lift the product images that are on screen right now.
    const clones: Clone[] = [];
    const onPage = [...document.querySelectorAll<HTMLImageElement>('[aria-label="Featured collections"] img')]
      .map((img) => ({ img, rect: img.getBoundingClientRect() }))
      .filter(({ img, rect }) => img.complete && visible(rect))
      // Main campaign images (with alt text) first, they're the ones that land.
      .sort((a, b) => Number(!!b.img.alt) - Number(!!a.img.alt))
      .slice(0, MAX_CLONES);
    for (const { img, rect } of onPage) {
      clones.push(makeClone(overlay, img.currentSrc || img.src, rect.left + rect.width / 2, rect.top + rect.height / 2, Math.min(rect.width, rect.height) / BOX));
    }
    // Top up from the edges if little is visible (scrolled down, small screens).
    const used = new Set(clones.map((c) => c.src));
    for (const src of fallbackImages) {
      if (clones.length >= MIN_CLONES) break;
      if (used.has(src)) continue;
      const side = clones.length % 4;
      const cx = side === 0 ? -BOX : side === 1 ? innerWidth + BOX : Math.random() * innerWidth;
      const cy = side === 2 ? -BOX : side === 3 ? innerHeight + BOX : Math.random() * innerHeight;
      clones.push(makeClone(overlay, `/_next/image?url=${encodeURIComponent(src)}&w=256&q=75`, cx, cy, 0.8));
      used.add(src);
    }

    // 2. Swirl around the centre while the agent canvas fades in over the page.
    const center = { x: innerWidth / 2, y: innerHeight / 2 };
    const radius = Math.min(innerWidth, innerHeight) * 0.3;
    const swirl = clones.map((c, i) => {
      const angle = (i / clones.length) * Math.PI * 2;
      const at = (turn: number, r: number) => ({
        x: center.x + Math.cos(angle + turn) * r - c.cx,
        y: center.y + Math.sin(angle + turn) * r - c.cy,
      });
      const a = at(Math.PI * 0.55, radius * 1.15);
      const b = at(Math.PI * 1.15, radius * 0.85);
      const spin = i % 2 ? 1 : -1;
      return c.el.animate(
        [
          { transform: c.el.style.transform },
          { transform: `translate(${a.x}px, ${a.y}px) scale(0.95) rotate(${spin * 18}deg)`, offset: 0.55 },
          { transform: `translate(${b.x}px, ${b.y}px) scale(0.85) rotate(${spin * 32}deg)` },
        ],
        { duration: SWIRL_MS, delay: i * STAGGER_MS, easing: "cubic-bezier(.45,0,.25,1)", fill: "forwards" },
      );
    });
    const cover = backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 380,
      delay: 120,
      easing: "ease-out",
      fill: "forwards",
    });
    await finishWithin([...swirl, cover], SWIRL_MS + clones.length * STAGGER_MS + 250);

    // 3. Swap views behind the cover.
    enter();
    entered = true;
    scrollTo({ top: 0 });
    await nextFrame();

    // 4. Settle each image onto its twin in the landing collage, if it has one.
    const spots = new Map<string, HTMLElement>();
    for (const wrapper of document.querySelectorAll<HTMLElement>(".agent-drift")) {
      const img = wrapper.querySelector("img");
      if (img) spots.set(sourcePath(img.currentSrc || img.src), wrapper);
    }
    const settle = clones.map((c, i) => {
      const anim = swirl[i];
      anim.commitStyles();
      anim.cancel();
      const spot = spots.get(c.src);
      spots.delete(c.src);
      const rect = spot?.getBoundingClientRect();
      if (spot && rect && rect.width > 0) {
        // Read the collage's opacity before hiding it, so the clone ends there.
        const endOpacity = Number(getComputedStyle(spot).opacity) || 1;
        spot.style.opacity = "0";
        hidden.push(spot);
        const x = rect.left + rect.width / 2 - c.cx;
        const y = rect.top + rect.height / 2 - c.cy;
        return c.el.animate(
          [
            { transform: c.el.style.transform, opacity: 1 },
            // Ends at the collage's own opacity so the handoff is invisible.
            { transform: `translate(${x}px, ${y}px) scale(${rect.width / BOX}) rotate(0deg)`, opacity: endOpacity },
          ],
          { duration: SETTLE_MS, delay: i * 12, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
        );
      }
      // No twin: drift into the centre and fade away.
      return c.el.animate(
        [
          { transform: c.el.style.transform, opacity: 1 },
          { transform: `translate(${center.x - c.cx}px, ${center.y - c.cy - 40}px) scale(0.3) rotate(0deg)`, opacity: 0 },
        ],
        { duration: SETTLE_MS * 0.8, delay: i * 12, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" },
      );
    });
    // The landing below uses the same canvas, so fading the cover reveals it.
    const reveal = backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 360,
      delay: SETTLE_MS * 0.45,
      easing: "ease-in",
      fill: "forwards",
    });
    await finishWithin([...settle, reveal], SETTLE_MS + clones.length * 12 + 250);
    await wait(30);
  } catch {
    // Animation is decoration; whatever happens, end up in the agent view.
  } finally {
    if (!entered) {
      enter();
      scrollTo({ top: 0 });
    }
    for (const el of hidden) el.style.opacity = "";
    overlay.remove();
  }
}
