import { z } from "zod";
import type { ToolHandler, ToolName, ToolResult } from "../ai/types.js";
import { addToCart, getCart, removeCartItem } from "../medusa/cart.service.js";

function invalid(error: z.ZodError): ToolResult {
  return {
    ok: false,
    code: "INVALID_ARGUMENTS",
    message: error.issues.map((issue) => issue.message).join("; "),
  };
}

const addSchema = z.object({
  variantId: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(999).optional(),
});

const removeSchema = z.object({
  lineId: z.string().min(1).max(80),
});

export const getCartTool: ToolHandler = async (_args, context) => {
  return getCart(context);
};

export const addToCartTool: ToolHandler = async (args, context) => {
  const parsed = addSchema.safeParse(args);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  return addToCart(
    parsed.data.variantId,
    parsed.data.quantity ?? 1,
    context
  );
};

export const removeCartItemTool: ToolHandler = async (args, context) => {
  const parsed = removeSchema.safeParse(args);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  return removeCartItem(parsed.data.lineId, context);
};

export const cartToolHandlers: Partial<Record<ToolName, ToolHandler>> = {
  get_cart: getCartTool,
  add_to_cart: addToCartTool,
  remove_cart_item: removeCartItemTool,
};
