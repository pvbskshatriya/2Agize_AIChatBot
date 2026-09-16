import type { RequestContext, ToolResult } from "../ai/types.js";
import { medusaClient } from "./medusa.client.js";
import { MedusaHttpError } from "./errors.js";

type OrderItem = {
  title?: string;
  subtitle?: string | null;
  quantity?: number;
  product?: { title?: string };
  variant?: { title?: string };
};

type ShippingAddress = {
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
};

type StoreOrder = {
  id: string;
  display_id?: number;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  total?: number;
  currency_code?: string;
  created_at?: string;
  items?: OrderItem[];
  shipping_address?: ShippingAddress | null;
  shipping_methods?: Array<{ name?: string }>;
  fulfillments?: Array<{ id?: string; packed_at?: string | null; shipped_at?: string | null; delivered_at?: string | null }>;
  metadata?: Record<string, unknown> | null;
};

const ORDER_FIELDS =
  "id,display_id,status,payment_status,fulfillment_status,total,currency_code,created_at,*items,*items.variant,*items.product,*shipping_address,*shipping_methods,*fulfillments,+metadata";

function isHiddenSplitOrder(order: StoreOrder): boolean {
  const meta = order.metadata || {};
  return meta.split_role === "admin_child" || Boolean(meta.parent_order_id);
}

function publicOrderId(order: StoreOrder): string {
  if (order.display_id !== undefined && order.display_id !== null) {
    return `AGZ-${order.display_id}`;
  }
  return order.id;
}

function mapOrderSummary(order: StoreOrder) {
  return {
    orderId: publicOrderId(order),
    medusaId: order.id,
    status: order.status ?? "unknown",
    paymentStatus: order.payment_status ?? "unknown",
    fulfillmentStatus: order.fulfillment_status ?? "unknown",
    total: order.total ?? null,
    currency: order.currency_code ?? null,
    createdAt: order.created_at ?? null,
    items: (order.items ?? []).map((item) => ({
      product: item.product?.title || item.title || "Item",
      quantity: item.quantity ?? 1,
    })),
  };
}

function formatAddress(address?: ShippingAddress | null): string | null {
  if (!address) {
    return null;
  }
  const parts = [
    address.address_1,
    address.address_2,
    address.city,
    address.province,
    address.postal_code,
    address.country_code?.toUpperCase(),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function mapOrderDetails(order: StoreOrder) {
  const fulfillment = order.fulfillments?.[0];
  return {
    ...mapOrderSummary(order),
    delivery: {
      status: order.fulfillment_status ?? "unknown",
      shippingMethod: order.shipping_methods?.[0]?.name ?? null,
      address: formatAddress(order.shipping_address),
      packedAt: fulfillment?.packed_at ?? null,
      shippedAt: fulfillment?.shipped_at ?? null,
      deliveredAt: fulfillment?.delivered_at ?? null,
    },
  };
}

function toToolError(error: unknown): ToolResult {
  if (error instanceof MedusaHttpError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return { ok: false, code: "MEDUSA_ERROR", message: "Order lookup failed" };
}

function normalizeOrderRef(orderId: string): string {
  return orderId.trim().replace(/^#/, "").replace(/^AGZ-/i, "");
}

function matchesOrderRef(order: StoreOrder, rawId: string): boolean {
  const raw = rawId.trim();
  const normalized = normalizeOrderRef(raw).toLowerCase();
  if (order.id === raw) {
    return true;
  }
  if (String(order.display_id) === normalized) {
    return true;
  }
  if (publicOrderId(order).toLowerCase() === raw.toLowerCase()) {
    return true;
  }
  return false;
}

export async function listCustomerOrders(
  context: RequestContext,
  limit = 10
): Promise<ToolResult> {
  if (!context.customerToken) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sign in to view orders",
    };
  }

  try {
    const { orders } = await medusaClient.getOrders(
      {
        limit: Math.max(limit * 3, 30),
        offset: 0,
        order: "-created_at",
        fields: ORDER_FIELDS,
      },
      { token: context.customerToken, requestId: context.requestId }
    );

    const visible = ((orders ?? []) as StoreOrder[])
      .filter((order) => !isHiddenSplitOrder(order))
      .slice(0, limit)
      .map(mapOrderSummary);

    return { ok: true, data: { orders: visible } };
  } catch (error) {
    return toToolError(error);
  }
}

export async function getOrderDetails(
  orderId: string,
  context: RequestContext
): Promise<ToolResult> {
  if (!context.customerToken) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sign in to view this order",
    };
  }

  try {
    if (orderId.startsWith("order_")) {
      const { order } = await medusaClient.getOrder(
        orderId,
        { fields: ORDER_FIELDS },
        { token: context.customerToken, requestId: context.requestId }
      );
      const mapped = order as StoreOrder;
      if (!mapped || isHiddenSplitOrder(mapped)) {
        return { ok: false, code: "NOT_FOUND", message: "Order not found" };
      }
      return { ok: true, data: mapOrderDetails(mapped) };
    }

    const { orders } = await medusaClient.getOrders(
      {
        limit: 50,
        offset: 0,
        order: "-created_at",
        fields: ORDER_FIELDS,
      },
      { token: context.customerToken, requestId: context.requestId }
    );

    const match = ((orders ?? []) as StoreOrder[])
      .filter((order) => !isHiddenSplitOrder(order))
      .find((order) => matchesOrderRef(order, orderId));

    if (!match) {
      return { ok: false, code: "NOT_FOUND", message: "Order not found" };
    }

    const { order } = await medusaClient.getOrder(
      match.id,
      { fields: ORDER_FIELDS },
      { token: context.customerToken, requestId: context.requestId }
    );

    return { ok: true, data: mapOrderDetails(order as StoreOrder) };
  } catch (error) {
    return toToolError(error);
  }
}

export async function listOrdersForCompanySummary(
  context: RequestContext
): Promise<StoreOrder[] | ToolResult> {
  if (!context.customerToken) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sign in to view company orders",
    };
  }

  try {
    const { orders } = await medusaClient.getOrders(
      {
        limit: 100,
        offset: 0,
        order: "-created_at",
        fields: ORDER_FIELDS,
      },
      { token: context.customerToken, requestId: context.requestId }
    );

    return ((orders ?? []) as StoreOrder[]).filter(
      (order) => !isHiddenSplitOrder(order)
    );
  } catch (error) {
    return toToolError(error);
  }
}
