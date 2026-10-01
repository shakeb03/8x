// Rule-based "agentic" search: turns a plain-language request (and follow-ups
// like "cheaper" or "only Apple") into structured intent, then picks a few
// products from the local catalog. No LLM; everything here is deterministic,
// so the same function signature can later be backed by a model.

import { getPopularity, getProducts, getRatingCount } from "../catalog";
import { deliveryDate, isFastShipping } from "../delivery";
import { formatPrice, listPrice, savingsPercent } from "../format";
import { matchConcepts, tokenize } from "../search";
import { UNFEATURED_CATEGORIES } from "../site";
import type { Product } from "../types";
import { STARTER_PROMPTS } from "./prompts";
import type { AgentContext, AgentIntent, AgentProduct, AgentReply, AgentSort } from "./types";

const MAX_RESULTS = 6;

// --- Vocabulary --------------------------------------------------------------

/**
 * Words that carry no product meaning in a request. Matched after stemming,
 * so "looking" and "options" are covered by their stems too.
 */
const STOPWORDS = new Set(
  tokenize(
    `i im i'm me my we our you your want wants need needs looking look find show get buy buying
     shop shopping for a an the some something anything any to of with and or that this these those
     is are be it its in on at please can could would should will like likes love loves into
     good nice great best top really very new kind sort type around maybe them one ones also
     what about how which option item product stuff thing gift present someone who
     under over below above less more than only just from by brand dollar buck price priced
     cheap cheaper cheapest expensive pricier premium budget affordable rated rating stars star
     sale deal deals discount discounted between max min maximum minimum up no not except without
     dad mom mother father friend wife husband son daughter boyfriend girlfriend kid kids him her
     work everyday daily use using occasion`,
  ),
);

/** Everyday words → terms that actually appear in the catalog. */
const SYNONYMS: Record<string, string[]> = {
  headphone: ["headphone", "earphone", "airpod", "audio"],
  earbud: ["earphone", "airpod", "earbud"],
  earphone: ["earphone", "airpod"],
  audio: ["audio", "headphone", "earphone", "airpod", "speaker"],
  speaker: ["speaker", "homepod", "echo"],
  phone: ["phone", "smartphone", "iphone"],
  smartphone: ["smartphone", "phone", "iphone"],
  laptop: ["laptop", "macbook", "notebook"],
  computer: ["laptop", "macbook"],
  tablet: ["tablet", "ipad"],
  charger: ["charger", "charging", "battery"],
  sneaker: ["sneaker", "shoe"],
  shoe: ["shoe", "sneaker", "heel", "slipper", "cleat"],
  perfume: ["perfume", "fragrance", "eau"],
  cologne: ["fragrance", "perfume"],
  fragrance: ["fragrance", "perfume"],
  makeup: ["makeup", "lipstick", "mascara", "eyeshadow", "powder", "nail"],
  skincare: ["skin", "lotion", "soap", "wash"],
  watch: ["watch", "timepiece"],
  sunglass: ["sunglass", "eyewear"],
  glasses: ["sunglass", "eyewear"],
  bag: ["bag", "handbag", "backpack"],
  purse: ["handbag", "bag"],
  jewelry: ["jewellery", "earring"],
  jewellery: ["jewellery", "earring"],
  dress: ["dress", "frock", "gown"],
  shirt: ["shirt", "tshirt"],
  cooking: ["kitchen", "cookware", "pan", "wok", "knife", "spatula"],
  cook: ["kitchen", "cookware", "pan", "wok", "knife", "spatula"],
  chef: ["kitchen", "cookware", "knife", "pan"],
  kitchen: ["kitchen", "cookware", "utensil"],
  baking: ["baking", "kitchen"],
  furniture: ["furniture", "sofa", "bed", "chair", "table"],
  couch: ["sofa"],
  sofa: ["sofa"],
  chair: ["chair"],
  decor: ["decor", "decoration", "lamp", "plant", "frame"],
  home: ["home", "decor", "decoration", "furniture"],
  lamp: ["lamp", "lighting"],
  fitness: ["sport", "ball", "racket"],
  gym: ["sport", "ball"],
  workout: ["sport", "ball"],
  sport: ["sport", "ball", "racket", "bat"],
  sporty: ["sport"],
  ball: ["ball"],
  fruit: ["fruit", "apple", "kiwi", "mulberry", "strawberry"],
  vegetable: ["vegetable", "cucumber", "potato"],
  food: ["grocery", "food", "fruit", "vegetable", "meat"],
  grocery: ["grocery", "food"],
  snack: ["grocery", "food", "dessert"],
  coffee: ["coffee"],
  pet: ["pet", "cat", "dog"],
  car: ["car", "vehicle", "sedan", "suv"],
  motorcycle: ["motorcycle", "bike", "sportbike"],
};

