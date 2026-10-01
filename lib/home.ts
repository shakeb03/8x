// Homepage merchandising: which products and categories appear where.
// Everything is derived from the local catalog so it stays in sync with it.

import {
  getCategoryCover,
  getDeals,
  getProductBySlug,
  getProductsInCategories,
  getTopRated,
} from "./catalog";
import { DEPARTMENTS } from "./site";
import type { Product } from "./types";

export type HeroCampaign = {
  title: string;
  href: string;
  bg: string;
  products: Product[];
};

export type QuadTile = { label: string; href: string; product: Product };

export type QuadCard = {
  title: string;
  href: string;
  linkLabel: string;
  tiles: QuadTile[];
};

const deptCategories = (slug: string) =>
  DEPARTMENTS.find((d) => d.slug === slug)?.categories ?? [];

function pick(...slugs: string[]): Product[] {
  return slugs.map((s) => {
    const p = getProductBySlug(s);
    if (!p) throw new Error(`Homepage references unknown product "${s}"`);
    return p;
  });
}

function categoryTile(label: string, category: string): QuadTile {
  const product = getCategoryCover(category);
  if (!product) throw new Error(`No products in category "${category}"`);
  return { label, href: `/s?c=${category}`, product };
}

function productTile(label: string, slug: string): QuadTile {
  const [product] = pick(slug);
  return { label, href: `/dp/${slug}`, product };
}

export function getHeroCampaigns(): HeroCampaign[] {
  return [
    {
      title: "Shop kitchen must-haves",
      href: "/s?c=kitchen-accessories",
      bg: "#d9e6cf",
      products: pick("boxed-blender", "carbon-steel-wok", "black-aluminium-cup"),
    },
    {
      title: "Shop all things beauty",
      href: "/s?i=beauty",
      bg: "#f9cbb9",
      products: pick("eyeshadow-palette-with-mirror", "red-lipstick", "powder-canister"),
    },
    {
      title: "Start looking sharp",
      href: "/s?i=fashion",
      bg: "#e2d8cc",
      products: pick("marni-red-black-suit", "nike-air-jordan-1-red-and-black", "heshe-women-s-leather-bag"),
    },
    {
      title: "Level up your tech",
      href: "/s?i=electronics",
      bg: "#f1c9e8",
      products: pick("apple-macbook-pro-14-inch-space-grey", "apple-airpods-max-silver", "iphone-13-pro"),
    },
    {
      title: "Game day essentials",
      href: "/s?i=sports",
      bg: "#bfd8f6",
      products: pick("basketball", "american-football", "baseball-glove"),
    },
    {
      title: "Make home feel new",
      href: "/s?c=home-decoration",
      bg: "#cfe6d6",
      products: pick("house-showpiece-plant", "table-lamp", "family-tree-photo-frame"),
    },
    {
      title: "Fresh picks for the pantry",
      href: "/s?i=groceries",
      bg: "#f6e7a8",
      products: pick("apple", "cooking-oil", "cucumber"),
    },
  ];
}

export function getQuadCards(): QuadCard[][] {
  return [
    [
      {
        title: "Plug in with our electronics",
        href: "/s?i=electronics",
        linkLabel: "Shop electronics",
        tiles: [
          categoryTile("Smartphones", "smartphones"),
          categoryTile("Laptops", "laptops"),
          categoryTile("Tablets", "tablets"),
          categoryTile("Audio & accessories", "mobile-accessories"),
        ],
      },
      {
        title: "Refresh your space",
        href: "/s?i=home-kitchen",
        linkLabel: "Shop home & kitchen",
        tiles: [
          categoryTile("Furniture", "furniture"),
          categoryTile("Home décor", "home-decoration"),
          categoryTile("Kitchen", "kitchen-accessories"),
          productTile("Lighting", "table-lamp"),
        ],
      },
      {
        title: "Fashion finds",
        href: "/s?i=fashion",
        linkLabel: "Shop fashion",
        tiles: [
          categoryTile("Dresses", "womens-dresses"),
          categoryTile("Men's shirts", "mens-shirts"),
          categoryTile("Shoes", "womens-shoes"),
          categoryTile("Bags", "womens-bags"),
        ],
      },
      {
        title: "Beauty essentials",
        href: "/s?i=beauty",
        linkLabel: "Shop beauty",
        tiles: [
          categoryTile("Makeup", "beauty"),
          categoryTile("Fragrance", "fragrances"),
          categoryTile("Skin care", "skin-care"),
          categoryTile("Jewellery", "womens-jewellery"),
        ],
      },
    ],
    [
      {
        title: "Gear up to get fit",
        href: "/s?i=sports",
        linkLabel: "Shop sports",
        tiles: getTopRated(deptCategories("sports"), 4).map((p) =>
          productTile(p.title, p.slug),
        ),
      },
      {
        title: "Watches & sunglasses",
        href: "/s?c=mens-watches",
        linkLabel: "Shop accessories",
        tiles: [
          categoryTile("Men's watches", "mens-watches"),
          categoryTile("Women's watches", "womens-watches"),
          categoryTile("Sunglasses", "sunglasses"),
          categoryTile("Tops", "tops"),
        ],
      },
      {
        title: "Pantry staples",
        href: "/s?i=groceries",
        linkLabel: "Shop grocery",
        tiles: getTopRated(["groceries"], 4).map((p) => productTile(p.title, p.slug)),
      },
      {
        title: "Under $25",
        href: "/s?max=25",
        linkLabel: "See more under $25",
        // Groceries are excluded so this doesn't repeat "Pantry staples".
        tiles: getTopRated(
          DEPARTMENTS.filter((d) => d.slug !== "groceries").flatMap((d) => d.categories),
          60,
        )
          .filter((p) => p.price < 25)
          .slice(0, 4)
          .map((p) => productTile(p.title, p.slug)),
      },
    ],
  ];
}

export type Shelf = { title: string; href: string; products: Product[]; variant?: "deal" };

export function getShelves(): Shelf[] {
  return [
    { title: "Today's Deals", href: "/s?deals=1&sort=discount", products: getDeals(16), variant: "deal" },
    {
      title: "Best sellers in Electronics",
      href: "/s?i=electronics",
      products: getTopRated(deptCategories("electronics"), 14),
    },
    {
      title: "Top rated in Home & Kitchen",
      href: "/s?i=home-kitchen",
      products: getTopRated(deptCategories("home-kitchen"), 14),
    },
    {
      title: "Trending in Fashion",
      href: "/s?i=fashion",
      products: getProductsInCategories(deptCategories("fashion"))
        .filter((p) => p.price < 200)
        .toSorted((a, b) => b.rating - a.rating)
        .slice(0, 14),
    },
  ];
}
