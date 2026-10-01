// Shapes shared by the agent engine (server) and the agent UI (client).

export type AgentSort = "relevance" | "price-asc" | "price-desc" | "rating";

/** What the shopper is asking for, accumulated across follow-ups. */
export type AgentIntent = {
  /** Plain-language summary of the subject, e.g. "wireless headphones". */
  topic: string;
  /** Concept groups: each inner array is a set of interchangeable search terms. */
  concepts: string[][];
  /** Catalog categories the request points at (e.g. "phone" → smartphones). */
  categories: string[];
  minPrice: number | null;
  maxPrice: number | null;
  brands: string[];
  excludeBrands: string[];
  minRating: number | null;
  deals: boolean;
  sort: AgentSort;
};

/** Carried between turns so follow-ups like "cheaper" have something to refine. */
export type AgentContext = {
  intent: AgentIntent;
  shownPrices: number[];
};

export type AgentProduct = {
  slug: string;
  title: string;
  brand: string | null;
  image: string;
  price: number;
  listPrice: number | null;
  rating: number;
  ratingCount: number;
  highlights: string[];
};

export type AgentReply = {
  message: string;
  products: AgentProduct[];
  /** null when there's nothing to refine (e.g. the message wasn't understood). */
  context: AgentContext | null;
  suggestions: string[];
};