/**
 * Product words that name a catalog category. When any result falls in the
 * hinted categories, results stay there, so "a phone" returns phones rather
 * than chargers and cases that mention "iPhone".
 */
const CATEGORY_HINTS: Record<string, string[]> = {
  phone: ["smartphones"],
  smartphone: ["smartphones"],
  laptop: ["laptops"],
  computer: ["laptops"],
  tablet: ["tablets"],
  perfume: ["fragrances"],
  cologne: ["fragrances"],
  fragrance: ["fragrances"],
  sunglass: ["sunglasses"],
  glasses: ["sunglasses"],
  watch: ["mens-watches", "womens-watches"],
  shoe: ["mens-shoes", "womens-shoes"],
  sneaker: ["mens-shoes", "womens-shoes"],
  dress: ["womens-dresses", "tops"],
  shirt: ["mens-shirts"],
  bag: ["womens-bags"],
  purse: ["womens-bags"],
  jewelry: ["womens-jewellery"],
  jewellery: ["womens-jewellery"],
  makeup: ["beauty"],
  skincare: ["skin-care"],
  furniture: ["furniture"],
  couch: ["furniture"],
  sofa: ["furniture"],
  decor: ["home-decoration"],
  cooking: ["kitchen-accessories"],
  cook: ["kitchen-accessories"],
  chef: ["kitchen-accessories"],
  kitchen: ["kitchen-accessories"],
  baking: ["kitchen-accessories"],
  headphone: ["mobile-accessories"],
  earbud: ["mobile-accessories"],
  earphone: ["mobile-accessories"],
  speaker: ["mobile-accessories"],
  fitness: ["sports-accessories"],
  gym: ["sports-accessories"],
  workout: ["sports-accessories"],
  sport: ["sports-accessories"],
  fruit: ["groceries"],
  vegetable: ["groceries"],
  food: ["groceries"],
  grocery: ["groceries"],
  snack: ["groceries"],
  coffee: ["groceries"],
  pet: ["groceries"],
  car: ["vehicle"],
  motorcycle: ["motorcycle"],
};

const stemKey = (k: string) => tokenize(k)[0] ?? k;
const CATEGORY_INDEX = new Map(Object.entries(CATEGORY_HINTS).map(([k, v]) => [stemKey(k), v]));

// Stems of the synonym keys, so lookups work on tokenized input.
const SYNONYM_INDEX = new Map(
  Object.entries(SYNONYMS).map(([k, v]) => [tokenize(k)[0] ?? k, v.flatMap((t) => tokenize(t))]),
);

const BRANDS = [...new Set(getProducts().map((p) => p.brand).filter((b): b is string => !!b))].sort(
  (a, b) => b.length - a.length,
);

/**
 * Brands whose name is also an ordinary product word in the catalog (Apple
 * the brand vs. "Apple" the fruit). A bare mention of these stays a search
 * term; only explicit phrasing like "only Apple" turns it into a filter.
 */
const AMBIGUOUS_BRANDS = new Set(
  BRANDS.filter((brand) =>
    getProducts().some(
      (p) => p.brand !== brand && tokenize(p.title).includes(tokenize(brand)[0] ?? ""),
    ),
  ),
);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// --- Parsing -----------------------------------------------------------------

