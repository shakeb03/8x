"use client";

import { useState, type ReactNode } from "react";
import { AgentSearch } from "@/components/agent/AgentSearch";
import { SparkleIcon } from "@/components/icons";

/**
 * Switches the homepage between the classic storefront (server-rendered,
 * passed in as children) and the Agentic Search experience.
 */
export function HomeExperience({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState(false);

  const toggle = (on: boolean) => {
    setAgent(on);
    window.scrollTo({ top: 0 });
  };

  if (agent) return <AgentSearch onExit={() => toggle(false)} />;

  return (
    <>
      <div className="mx-auto max-w-[1500px] px-3 pt-4 md:px-5">
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl bg-[linear-gradient(110deg,#2a1a6e,#5b3fd6_55%,#8a6cf0)] px-5 py-4 text-white sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <SparkleIcon className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Shop by describing what you want</p>
              <p className="text-sm text-white/80">Tell us your budget, brand or who it&apos;s for, and refine as you go.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggle(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-agent shadow-sm transition-transform hover:scale-[1.03]"
          >
            <SparkleIcon className="size-4" /> Try Agentic Search
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
