import type { RequestContext, ToolResult } from "../ai/types.js";
import { medusaClient } from "./medusa.client.js";
import { MedusaHttpError } from "./errors.js";
import { listOrdersForCompanySummary } from "./order.service.js";

type StoreCompany = {
  id: string;
  name?: string;
  currency_code?: string | null;
};

function startOfCurrentMonthUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function toToolError(error: unknown): ToolResult {
  if (error instanceof MedusaHttpError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return { ok: false, code: "MEDUSA_ERROR", message: "Company lookup failed" };
}

export async function getCompanySummary(
  context: RequestContext,
  period = "current_month"
): Promise<ToolResult> {
  if (!context.customerToken || !context.customerId) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sign in to view company orders",
    };
  }

  if (!context.companyId) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "No company is linked to this customer",
    };
  }

  try {
    const { company } = await medusaClient.getCompany(
      context.companyId,
      { fields: "id,name,currency_code" },
      { token: context.customerToken, requestId: context.requestId }
    );

    const mapped = company as StoreCompany;
    const ordersOrError = await listOrdersForCompanySummary(context);
    if (!Array.isArray(ordersOrError)) {
      return ordersOrError;
    }

    const start =
      period === "current_month" ? startOfCurrentMonthUtc() : new Date(0);
    const inPeriod = ordersOrError.filter((order) => {
      if (!order.created_at) {
        return false;
      }
      return new Date(order.created_at) >= start;
    });

    const totalValue = inPeriod.reduce(
      (sum, order) => sum + (order.total ?? 0),
      0
    );

    return {
      ok: true,
      data: {
        company: mapped?.name || context.companyName || "Company",
        period,
        orderCount: inPeriod.length,
        totalValue,
        currency:
          mapped?.currency_code || inPeriod[0]?.currency_code || null,
      },
    };
  } catch (error) {
    return toToolError(error);
  }
}