type Parsed = {
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  deals: boolean;
  sort: AgentSort | null;
  cheaper: boolean;
  pricier: boolean;
  brands: string[];
  excludeBrands: string[];
  clearBrands: boolean;
  reset: boolean;
  topicWords: string[];
  concepts: string[][];
  categories: string[];
};

const num = (s: string) => Number(s.replace(/,/g, ""));
const PRICE = String.raw`\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:dollars?|bucks|usd)?`;

function parse(message: string): Parsed {
  let text = ` ${message.toLowerCase().replace(/[“”"!?]/g, " ")} `;
  const take = (re: RegExp) => {
    const m = text.match(re);
    if (m) text = text.replace(m[0], " ");
    return m;
  };

  const p: Parsed = {
    minPrice: null,
    maxPrice: null,
    minRating: null,
    deals: false,
    sort: null,
    cheaper: false,
    pricier: false,
    brands: [],
    excludeBrands: [],
    clearBrands: false,
    reset: false,
    topicWords: [],
    concepts: [],
    categories: [],
  };

  p.reset = !!take(/\b(start over|reset|new search|clear (?:all|filters|everything))\b/);

  // Prices
  let m = take(new RegExp(String.raw`\b(?:between|from)\s+${PRICE}\s*(?:and|to|-)\s*${PRICE}`));
  if (m) [p.minPrice, p.maxPrice] = [num(m[1]), num(m[2])].sort((a, b) => a - b);
  m = take(new RegExp(String.raw`\$\s*(\d[\d,]*(?:\.\d+)?)\s*-\s*\$?\s*(\d[\d,]*(?:\.\d+)?)`));
  if (m) [p.minPrice, p.maxPrice] = [num(m[1]), num(m[2])].sort((a, b) => a - b);
  m = take(new RegExp(String.raw`(?:\b(?:under|below|less than|cheaper than|max(?:imum)?(?: of)?|up to|no more than|within|at most)|<)\s*${PRICE}`));
  if (m) p.maxPrice = num(m[1]);
  m = take(new RegExp(String.raw`${PRICE}\s*(?:or less|or under|max)\b`));
  if (m) p.maxPrice = num(m[1]);
  m = take(new RegExp(String.raw`(?:\b(?:over|above|more than|at least|min(?:imum)?(?: of)?|starting at)|>)\s*${PRICE}`));
  if (m) p.minPrice = num(m[1]);

  // Ratings
  m = take(/\b(\d(?:\.\d)?)\s*\+?\s*stars?(?:\s*(?:and|&)\s*up)?\b/);
  if (m) p.minRating = Math.min(5, Number(m[1]));
  if (take(/\b(highly|top|best|well|highest)[\s-]rated\b|\bgood reviews\b|\bwell reviewed\b/)) {
    p.minRating = p.minRating ?? 4;
    p.sort = "rating";
  }

  // Follow-up modifiers and sorting
  if (take(/\b(cheaper|less expensive|lower price[sd]?|more affordable|cheaper ones?)\b/)) p.cheaper = true;
  if (take(/\b(more expensive|pricier|higher[\s-]end|fancier|more premium)\b/)) p.pricier = true;
  if (take(/\b(cheapest|lowest price[sd]?|budget|cheap|affordable|inexpensive)\b/)) p.sort = "price-asc";
  if (take(/\b(most expensive|luxury|premium|high[\s-]end)\b/)) p.sort = "price-desc";
  if (take(/\b(on sale|deals?|discount(?:ed)?|bargains?)\b/)) p.deals = true;
  if (take(/\b(any brand|all brands|other brands|every brand)\b/)) p.clearBrands = true;

  // Brands: exclusions first, then explicit inclusions ("only Apple", "from Nike").
  const hasProductWords = () =>
    tokenize(text).some((t) => !STOPWORDS.has(t) && !BRANDS.some((b) => tokenize(b).includes(t)));
  for (const brand of BRANDS) {
    const b = escape(brand.toLowerCase());
    if (take(new RegExp(String.raw`\b(?:not|no|except|without|excluding|other than)\s+${b}\b`))) {
      p.excludeBrands.push(brand);
    }
  }
  for (const brand of BRANDS) {
    const b = escape(brand.toLowerCase());
    if (take(new RegExp(String.raw`\b(?:only|just|from|by|made by)\s+${b}\b|\b${b}\s+(?:only|brand|products)\b`))) {
      p.brands.push(brand);
    }
  }
  // A bare brand name counts when other product words are present
  // ("apple headphones"); on its own ("apple") it stays a search term.
  if (hasProductWords()) {
    for (const brand of BRANDS) {
      if (AMBIGUOUS_BRANDS.has(brand)) continue;
      const b = escape(brand.toLowerCase());
      const re = new RegExp(String.raw`\b${b}\b`);
      if (re.test(text) && !p.brands.includes(brand)) {
        text = text.replace(re, " ");
        p.brands.push(brand);
      }
    }
  }

  // Whatever's left describes the product.
  const words = text
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-z0-9$]+|[^a-z0-9]+$/g, ""))
    .filter((w) => /[a-z]/.test(w));
  p.topicWords = words.filter((w) => {
    const t = tokenize(w)[0];
    return t && !STOPWORDS.has(t);
  });
  const seen = new Set<string>();
  for (const t of tokenize(p.topicWords.join(" "))) {
    if (seen.has(t)) continue;
    seen.add(t);
    p.concepts.push(SYNONYM_INDEX.get(t) ?? [t]);
    for (const c of CATEGORY_INDEX.get(t) ?? []) if (!p.categories.includes(c)) p.categories.push(c);
  }
  return p;
}

