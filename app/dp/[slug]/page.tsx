import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronIcon } from "@/components/icons";
import { ProductShelf } from "@/components/home/ProductShelf";
import { BuyActions } from "@/components/pdp/BuyActions";
import { Gallery } from "@/components/pdp/Gallery";
import { ListPrice, Price } from "@/components/product/Price";
import { Rating } from "@/components/product/Rating";
import { getCategory, getProductBySlug, getRatingCount, getRelated } from "@/lib/catalog";
import { deliveryDate, FREE_SHIPPING_THRESHOLD, isFastShipping, shippingCost } from "@/lib/delivery";
import { formatCount, formatPrice, listPrice, savingsPercent } from "@/lib/format";
import { BRAND, getDepartmentForCategory } from "@/lib/site";
import { isAvailable, maxQuantity } from "@/lib/stock";
import type { Product } from "@/lib/types";

export async function generateMetadata(props: PageProps<"/dp/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.description };
}

/** Short bullet points for "About this item", built from catalog fields. */
function aboutBullets(p: Product): string[] {
  const sentences = p.description.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [p.description];
  const { width, height, depth } = p.dimensions;
  return [
    ...sentences,
    `${p.warrantyInformation}.`,
    `${p.returnPolicy}.`,
    `Dimensions: ${width} × ${height} × ${depth} cm; weight ${p.weight} kg.`,
  ];
}

function StockStatus({ product }: { product: Product }) {
  if (!isAvailable(product)) {
    return <p className="text-lg text-deal">Currently unavailable.</p>;
  }
  if (product.stock < 10) {
    return <p className="text-lg text-deal">Only {product.stock} left in stock - order soon.</p>;
  }
  return <p className="text-lg text-success">In Stock</p>;
}

export default async function ProductPage(props: PageProps<"/dp/[slug]">) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const department = getDepartmentForCategory(product.category);
  const category = getCategory(product.category);
  const savings = savingsPercent(product);
  const shipping = shippingCost(product);
  const available = isAvailable(product);
  const related = getRelated(product, department?.categories ?? [], 14);

  const delivery = (
    <p className="text-sm">
      {shipping === 0 ? (
        <>
          <span className="text-link">FREE delivery</span>{" "}
        </>
      ) : (
        <>{formatPrice(shipping)} delivery </>
      )}
      <span className="font-bold">{deliveryDate(product)}</span>
      {shipping > 0 && (
        <span className="block text-xs text-muted">
          Free delivery on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}
        </span>
      )}
    </p>
  );

  return (
    <div className="mx-auto max-w-[1500px] px-3 pt-3 md:px-5">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {department && (
            <li className="flex items-center gap-1">
              <Link href={`/s?i=${department.slug}`} className="hover:text-link-hover hover:underline">
                {department.name}
              </Link>
              {category && category.name !== department.name && <ChevronIcon className="size-3" />}
            </li>
          )}
          {category && category.name !== department?.name && (
            <li>
              <Link href={`/s?c=${category.slug}`} className="hover:text-link-hover hover:underline">
                {category.name}
              </Link>
            </li>
          )}
        </ol>
      </nav>

      <div className="rounded-lg bg-white p-4 md:p-6">
        {/* Phones stack gallery → summary → buy box → details; desktop uses
            three columns with summary and details sharing the middle one. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_minmax(260px,3fr)] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-0">
          {/* Gallery */}
          <div className="lg:sticky lg:top-4 lg:row-span-2 lg:self-start">
            <Gallery images={product.images} title={product.title} />
          </div>

          {/* Summary */}
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            {product.brand && (
              <Link
                href={`/s?brand=${encodeURIComponent(product.brand)}`}
                className="text-sm text-link hover:text-link-hover hover:underline"
              >
                Visit the {product.brand} Store
              </Link>
            )}
            <h1 className="mt-1 text-2xl leading-tight font-medium text-ink">{product.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Rating value={product.rating} />
              <span className="text-sm text-link">{formatCount(getRatingCount(product))} ratings</span>
            </div>

            <hr className="my-3 border-[#ddd]" />

            {savings >= 10 && (
              <span className="mb-2 inline-block rounded-sm bg-deal px-2 py-1 text-xs font-semibold text-white">
                Limited time deal
              </span>
            )}
            <div className="flex items-start gap-2">
              {savings > 0 && <span className="text-[28px] leading-none font-light text-deal">-{savings}%</span>}
              <Price value={product.price} size="lg" />
            </div>
            {savings > 0 && (
              <div className="mt-1">
                <ListPrice value={listPrice(product)} />
              </div>
            )}
          </div>

          {/* Buy box */}
          <aside aria-label="Purchase options" className="self-start rounded-lg border border-[#d5d9d9] p-4 lg:col-start-3 lg:row-span-2 lg:row-start-1">
            <Price value={product.price} size="lg" />
            <div className="mt-3 space-y-1">{available && delivery}</div>
            {available && isFastShipping(product) && (
              <p className="mt-1 text-sm text-success">Fast delivery available</p>
            )}

            <div className="mt-3">
              <StockStatus product={product} />
            </div>

            {available && (
              <div className="mt-3">
                <BuyActions slug={product.slug} max={maxQuantity(product)} />
              </div>
            )}

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              <dt className="text-muted">Ships from</dt>
              <dd>{BRAND}</dd>
              <dt className="text-muted">Sold by</dt>
              <dd>{BRAND}</dd>
              <dt className="text-muted">Returns</dt>
              <dd>{product.returnPolicy}</dd>
              <dt className="text-muted">Shipping</dt>
              <dd>{product.shippingInformation}</dd>
            </dl>
          </aside>

          {/* Details */}
          <div className="min-w-0 lg:col-start-2 lg:row-start-2">
            <hr className="mb-3 border-[#ddd] lg:mt-3" />

            <table className="text-sm">
              <tbody>
                {[
                  ["Brand", product.brand],
                  ["Category", category?.name],
                  ["Model", product.sku],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="py-1 pr-6 text-left font-bold">{k}</th>
                      <td className="py-1">{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <hr className="my-3 border-[#ddd]" />

            <h2 className="mb-1 text-base font-bold">About this item</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
              {aboutBullets(product).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-5">
          <ProductShelf
            shelf={{
              title: "Products related to this item",
              href: `/s?c=${product.category}`,
              products: related,
            }}
          />
        </div>
      )}
    </div>
  );
}
