import type { RequestContext, ToolResult } from "../ai/types.js";
import { resolveRegionId } from "./product.service.js";
import { medusaClient } from "./medusa.client.js";
import { MedusaHttpError } from "./errors.js";

type CartItem = {
  id: string;
  title?: string | null;
  variant_id?: string | null;
  variant_title?: string | null;
  quantity?: number;
  unit_price?: number | null;
  total?: number | null;
  product?: { title?: string };
  variant?: { id?: string; title?: string };
};

type StoreCart = {
  id: string;
  currency_code?: string | null;
  region_id?: string | null;
  customer_id?: string | null;
  total?: number | null;
  subtotal?: number | null;
  items?: CartItem[] | null;
};

const CART_FIELDS =
  "id,currency_code,region_id,customer_id,total,subtotal,*items,*items.product,*items.variant";

function toToolError(error: unknown): ToolResult {
  if (error instanceof MedusaHttpError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return { ok: false, code: "MEDUSA_ERROR", message: "Cart request failed" };
}

function requestOptions(context: RequestContext) {
  return {
    token: context.customerToken,
    requestId: context.requestId,
  };
}

function mapCart(cart: StoreCart) {
  const items = cart.items ?? [];
  return {
    cartId: cart.id,
    currency: cart.currency_code ?? null,
    itemCount: items.length,
    total: cart.total ?? null,
    items: items.map((item) => ({
      lineId: item.id,
      title: item.product?.title || item.title || "Item",
      variantId: item.variant_id || item.variant?.id || null,
      variantTitle: item.variant?.title || item.variant_title || null,
      quantity: item.quantity ?? 1,
      unitPrice: item.unit_price ?? null,
      total: item.total ?? null,
    })),
  };
}

async function maybeTransferCart(
  cart: StoreCart,
  context: RequestContext
): Promise<void> {
  if (!context.customerToken) {
    return;
  }
  if (cart.customer_id && cart.customer_id === context.customerId) {
    return;
  }

  try {
    await medusaClient.transferCart(cart.id, requestOptions(context));
  } catch {
    // Cart may already belong to this customer, or transfer is unavailable.
  }
}

async function retrieveCart(
  cartId: string,
  context: RequestContext
): Promise<StoreCart> {
  const { cart } = await medusaClient.getCart(
    cartId,
    { fields: CART_FIELDS },
    requestOptions(context)
  );
  return cart as StoreCart;
}

async function createSessionCart(
  context: RequestContext
): Promise<StoreCart | ToolResult> {
  const regionId = await resolveRegionId(context.requestId);
  if (!regionId) {
    return {
      ok: false,
      code: "MEDUSA_ERROR",
      message: "No region is available to create a cart",
    };
  }

  const body: Record<string, unknown> = { region_id: regionId };
  if (context.companyId) {
    body.metadata = { company_id: context.companyId };
  }

  const { cart } = await medusaClient.createCart(
    body,
    requestOptions(context)
  );
  const created = cart as StoreCart;
  if (!created?.id) {
    return {
      ok: false,
      code: "MEDUSA_ERROR",
      message: "Medusa did not return a cart",
    };
  }

  context.cartId = created.id;
  await maybeTransferCart(created, context);
  return retrieveCart(created.id, context);
}

async function ensureCart(
  context: RequestContext
): Promise<StoreCart | ToolResult> {
  if (context.cartId) {
    try {
      const existing = await retrieveCart(context.cartId, context);
      await maybeTransferCart(existing, context);
      return existing;
    } catch (error) {
      if (
        !(error instanceof MedusaHttpError && error.code === "NOT_FOUND")
      ) {
        return toToolError(error);
      }
    }
  }

  try {
    return await createSessionCart(context);
  } catch (error) {
    return toToolError(error);
  }
}

function isToolResult(
  value: StoreCart | ToolResult
): value is ToolResult {
  return "ok" in value;
}

export async function getCart(
  context: RequestContext
): Promise<ToolResult> {
  try {
    const cart = await ensureCart(context);
    if (isToolResult(cart)) {
      return cart;
    }
    return { ok: true, data: mapCart(cart) };
  } catch (error) {
    return toToolError(error);
  }
}

export async function addToCart(
  variantId: string,
  quantity: number,
  context: RequestContext
): Promise<ToolResult> {
  try {
    const cart = await ensureCart(context);
    if (isToolResult(cart)) {
      return cart;
    }

    await medusaClient.addLineItem(
      cart.id,
      { variant_id: variantId, quantity },
      requestOptions(context)
    );

    const updated = await retrieveCart(cart.id, context);
    return { ok: true, data: mapCart(updated) };
  } catch (error) {
    return toToolError(error);
  }
}

export async function removeCartItem(
  lineId: string,
  context: RequestContext
): Promise<ToolResult> {
  if (!context.cartId) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "No cart in this session",
    };
  }

  try {
    await medusaClient.deleteLineItem(
      context.cartId,
      lineId,
      requestOptions(context)
    );
    const updated = await retrieveCart(context.cartId, context);
    return { ok: true, data: mapCart(updated) };
  } catch (error) {
    return toToolError(error);
  }
}