// --- Intent ------------------------------------------------------------------

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : 0;
};

function emptyIntent(): AgentIntent {
  return {
    topic: "",
    concepts: [],
    categories: [],
    minPrice: null,
    maxPrice: null,
    brands: [],
    excludeBrands: [],
    minRating: null,
    deals: false,
    sort: "relevance",
  };
}

/**
 * New subject → fresh intent. Only modifiers ("cheaper", "under $100",
 * "only Apple") → refine the previous intent.
 */
function resolveIntent(p: Parsed, context: AgentContext | null): { intent: AgentIntent; refined: boolean } {
  const refining = !p.reset && context !== null && p.concepts.length === 0;
  const intent: AgentIntent = refining ? { ...context.intent } : emptyIntent();

  if (!refining) {
    intent.topic = p.topicWords.join(" ");
    intent.concepts = p.concepts;
    intent.categories = p.categories;
  }
  if (p.minPrice !== null) intent.minPrice = p.minPrice;
  if (p.maxPrice !== null) intent.maxPrice = p.maxPrice;
  if (p.minRating !== null) intent.minRating = p.minRating;
  if (p.deals) intent.deals = true;
  if (p.sort) intent.sort = p.sort;
  if (p.clearBrands) {
    intent.brands = [];
    intent.excludeBrands = [];
  }
  if (p.brands.length) {
    intent.brands = p.brands;
    intent.excludeBrands = intent.excludeBrands.filter((b) => !p.brands.includes(b));
  }
  if (p.excludeBrands.length) {
    intent.excludeBrands = [...new Set([...intent.excludeBrands, ...p.excludeBrands])];
    intent.brands = intent.brands.filter((b) => !p.excludeBrands.includes(b));
  }

  const shown = refining ? context.shownPrices : [];
  if (p.cheaper) {
    if (shown.length) {
      // Below the middle of what was just shown (or below the only item).
      const ceiling = Math.floor((shown.length > 1 ? median(shown) : shown[0]) - 0.01);
      intent.maxPrice = Math.min(intent.maxPrice ?? Infinity, ceiling);
      intent.minPrice = intent.minPrice !== null && intent.minPrice >= ceiling ? null : intent.minPrice;
    }
    if (!p.sort) intent.sort = "price-asc";
  }
  if (p.pricier) {
    if (shown.length) {
      const floor = Math.ceil(shown.length > 1 ? median(shown) : shown[0]);
      intent.minPrice = Math.max(intent.minPrice ?? 0, floor);
      intent.maxPrice = intent.maxPrice !== null && intent.maxPrice <= floor ? null : intent.maxPrice;
    }
    if (!p.sort) intent.sort = "price-desc";
  }
  return { intent, refined: refining };
}

