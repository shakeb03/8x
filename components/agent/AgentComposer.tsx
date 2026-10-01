"use client";

import { useState, type FormEvent, type Ref } from "react";
import { ArrowUpIcon } from "@/components/icons";

type Props = {
  onSend: (text: string) => void;
  pending: boolean;
  placeholder: string;
  suggestions: string[];
  /** "dock" floats over results; "hero" sits in the landing view. */
  variant: "dock" | "hero";
  inputRef?: Ref<HTMLInputElement>;
};

export const chipCls =
  "shrink-0 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-sm text-[#3b2f7a] backdrop-blur transition-colors hover:border-agent hover:bg-white disabled:opacity-50";

/** Prompt input plus suggestion chips. Holds its own draft text. */
export function AgentComposer({ onSend, pending, placeholder, suggestions, variant, inputRef }: Props) {
  const [draft, setDraft] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || pending) return;
    onSend(draft);
    setDraft("");
  };

  const chips = suggestions.length > 0 && (
    <div
      className={`no-scrollbar flex gap-2 ${variant === "dock" ? "overflow-x-auto pb-1" : "flex-wrap justify-center"}`}
    >
      {suggestions.map((s) => (
        <button key={s} type="button" onClick={() => onSend(s)} disabled={pending} className={chipCls}>
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {variant === "dock" && chips}
      <form onSubmit={submit} className="relative">
        <label htmlFor="agent-input" className="sr-only">
          Describe what you&apos;re looking for
        </label>
        <input
          id="agent-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={300}
          autoComplete="off"
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl border border-white/80 bg-white/85 pr-14 pl-5 text-base text-[#17122b] shadow-[0_10px_40px_rgba(40,20,120,.14)] backdrop-blur-xl outline-none placeholder:text-[#8d88a3] focus:border-agent focus:ring-4 focus:ring-agent/15"
        />
        <button
          type="submit"
          disabled={!draft.trim() || pending}
          aria-label="Send"
          className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-agent text-white transition-colors hover:bg-agent-hover disabled:bg-[#d9d2f7]"
        >
          {pending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          ) : (
            <ArrowUpIcon className="size-5" />
          )}
        </button>
      </form>
      {variant === "hero" && chips}
    </div>
  );
}
