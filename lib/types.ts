export type Review = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
};

export type Product = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  brand: string | null;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  sku: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  returnPolicy: string;
  reviews: Review[];
  thumbnail: string;
  images: string[];
};

/** The slice of a product the client-side cart needs to render a line. */
export type CartProduct = Pick<
  Product,
  "slug" | "title" | "brand" | "price" | "discountPercentage" | "stock" | "availabilityStatus" | "thumbnail"
>;

export type Category = {
  slug: string;
  name: string;
  count: number;
};