// --- Retrieval ---------------------------------------------------------------

const isAvailable = (p: Product) => p.stock > 0 && p.availabilityStatus !== "Out of Stock";

/**
 * The concept that names the product itself. Descriptors usually come first
 * ("wireless headphones", "red running shoes"), so prefer the last concept
 * we have synonyms for (a known product word), else the last one.
 */
function primaryConcept(concepts: string[][]): number {
  for (let i = concepts.length - 1; i >= 0; i--) if (concepts[i].length > 1) return i;
  return concepts.length - 1;
}

function retrieve(intent: AgentIntent): Product[] {
  const candidates = intent.concepts.length
    ? matchConcepts(intent.concepts).filter((r) => r.matched > 0)
    : getProducts()
        .filter((p) => !UNFEATURED_CATEGORIES.has(p.category))
        .map((product) => ({ product, matched: 0, score: 0, hits: [] as boolean[] }));
  const primary = primaryConcept(intent.concepts);

  // Apply hard constraints first, including matching the product word itself
  // ("wireless headphones" can fall back to other headphones, never to
  // wireless chargers). Then keep the best-matching tier of what's left,
  // widened by one tier if it's very thin.
  const allowed = candidates.filter(({ product: p, hits }) => {
    if (intent.concepts.length && !hits[primary]) return false;
    if (!isAvailable(p)) return false;
    if (intent.minPrice !== null && p.price < intent.minPrice) return false;
    if (intent.maxPrice !== null && p.price > intent.maxPrice) return false;
    if (intent.minRating !== null && p.rating < intent.minRating) return false;
    if (intent.deals && p.discountPercentage < 10) return false;
    if (intent.brands.length && (!p.brand || !intent.brands.includes(p.brand))) return false;
    if (p.brand && intent.excludeBrands.includes(p.brand)) return false;
    return true;
  });
  // If the words point at a category that has matching products, stay in it
  // even when filters empty it — "cheaper phones" shouldn't turn into cases.
  const inHinted = (p: Product) => intent.categories.includes(p.category);
  const categoryMode = candidates.some((r) => inHinted(r.product));
  const pool = categoryMode ? allowed.filter((r) => inHinted(r.product)) : allowed;
  const best = Math.max(0, ...pool.map((r) => r.matched));
  const tier = pool.filter((r) => r.matched === best);
  const filtered = tier.length < 3 && best >= 2 ? pool.filter((r) => r.matched >= best - 1) : tier;

  const bySort: Record<AgentSort, (a: (typeof filtered)[number], b: (typeof filtered)[number]) => number> = {
    relevance: (a, b) =>
      b.matched - a.matched || b.score - a.score || getPopularity(b.product) - getPopularity(a.product),
    "price-asc": (a, b) => a.product.price - b.product.price,
    "price-desc": (a, b) => b.product.price - a.product.price,
    rating: (a, b) => b.product.rating - a.product.rating || getPopularity(b.product) - getPopularity(a.product),
  };
  return filtered.sort(bySort[intent.sort]).slice(0, MAX_RESULTS).map((r) => r.product);
}

type Constraint = "rating" | "on-sale" | "brand" | "price";

/** Which constraints the latest message set, so relaxation keeps them longest. */
function touchedBy(p: Parsed): Set<Constraint> {
  const t = new Set<Constraint>();
  if (p.minRating !== null) t.add("rating");
  if (p.deals) t.add("on-sale");
  if (p.brands.length) t.add("brand");
  if (p.minPrice !== null || p.maxPrice !== null || p.cheaper || p.pricier) t.add("price");
  return t;
}

