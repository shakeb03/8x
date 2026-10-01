import { getCategories, getProducts } from "@/lib/catalog";

export default function Home() {
  const products = getProducts();
  const categories = getCategories();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-2 p-8">
      <h1 className="text-2xl font-semibold">Storefront coming soon</h1>
      <p className="text-neutral-600">
        Catalog loaded: {products.length} products across {categories.length}{" "}
        categories.
      </p>
    </main>
  );
}
