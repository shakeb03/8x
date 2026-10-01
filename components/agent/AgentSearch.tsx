"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AgentComposer, chipCls } from "@/components/agent/AgentComposer";
import { AgentHero } from "@/components/agent/AgentHero";
import { AgentLanding } from "@/components/agent/AgentLanding";
import { AgentProductView } from "@/components/agent/AgentProductView";
import { AgentTile } from "@/components/agent/AgentTile";
import { useAmbientColor } from "@/components/agent/useAmbientColor";
import { whyThisPick } from "@/components/agent/whyThisPick";
import { ChevronIcon, SparkleIcon } from "@/components/icons";
import { askAgent } from "@/lib/agent/actions";
import { getAgentProductDetail } from "@/lib/agent/product";
import { STARTER_PROMPTS } from "@/lib/agent/prompts";
import type { AgentContext, AgentProductDetail, AgentReply } from "@/lib/agent/types";

type Step = { id: number; query: string; reply: AgentReply };

/**
 * Desktop mosaic placements by number of secondary results, on a 2×3 grid.
 * Listed literally so Tailwind can see the classes.
 */
const MOSAIC: Record<number, string[]> = {
  1: ["md:col-span-2 md:row-span-3"],
  2: ["md:row-span-3", "md:row-span-3"],
  3: ["md:col-span-2", "md:row-span-2", "md:row-span-2"],
  4: ["md:row-span-2", "", "", "md:col-span-2"],
  5: ["md:row-span-2", "", "", "", ""],
};

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };

/**
 * Runs a state update inside a View Transition when the browser supports it.
 * Transitions can be skipped (hidden tab, a newer transition starting); the
 * update still applies, so those rejections are expected and ignored.
 */
function withTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduced || document.hidden) return update();
  const t = doc.startViewTransition(() => flushSync(update));
  for (const p of [t.ready, t.finished, t.updateCallbackDone]) p.catch(() => {});
}

/**
 * Agentic Search, shown as a storefront that rearranges itself: the focused
 * result is the hero, the rest form a mosaic around it, and the conversation
 * is reduced to a trail of queries plus a floating prompt.
 */
