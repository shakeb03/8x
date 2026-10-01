// Single access point for catalog data. Everything else imports from here,
// so swapping the JSON files for a database later only touches this module.

import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import { UNFEATURED_CATEGORIES } from "./site";
import type { Category, Product } from "./types";

const products = productsData as Product[];
const categories = categoriesData as Category[];
const featurable = products.filter((p) => !UNFEATURED_CATEGORIES.has(p.category));

export function getProducts(): Product[] {
  return products;
}

export function getCategories(): Category[] {
  return categories;
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsInCategories(slugs: string[]): Product[] {
  return products.filter((p) => slugs.includes(p.category));
}

/** Biggest discounts first, skipping luxury-priced items that make odd "deals". */
export function getDeals(limit: number): Product[] {
  return featurable
    .filter((p) => p.price < 1000)
    .toSorted((a, b) => b.discountPercentage - a.discountPercentage)
    .slice(0, limit);
}

export function getTopRated(categorySlugs: string[], limit: number): Product[] {
  return getProductsInCategories(categorySlugs)
    .toSorted((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

/** The best-rated product in a category, used as its representative image. */
export function getCategoryCover(slug: string): Product | undefined {
  return getTopRated([slug], 1)[0];
}

/**
 * DummyJSON only ships 3 reviews per product, which reads as fake next to a
 * star rating. Derive a stable, plausible-looking ratings count from the id.
 */
export function getRatingCount(product: Product): number {
  return 40 + ((product.id * 7919) % 12000);
}
