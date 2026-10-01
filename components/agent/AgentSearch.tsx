"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AgentProductCard } from "@/components/agent/AgentProductCard";
import { ArrowUpIcon, ChevronIcon, SparkleIcon } from "@/components/icons";
import { askAgent } from "@/lib/agent/actions";
import { STARTER_PROMPTS } from "@/lib/agent/prompts";
import type { AgentContext, AgentReply } from "@/lib/agent/types";

type Turn =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "agent"; reply: AgentReply };

/** Conversational product search. Each message refines the previous context. */
export function AgentSearch({ onExit }: { onExit: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [context, setContext] = useState<AgentContext | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const nextId = useRef(0);
  /** The newest question, so it and its answer are in view together. */
  const latest = useRef<HTMLLIElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  // Keep the newest exchange in view.
  useEffect(() => {
    latest.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [turns.length, pending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || pending) return;
    setDraft("");
    setTurns((t) => [...t, { id: nextId.current++, role: "user", text: message }]);
    setPending(true);
    try {
      const reply = await askAgent(message, context);
      if (reply.context) setContext(reply.context);
      setTurns((t) => [...t, { id: nextId.current++, role: "agent", reply }]);
    } catch {
      setTurns((t) => [
        ...t,
        {
          id: nextId.current++,
          role: "agent",
          reply: { message: "Something went wrong. Please try again.", products: [], context: null, suggestions: [] },
        },
      ]);
    } finally {
      setPending(false);
      input.current?.focus();
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const restart = () => {
    setTurns([]);
    setContext(null);
    setDraft("");
    input.current?.focus();
  };

  const started = turns.length > 0;

  const composer = (
    <form onSubmit={onSubmit} className="relative w-full">
      <label htmlFor="agent-input" className="sr-only">
        Describe what you&apos;re looking for
      </label>
      <input
        id="agent-input"
        ref={input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={300}
        autoComplete="off"
        placeholder={started ? "Refine: “cheaper”, “under $100”, “only Apple”…" : "Describe what you want, like “a gift for a coffee lover under $50”"}
        className="h-14 w-full rounded-2xl border border-[#d9d2f7] bg-white pr-14 pl-5 text-base text-[#1b1530] shadow-[0_4px_20px_rgba(60,30,160,.08)] outline-none placeholder:text-[#9a95ad] focus:border-agent focus:ring-4 focus:ring-agent/15"
      />
      <button
        type="submit"
        disabled={!draft.trim() || pending}
        aria-label="Send"
        className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-agent text-white transition-colors hover:bg-agent-hover disabled:bg-[#d9d2f7]"
      >
        <ArrowUpIcon className="size-5" />
      </button>
    </form>
  );

  const chip =
    "rounded-full border border-[#d9d2f7] bg-white/80 px-3.5 py-1.5 text-sm text-[#3b2f7a] transition-colors hover:border-agent hover:bg-white disabled:opacity-50";

  return (
    <div className="min-h-[calc(100dvh-140px)] bg-[radial-gradient(1200px_500px_at_50%_-10%,#e9e3ff,transparent),linear-gradient(#faf9ff,#f6f8ff)]">
      <div className="mx-auto flex max-w-5xl flex-col px-4 pb-6">
        {/* Mode bar */}
        <div className="flex items-center justify-between py-4">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1 text-sm text-[#4a3a9c] hover:text-agent"
          >
            <ChevronIcon direction="left" className="size-4" /> Back to classic shopping
          </button>
          <div className="flex items-center gap-3">
            {started && (
              <button type="button" onClick={restart} className="text-sm text-[#4a3a9c] hover:text-agent">
                New search
              </button>
            )}
            <span className="flex items-center gap-1 rounded-full bg-agent-soft px-2.5 py-1 text-xs font-semibold text-agent">
              <SparkleIcon className="size-3.5" /> Agentic Search · beta
            </span>
          </div>
        </div>

        {!started ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center pt-12 pb-16 text-center md:pt-20">
            <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-agent text-white shadow-[0_8px_24px_rgba(91,63,214,.35)]">
              <SparkleIcon className="size-6" />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#1b1530] md:text-4xl">
              What are you shopping for?
            </h1>
            <p className="mt-2 max-w-md text-[#6b6684]">
              Describe it the way you&apos;d tell a friend. Mention a budget, a brand, or who it&apos;s for, then
              refine as you go.
            </p>
            <div className="mt-8 w-full">{composer}</div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((p) => (
                <button key={p} type="button" onClick={() => send(p)} className={chip}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <ol className="flex flex-col gap-6 pb-6" aria-live="polite">
              {turns.map((turn, i) => {
                const isLatest = i === turns.length - 1;
                const isLastQuestion = turn.role === "user" && !turns.slice(i + 1).some((t) => t.role === "user");
                return (
                  <li key={turn.id} ref={isLastQuestion ? latest : undefined} className="scroll-mt-4">
                    {turn.role === "user" ? (
                      <div className="flex justify-end">
                        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-agent px-4 py-2.5 text-white">
                          {turn.text}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-agent text-white">
                            <SparkleIcon className="size-4" />
                          </span>
                          <p className="text-[15px] leading-relaxed text-[#1b1530]">{turn.reply.message}</p>
                        </div>
                        {turn.reply.products.length > 0 && (
                          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {turn.reply.products.map((p) => (
                              <li key={p.slug} className="grid">
                                <AgentProductCard product={p} />
                              </li>
                            ))}
                          </ul>
                        )}
                        {isLatest && turn.reply.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pl-10">
                            {turn.reply.suggestions.map((s) => (
                              <button key={s} type="button" onClick={() => send(s)} disabled={pending} className={chip}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
              {pending && (
                <li className="flex items-center gap-3 text-sm text-[#6b6684]" role="status">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-agent-soft text-agent">
                    <SparkleIcon className="size-4 animate-pulse" />
                  </span>
                  Looking through the catalog…
                </li>
              )}
            </ol>

            <div className="sticky bottom-4 z-10">{composer}</div>
          </>
        )}
      </div>
    </div>
  );
}
