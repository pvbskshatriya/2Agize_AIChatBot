import { z } from "zod";
import type { ToolHandler, ToolName, ToolResult } from "../ai/types.js";
import { listCustomerOrders } from "../medusa/order.service.js";

const schema = z.object({
  customerId: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

function invalid(error: z.ZodError): ToolResult {
  return {
    ok: false,
    code: "INVALID_ARGUMENTS",
    message: error.issues.map((issue) => issue.message).join("; "),
  };
}

export const getCustomerOrdersTool: ToolHandler = async (args, context) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  return listCustomerOrders(context, parsed.data.limit ?? 10);
};

export const customerToolHandlers: Partial<Record<ToolName, ToolHandler>> = {
  get_customer_orders: getCustomerOrdersTool,
};
