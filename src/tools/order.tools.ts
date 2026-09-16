import { z } from "zod";
import type { ToolHandler, ToolName, ToolResult } from "../ai/types.js";
import { getOrderDetails } from "../medusa/order.service.js";

const detailsSchema = z.object({
  orderId: z.string().min(1).max(80),
});

function invalid(error: z.ZodError): ToolResult {
  return {
    ok: false,
    code: "INVALID_ARGUMENTS",
    message: error.issues.map((issue) => issue.message).join("; "),
  };
}

export const getOrderDetailsTool: ToolHandler = async (args, context) => {
  const parsed = detailsSchema.safeParse(args);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  return getOrderDetails(parsed.data.orderId, context);
};

export const orderToolHandlers: Partial<Record<ToolName, ToolHandler>> = {
  get_order_details: getOrderDetailsTool,
};
