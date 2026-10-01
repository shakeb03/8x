"use server";

import { getCategory, getProductBySlug } from "../catalog";
import { isAvailable, maxQuantity } from "../stock";
import { deliveryDate, isFastShipping, shippingCost } from "../delivery";
import { savingsPercent } from "../format";
import type { AgentProductDetail } from "./types";

/** Fuller product data for the focused view inside Agentic Search. */
export async function getAgentProductDetail(slug: string): Promise<AgentProductDetail | null> {
  const p = typeof slug === "string" ? getProductBySlug(slug) : undefined;
  if (!p) return null;
  const available = isAvailable(p);
  const { width, height, depth } = p.dimensions;
  return {
    slug: p.slug,
    images: p.images,
    description: p.description,
    category: getCategory(p.category)?.name ?? null,
    savings: savingsPercent(p),
    stock: p.stock,
    available,
    maxQuantity: maxQuantity(p),
    delivery: { date: deliveryDate(p), cost: shippingCost(p), fast: isFastShipping(p) },
    shipping: p.shippingInformation,
    warranty: p.warrantyInformation,
    returnPolicy: p.returnPolicy,
    dimensions: `${width} × ${height} × ${depth} cm · ${p.weight} kg`,
  };
}