/** Filters to drop, in order, when nothing matches. */
const RELAXATIONS: {
  label: Constraint;
  applies: (i: AgentIntent) => boolean;
  drop: (i: AgentIntent) => AgentIntent;
}[] = [
  { label: "rating", applies: (i) => i.minRating !== null, drop: (i) => ({ ...i, minRating: null }) },
  { label: "on-sale", applies: (i) => i.deals, drop: (i) => ({ ...i, deals: false }) },
  { label: "brand", applies: (i) => i.brands.length > 0, drop: (i) => ({ ...i, brands: [] }) },
  {
    label: "price",
    applies: (i) => i.minPrice !== null || i.maxPrice !== null,
    drop: (i) => ({ ...i, minPrice: null, maxPrice: null }),
  },
];

// --- Presentation ------------------------------------------------------------

const money = (n: number) => (Number.isInteger(n) ? `$${n.toLocaleString("en-US")}` : formatPrice(n));

function describeConstraints(i: AgentIntent): string {
  const parts: string[] = [];
  if (i.minPrice !== null && i.maxPrice !== null) parts.push(`between ${money(i.minPrice)} and ${money(i.maxPrice)}`);
  else if (i.maxPrice !== null) parts.push(`under ${money(i.maxPrice)}`);
  else if (i.minPrice !== null) parts.push(`over ${money(i.minPrice)}`);
  if (i.brands.length) parts.push(`from ${i.brands.join(" or ")}`);
  if (i.excludeBrands.length) parts.push(`excluding ${i.excludeBrands.join(", ")}`);
  if (i.minRating !== null) parts.push(`rated ${i.minRating}★ and up`);
  if (i.deals) parts.push("on sale");
  return parts.join(", ");
}

const SORT_NOTE: Record<AgentSort, string> = {
  relevance: "",
  "price-asc": "lowest price first",
  "price-desc": "highest price first",
  rating: "highest rated first",
};

function subject(i: AgentIntent): string {
  return i.topic ? `“${i.topic}”` : "products";
}

function toAgentProduct(p: Product): AgentProduct {
  const savings = savingsPercent(p);
  const highlights: string[] = [];
  if (savings >= 10) highlights.push(`${savings}% off`);
  if (p.rating >= 4.5) highlights.push("Top rated");
  highlights.push(isFastShipping(p) ? `Fast delivery · ${deliveryDate(p)}` : `Arrives ${deliveryDate(p)}`);
  return {
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    image: p.images[0],
    price: p.price,
    listPrice: savings > 0 ? listPrice(p) : null,
    rating: p.rating,
    ratingCount: getRatingCount(p),
    highlights,
  };
}

/**
 * A friendly round budget below the typical price shown (e.g. 50, 100, 250)
 * that still includes at least one of the results.
 */
function niceBudget(prices: number[]): number | null {
  const m = median(prices);
  const cheapest = Math.min(...prices);
  const steps = [10, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  const fits = steps.filter((s) => s < m && s >= cheapest);
  return fits.length ? fits[fits.length - 1] : null;
}

function suggestionsFor(intent: AgentIntent, products: Product[]): string[] {
  const out: string[] = [];
  if (products.length > 1) out.push("Cheaper");
  const budget = niceBudget(products.map((p) => p.price));
  if (budget && (intent.maxPrice === null || budget < intent.maxPrice)) out.push(`Under $${budget}`);
  if (intent.brands.length) out.push("Any brand");
  else {
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))] as string[];
    if (brands.length > 1) out.push(`Only ${brands[0]}`);
  }
  if (intent.sort !== "rating") out.push("Highest rated");
  if (!intent.deals) out.push("On sale");
  return out.slice(0, 5);
}

const GIFT_REQUEST =
  /\b(gift|present|birthday|anniversary|for (?:my |a )?(?:mom|dad|mother|father|wife|husband|friend|boyfriend|girlfriend|son|daughter|kid|him|her))\b/i;