export function AgentSearch({ onExit, ambientImages }: { onExit: () => void; ambientImages: string[] }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [active, setActive] = useState(-1);
  const [focus, setFocus] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  /** Slug of the product open in the focused view, if any. */
  const [viewing, setViewing] = useState<string | null>(null);
  /** Fetched product details: missing = loading, null = failed or not found. */
  const [details, setDetails] = useState<Record<string, AgentProductDetail | null>>({});
  const nextId = useRef(0);
  /** Identifies the latest request; bumping it makes an in-flight reply stale. */
  const requestId = useRef(0);
  /** Synchronous guard, since `pending` can be stale on a quick double submit. */
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const canvas = useRef<HTMLDivElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  // The product view is a browser history entry, so Back returns to results.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const slug = (e.state as { agentProduct?: string | null } | null)?.agentProduct ?? null;
      withTransition(() => setViewing(slug));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const step = steps[active];
  const products = step?.reply.products ?? [];
  const hero = products.find((p) => p.slug === focus) ?? products[0];
  const others = products.filter((p) => p !== hero);
  const viewed = viewing ? products.find((p) => p.slug === viewing) : undefined;
  const ambient = useAmbientColor((viewed ?? hero)?.image);

  const openProduct = (slug: string) => {
    const state = { ...window.history.state, agentProduct: slug };
    if (viewing) window.history.replaceState(state, "");
    else window.history.pushState(state, "");
    // The opened product also becomes the hero, so going back lands on it.
    withTransition(() => {
      setViewing(slug);
      setFocus(slug);
    });
    canvas.current?.scrollIntoView({ block: "start" });
    // Fetch once per product; a previous failure (null) is retried.
    if (!details[slug]) {
      setDetails((m) => {
        const next = { ...m };
        delete next[slug]; // back to "loading"
        return next;
      });
      getAgentProductDetail(slug)
        .then((d) => setDetails((m) => ({ ...m, [slug]: d })))
        .catch(() => setDetails((m) => ({ ...m, [slug]: null })));
    }
  };

  const closeProduct = () => {
    if (window.history.state?.agentProduct) window.history.back(); // popstate closes it
    else withTransition(() => setViewing(null));
  };

  /** Leaves the product view without adding history (new search, trail jump). */
  const dropProductView = () => {
    if (!viewing) return;
    window.history.replaceState({ ...window.history.state, agentProduct: null }, "");
    setViewing(null);
  };

  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProduct();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /** Latest context at or before a step (replies that weren't understood carry none). */
  const contextAt = (index: number): AgentContext | null => {
    for (let i = index; i >= 0; i--) if (steps[i].reply.context) return steps[i].reply.context;
    return null;
  };

  const send = async (text: string) => {
    const query = text.trim();
    if (!query || busy.current) return;
    busy.current = true;
    const id = ++requestId.current;
    const base = active;
    setPending(query);
    let reply: AgentReply;
    try {
      reply = await askAgent(query, contextAt(base));
    } catch {
      reply = { message: "Something went wrong. Please try again.", products: [], context: null, suggestions: [] };
    }
    // The shopper moved on (new search, trail jump) while this was loading.
    if (id !== requestId.current) return;
    busy.current = false;
    withTransition(() => {
      dropProductView();
      // Asking from an earlier step discards the steps after it.
      setSteps((s) => [...s.slice(0, base + 1), { id: nextId.current++, query, reply }]);
      setActive(base + 1);
      setFocus(null);
      setPending(null);
    });
    caption.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    input.current?.focus();
  };

  /** Abandons any in-flight request; its reply will be ignored. */
  const cancelPending = () => {
    requestId.current++;
    busy.current = false;
    setPending(null);
  };

  const goTo = (index: number) =>
    withTransition(() => {
      cancelPending();
      dropProductView();
      setActive(index);
      setFocus(null);
    });

  const restart = () => {
    cancelPending();
    dropProductView();
    setSteps([]);
    setActive(-1);
    setFocus(null);
  };

  return (
    <div
      ref={canvas}
      className="agent-canvas relative isolate min-h-[calc(100dvh-99px)] scroll-mt-0 overflow-x-clip"
      style={{ "--ambient": ambient ?? "#e9e4ff" } as React.CSSProperties}
    >
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        {/* Mode bar + query trail */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1 text-sm text-[#43358f] hover:text-agent"
          >
            <ChevronIcon direction="left" className="size-4" /> Classic shopping
          </button>

          {steps.length > 0 && (
            <nav
              aria-label="Your searches"
              className="no-scrollbar order-last flex w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1"
            >
              {steps.map((s, i) => (
                <span key={s.id} className="flex shrink-0 items-center gap-1">
                  {i > 0 && <ChevronIcon className="size-3 text-[#a59fc0]" />}
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === active ? "step" : undefined}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      i === active
                        ? "bg-[#17122b] text-white"
                        : i < active
                          ? "bg-white/70 text-[#3b2f7a] hover:bg-white"
                          : "bg-white/40 text-[#8d88a3] hover:bg-white/70"
                    }`}
                  >
                    {s.query}
                  </button>
                </span>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            {steps.length > 0 && (
              <button type="button" onClick={restart} className="text-sm text-[#43358f] hover:text-agent">
                New search
              </button>
            )}
            <span className="hidden items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-agent backdrop-blur sm:flex">
              <SparkleIcon className="size-3.5" /> Agentic Search · beta
            </span>
          </div>
        </div>

        {!step ? (
          <AgentLanding images={ambientImages}>
            <AgentComposer
              variant="hero"
              inputRef={input}
              onSend={send}
              pending={pending !== null}
              suggestions={STARTER_PROMPTS}
              placeholder="Describe what you want, like “a gift for a coffee lover under $50”"
            />
            {pending && (
              <p className="mt-4 text-sm text-[#5f5a78]" role="status">
                Arranging the store around “{pending}”…
              </p>
            )}
          </AgentLanding>
        ) : viewed ? (
          <>
            <div
              className={`transition-[opacity,filter] duration-300 ${pending ? "pointer-events-none opacity-50 blur-[2px]" : ""}`}
              aria-busy={pending !== null}
            >
              <AgentProductView
                product={viewed}
                detail={details[viewed.slug]}
                reasons={whyThisPick(viewed, step.reply.context?.intent ?? null, products)}
                others={products.filter((p) => p !== viewed)}
                onBack={closeProduct}
                onOpen={openProduct}
              />
            </div>
            {/* Still searchable from here; sending returns to results. */}
            <div className="sticky bottom-0 z-20 mx-auto max-w-2xl pt-6 pb-4 before:pointer-events-none before:absolute before:inset-x-[-50vw] before:top-0 before:bottom-0 before:-z-10 before:bg-gradient-to-t before:from-[#f6f5fb] before:via-[#f6f5fb]/85 before:to-transparent">
              <AgentComposer
                variant="dock"
                inputRef={input}
                onSend={send}
                pending={pending !== null}
                suggestions={[]}
                placeholder="Keep shopping: “cheaper”, “only Apple”, or something new…"
              />
            </div>
          </>
        ) : (
          <>
            {/* The agent's reply, as a caption rather than a chat bubble */}
            <p
              key={step.id}
              ref={caption}
              aria-live="polite"
              className="agent-rise flex scroll-mt-4 items-start gap-2 pb-4 text-[15px] text-[#2a2342] md:text-base"
            >
              <SparkleIcon className="mt-1 size-4 shrink-0 text-agent" />
              <span>{pending ? `Rearranging for “${pending}”…` : step.reply.message}</span>
            </p>

            <div
              className={`transition-[opacity,filter] duration-300 ${pending ? "pointer-events-none opacity-50 blur-[2px]" : ""}`}
              aria-busy={pending !== null}
            >
              {hero ? (
                <div
                  className={`grid gap-4 md:h-[clamp(440px,calc(100dvh-360px),680px)] ${
                    others.length ? "md:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]" : "md:mx-auto md:max-w-4xl"
                  }`}
                >
                  <AgentHero product={hero} onOpen={() => openProduct(hero.slug)} />
                  {others.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 md:h-full md:grid-rows-3 md:gap-2.5">
                      {others.map((p, i) => (
                        <AgentTile
                          key={`${step.id}-${p.slug}`}
                          product={p}
                          index={i}
                          onFocus={() => withTransition(() => setFocus(p.slug))}
                          className={`aspect-square md:aspect-auto ${MOSAIC[others.length]?.[i] ?? ""}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="agent-rise mx-auto my-10 max-w-xl rounded-3xl bg-white/70 p-8 text-center ring-1 ring-white/70 backdrop-blur-xl">
                  <SparkleIcon className="mx-auto mb-3 size-6 text-agent" />
                  <p className="text-[#2a2342]">Try one of these, or describe it another way.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {step.reply.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => send(s)} className={chipCls}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Floating prompt */}
            {/* The fade behind it keeps chips legible over content scrolling beneath. */}
            <div className="sticky bottom-0 z-20 mx-auto max-w-2xl pt-6 pb-4 before:pointer-events-none before:absolute before:inset-x-[-50vw] before:top-0 before:bottom-0 before:-z-10 before:bg-gradient-to-t before:from-[#f6f5fb] before:via-[#f6f5fb]/85 before:to-transparent">
              <AgentComposer
                variant="dock"
                inputRef={input}
                onSend={send}
                pending={pending !== null}
                suggestions={hero ? step.reply.suggestions : []}
                placeholder="Refine: “cheaper”, “under $100”, “only Apple”…"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
