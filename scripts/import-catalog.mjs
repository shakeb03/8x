// One-time import: pulls the DummyJSON catalog, normalizes it, and writes it
// into the repo (data/*.json + public/products/**) so the app never calls
// DummyJSON at runtime. Re-run with `npm run import-catalog`.

import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const IMG_DIR = path.join(ROOT, "public", "products");
const SOURCE = "https://dummyjson.com";

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

// Download with a small concurrency limit so we don't hammer the CDN.
async function runPool(tasks, limit = 12) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < tasks.length) await tasks[i++]();
  });
  await Promise.all(workers);
}

async function main() {
  const [{ products }, categories] = await Promise.all([
    fetch(`${SOURCE}/products?limit=0`).then((r) => r.json()),
    fetch(`${SOURCE}/products/categories`).then((r) => r.json()),
  ]);

  await rm(IMG_DIR, { recursive: true, force: true });
  await mkdir(DATA_DIR, { recursive: true });

  const downloads = [];
  const out = [];

  const seen = new Set();
  for (const p of products) {
    // A few DummyJSON titles repeat; suffix the id to keep slugs unique.
    let slug = slugify(p.title);
    if (seen.has(slug)) slug = `${slug}-${p.id}`;
    seen.add(slug);
    const dir = path.join(IMG_DIR, slug);
    await mkdir(dir, { recursive: true });

    const localize = (url, name) => {
      const ext = path.extname(new URL(url).pathname) || ".webp";
      const file = `${name}${ext}`;
      downloads.push(() => download(url, path.join(dir, file)));
      return `/products/${slug}/${file}`;
    };

    out.push({
      id: p.id,
      slug,
      title: p.title,
      description: p.description,
      category: p.category,
      brand: p.brand ?? null,
      price: p.price,
      discountPercentage: p.discountPercentage,
      rating: p.rating,
      stock: p.stock,
      tags: p.tags,
      sku: p.sku,
      weight: p.weight,
      dimensions: p.dimensions,
      warrantyInformation: p.warrantyInformation,
      shippingInformation: p.shippingInformation,
      availabilityStatus: p.availabilityStatus,
      returnPolicy: p.returnPolicy,
      // Drop reviewer emails — not needed and not ours to ship.
      reviews: p.reviews.map(({ rating, comment, date, reviewerName }) => ({
        rating,
        comment,
        date,
        reviewerName,
      })),
      thumbnail: localize(p.thumbnail, "thumbnail"),
      images: p.images.map((url, i) => localize(url, String(i + 1))),
    });
  }

  console.log(`Downloading ${downloads.length} images…`);
  await runPool(downloads);

  const counts = Object.groupBy(out, (p) => p.category);
  const cats = categories
    .map((c) => ({ slug: c.slug, name: c.name, count: counts[c.slug]?.length ?? 0 }))
    .filter((c) => c.count > 0);

  await writeFile(path.join(DATA_DIR, "products.json"), JSON.stringify(out, null, 2) + "\n");
  await writeFile(path.join(DATA_DIR, "categories.json"), JSON.stringify(cats, null, 2) + "\n");
  console.log(`Wrote ${out.length} products, ${cats.length} categories.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