const GIFT_IDEAS = [
  "Perfume under $100",
  "Jewellery",
  "Kitchen gifts under $50",
  "Highly rated watches",
  "Wireless earbuds",
];

// --- Entry point -------------------------------------------------------------

export function respond(message: string, context: AgentContext | null): AgentReply {
  const parsed = parse(message.slice(0, 300));
  const { intent, refined } = resolveIntent(parsed, context);

  const understood =
    intent.concepts.length > 0 ||
    refined ||
    intent.minPrice !== null ||
    intent.maxPrice !== null ||
    intent.brands.length > 0 ||
    intent.deals ||
    intent.minRating !== null;

  if (!understood && GIFT_REQUEST.test(message)) {
    return {
      message:
        "Happy to help find a gift. What are they into? Pick an idea below or tell me about them, and add a budget if you have one.",
      products: [],
      context: null,
      suggestions: GIFT_IDEAS,
    };
  }

  if (!understood) {
    return {
      message: parsed.reset
        ? "Okay, starting fresh. What are you shopping for?"
        : "Tell me what you're shopping for — a product, who it's for, a budget, or a brand — and I'll find a few good options.",
      products: [],
      context: null,
      suggestions: STARTER_PROMPTS.slice(0, 4),
    };
  }

  let used = intent;
  let products = retrieve(intent);

  if (!products.length && refined && context && (parsed.cheaper || parsed.pricier)) {
    const sort: AgentSort = parsed.cheaper ? "price-asc" : "price-desc";
    const previous = { ...context.intent, sort };
    const again = retrieve(previous);
    if (again.length) {
      const constraints = describeConstraints(previous);
      return {
        message: `Those are already the ${parsed.cheaper ? "most affordable" : "highest-priced"} matches for ${subject(previous)}${constraints ? ` ${constraints}` : ""}. Here they are, ${SORT_NOTE[sort]}.`,
        products: again.map(toAgentProduct),
        context: { intent: previous, shownPrices: again.map((p) => p.price) },
        suggestions: suggestionsFor(previous, again).filter((s) => s !== (parsed.cheaper ? "Cheaper" : "")),
      };
    }
  }

  const dropped: string[] = [];
  // Older constraints go first; what the shopper just asked for goes last.
  const touched = touchedBy(parsed);
  const order = [
    ...RELAXATIONS.filter((r) => !touched.has(r.label)),
    ...RELAXATIONS.filter((r) => touched.has(r.label)),
  ];
  for (const r of order) {
    if (products.length) break;
    if (!r.applies(used)) continue;
    used = r.drop(used);
    dropped.push(r.label);
    products = retrieve(used);
  }

  const constraints = describeConstraints(intent);
  const sortNote = SORT_NOTE[used.sort];
  let text: string;

  if (!products.length) {
    text = `I couldn't find anything for ${subject(intent)}${constraints ? ` ${constraints}` : ""}. Try different words, or a broader category like “kitchen”, “headphones”, or “shoes”.`;
    return { message: text, products: [], context: context, suggestions: STARTER_PROMPTS.slice(0, 3) };
  }

  const n = products.length;
  const count = `${n} ${n === 1 ? "option" : "options"}`;
  if (dropped.length) {
    const relaxed = describeConstraints(used);
    text = `Nothing matched ${subject(intent)} ${constraints}. Here ${n === 1 ? "is" : "are"} the closest ${count} without the ${dropped.join(" and ")} filter${dropped.length > 1 ? "s" : ""}${relaxed ? ` (${relaxed})` : ""}.`;
  } else {
    const lead = refined ? "Updated — here" : "Here";
    text = `${lead} ${n === 1 ? "is" : "are"} ${count} for ${subject(used)}${constraints ? ` ${constraints}` : ""}${sortNote ? `, ${sortNote}` : ""}.`;
  }

  return {
    message: text,
    products: products.map(toAgentProduct),
    context: { intent: used, shownPrices: products.map((p) => p.price) },
    suggestions: suggestionsFor(used, products),
  };
}
