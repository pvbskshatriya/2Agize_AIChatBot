import type { RequestContext, ToolResult } from "../ai/types.js";
import { medusaClient } from "./medusa.client.js";
import { MedusaHttpError } from "./errors.js";

type MoneyPrice = {
  calculated_amount?: number;
  currency_code?: string;
};

type ProductVariant = {
  id?: string;
  title?: string;
  sku?: string | null;
  inventory_quantity?: number | null;
  manage_inventory?: boolean;
  calculated_price?: MoneyPrice | null;
  options?: Array<{ value?: string; option?: { title?: string } }>;
};

type StoreProduct = {
  id: string;
  title?: string;
  description?: string | null;
  handle?: string;
  thumbnail?: string | null;
  variants?: ProductVariant[];
  options?: Array<{ title?: string; values?: Array<{ value?: string }> }>;
  categories?: Array<{ id?: string; name?: string }>;
};

export type SearchProductsInput = {
  query: string;
  maxPrice?: number;
  currency?: string;
};

let cachedRegionId: string | undefined;

function variantInStock(variant: ProductVariant): boolean {
  if (variant.manage_inventory === false) {
    return true;
  }
  return (variant.inventory_quantity ?? 0) > 0;
}

function cheapestPrice(product: StoreProduct): {
  price: number | null;
  currency: string | null;
} {
  const priced = (product.variants ?? [])
    .map((variant) => variant.calculated_price)
    .filter((price): price is MoneyPrice => Boolean(price?.calculated_amount));

  if (!priced.length) {
    return { price: null, currency: null };
  }

  const lowest = priced.reduce((min, price) =>
    (price.calculated_amount ?? Infinity) < (min.calculated_amount ?? Infinity)
      ? price
      : min
  );

  return {
    price: lowest.calculated_amount ?? null,
    currency: lowest.currency_code ?? null,
  };
}

function mapSearchProduct(product: StoreProduct) {
  const { price, currency } = cheapestPrice(product);
  return {
    id: product.id,
    title: product.title ?? "",
    price,
    currency,
    inStock: (product.variants ?? []).some(variantInStock),
    variants: (product.variants ?? []).slice(0, 8).map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.calculated_price?.calculated_amount ?? null,
      currency: variant.calculated_price?.currency_code ?? currency,
      inStock: variantInStock(variant),
    })),
  };
}

function mapProductDetails(product: StoreProduct) {
  const { price, currency } = cheapestPrice(product);
  return {
    id: product.id,
    name: product.title ?? "",
    description: product.description ?? "",
    price,
    currency,
    handle: product.handle,
    thumbnail: product.thumbnail,
    availability: (product.variants ?? []).some(variantInStock)
      ? "in_stock"
      : "out_of_stock",
    variants: (product.variants ?? []).map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.calculated_price?.calculated_amount ?? null,
      currency: variant.calculated_price?.currency_code ?? currency,
      inStock: variantInStock(variant),
      inventoryQuantity:
        variant.manage_inventory === false
          ? null
          : variant.inventory_quantity ?? null,
    })),
    options: (product.options ?? []).map((option) => ({
      name: option.title,
      values: (option.values ?? []).map((value) => value.value).filter(Boolean),
    })),
    categories: (product.categories ?? [])
      .map((category) => category.name)
      .filter(Boolean),
  };
}

export async function resolveRegionId(requestId?: string): Promise<string | undefined> {
  if (process.env.MEDUSA_REGION_ID) {
    return process.env.MEDUSA_REGION_ID;
  }
  if (cachedRegionId) {
    return cachedRegionId;
  }

  const { regions } = await medusaClient.getRegions({ requestId });
  const list = (regions ?? []) as Array<{
    id: string;
    currency_code?: string;
  }>;

  const tzs = list.find(
    (region) => region.currency_code?.toUpperCase() === "TZS"
  );
  cachedRegionId = tzs?.id ?? list[0]?.id;
  return cachedRegionId;
}

function toToolError(error: unknown): ToolResult {
  if (error instanceof MedusaHttpError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return { ok: false, code: "MEDUSA_ERROR", message: "Product lookup failed" };
}

const PRODUCT_FIELDS =
  "*variants,*variants.calculated_price,*variants.options,*options,*categories,+description,+thumbnail,+handle";

export async function searchProducts(
  input: SearchProductsInput,
  context: RequestContext
): Promise<ToolResult> {
  try {
    const regionId = await resolveRegionId(context.requestId);
    const { products } = await medusaClient.getProducts(
      {
        q: input.query,
        limit: 20,
        region_id: regionId,
        fields: PRODUCT_FIELDS,
      },
      { token: context.customerToken, requestId: context.requestId }
    );

    let mapped = ((products ?? []) as StoreProduct[]).map(mapSearchProduct);

    if (input.currency) {
      const currency = input.currency.toUpperCase();
      mapped = mapped.filter(
        (product) => !product.currency || product.currency.toUpperCase() === currency
      );
    }

    if (typeof input.maxPrice === "number") {
      mapped = mapped.filter(
        (product) => product.price === null || product.price <= input.maxPrice!
      );
    }

    return { ok: true, data: { products: mapped } };
  } catch (error) {
    return toToolError(error);
  }
}

export async function getProductDetails(
  productId: string,
  context: RequestContext
): Promise<ToolResult> {
  try {
    const regionId = await resolveRegionId(context.requestId);
    const { product } = await medusaClient.getProduct(
      productId,
      {
        region_id: regionId,
        fields: PRODUCT_FIELDS,
      },
      { token: context.customerToken, requestId: context.requestId }
    );

    if (!product) {
      return { ok: false, code: "NOT_FOUND", message: "Product not found" };
    }

    return { ok: true, data: mapProductDetails(product as StoreProduct) };
  } catch (error) {
    return toToolError(error);
  }
}
