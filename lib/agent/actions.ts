"use server";

import { respond } from "./engine";
import type { AgentContext, AgentReply, AgentSort } from "./types";

const SORTS: AgentSort[] = ["relevance", "price-asc", "price-desc", "rating"];

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const numOrNull = (v: unknown) => (isNum(v) ? v : null);
const strings = (v: unknown, max = 20) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, max) : [];

/** The context round-trips through the browser, so rebuild it from known fields only. */
function sanitizeContext(raw: unknown): AgentContext | null {
  if (!raw || typeof raw !== "object") return null;
  const { intent, shownPrices } = raw as Record<string, unknown>;
  if (!intent || typeof intent !== "object") return null;
  const i = intent as Record<string, unknown>;
  return {
    intent: {
      topic: typeof i.topic === "string" ? i.topic.slice(0, 200) : "",
      concepts: Array.isArray(i.concepts) ? i.concepts.slice(0, 12).map((g) => strings(g)) : [],
      categories: strings(i.categories),
      minPrice: numOrNull(i.minPrice),
      maxPrice: numOrNull(i.maxPrice),
      brands: strings(i.brands),
      excludeBrands: strings(i.excludeBrands),
      minRating: numOrNull(i.minRating),
      deals: i.deals === true,
      sort: SORTS.includes(i.sort as AgentSort) ? (i.sort as AgentSort) : "relevance",
    },
    shownPrices: Array.isArray(shownPrices) ? shownPrices.filter(isNum).slice(0, 12) : [],
  };
}

export async function askAgent(message: string, context: unknown): Promise<AgentReply> {
  const text = typeof message === "string" ? message.trim().slice(0, 300) : "";
  return respond(text, sanitizeContext(context));
}
