# Amazon Clone (24-hour build)

A focused rebuild of Amazon's core shopping flow: browse, search, product
detail, cart, checkout, orders.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Zustand

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Catalog data

Product data is stored locally in `data/products.json` and `data/categories.json`.
Images are in `public/products/<slug>/`. The app makes no external API calls.

The catalog was seeded from [DummyJSON](https://dummyjson.com). To re-import it
(this overwrites local data and images):

```bash
npm run import-catalog
```

All catalog reads go through `lib/catalog.ts`.
