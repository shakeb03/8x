// Single access point for catalog data. Everything else imports from here,
// so swapping the JSON files for a database later only touches this module.

import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import type { Category, Product } from "./types";

const products = productsData as Product[];
const categories = categoriesData as Category[];

export function getProducts(): Product[] {
  return products;
}

export function getCategories(): Category[] {
  return categories;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
