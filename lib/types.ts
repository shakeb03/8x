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
    | "slug"
  | "title"
  | "brand"
  | "price"
  | "discountPercentage"
  | "stock"
  | "availabilityStatus"
  | "thumbnail"
  | "shippingInformation"
>;

export type Category = {
  slug: string;
  name: string;
  count: number;
};

export type ShippingAddress = {
  fullName: string;
  street: string;
  unit: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
};

export type DeliverySpeed = "standard" | "express";

export type PaymentMethodId = "demo-card" | "gift-card" | "pay-on-delivery";

export type OrderLine = {
  slug: string;
  title: string;
  brand: string | null;
  thumbnail: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  /** ISO timestamps */
  placedAt: string;
  estimatedDelivery: string;
  lines: OrderLine[];
  address: ShippingAddress;
  delivery: { speed: DeliverySpeed; label: string; cost: number };
  payment: { method: PaymentMethodId; label: string };
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};
