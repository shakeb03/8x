// Store-wide config: brand name and how DummyJSON categories roll up into
// the departments shown in the header, search scope and homepage.

export const BRAND = "nile";

export type Department = {
  slug: string;
  name: string;
  categories: string[];
};

export const DEPARTMENTS: Department[] = [
  {
    slug: "electronics",
    name: "Electronics",
    categories: ["smartphones", "laptops", "tablets", "mobile-accessories"],
  },
  {
    slug: "fashion",
    name: "Fashion",
    categories: [
      "womens-dresses",
      "tops",
      "womens-shoes",
      "womens-bags",
      "womens-jewellery",
      "womens-watches",
      "mens-shirts",
      "mens-shoes",
      "mens-watches",
      "sunglasses",
    ],
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    categories: ["kitchen-accessories", "furniture", "home-decoration"],
  },
  {
    slug: "beauty",
    name: "Beauty",
    categories: ["beauty", "fragrances", "skin-care"],
  },
  {
    slug: "sports",
    name: "Sports & Outdoors",
    categories: ["sports-accessories"],
  },
  {
    slug: "groceries",
    name: "Grocery",
    categories: ["groceries"],
  },
];

// Categories that exist in the seed data but don't belong on a shopping
// homepage (cars, motorcycles). Still reachable by search.
export const UNFEATURED_CATEGORIES = new Set(["vehicle", "motorcycle"]);
