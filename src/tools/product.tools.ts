import { z } from "zod";
import type { ToolHandler, ToolName, ToolResult } from "../ai/types.js";
import { getProductDetails, searchProducts } from "../medusa/product.service.js";

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  maxPrice: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(8).optional(),
});

const detailsSchema = z.object({
  productId: z.string().min(1).max(80),
});

function invalid(error: z.ZodError): ToolResult {
  return {
    ok: false,
    code: "INVALID_ARGUMENTS",
    message: error.issues.map((issue) => issue.message).join("; "),
  };
}

export const searchProductsTool: ToolHandler = async (args, context) => {
  const parsed = searchSchema.safeParse(args);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  return searchProducts(parsed.data, context);
};

export const getProductDetailsTool: ToolHandler = async (args, context) => {
  const parsed = detailsSchema.safeParse(args);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  return getProductDetails(parsed.data.productId, context);
};

export const productToolHandlers: Partial<Record<ToolName, ToolHandler>> = {
  search_products: searchProductsTool,
  get_product_details: getProductDetailsTool,
};
