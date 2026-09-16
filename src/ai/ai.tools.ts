import type { FunctionTool } from "openai/resources/responses/responses";
import { companyToolHandlers } from "../tools/company.tools.js";
import { customerToolHandlers } from "../tools/customer.tools.js";
import { orderToolHandlers } from "../tools/order.tools.js";
import { productToolHandlers } from "../tools/product.tools.js";
import type { ToolHandler, ToolName, ToolResult } from "./types.js";

export const toolHandlers: Record<ToolName, ToolHandler> = {
  search_products: productToolHandlers.search_products!,
  get_product_details: productToolHandlers.get_product_details!,
  get_customer_orders: customerToolHandlers.get_customer_orders!,
  get_order_details: orderToolHandlers.get_order_details!,
  get_company_summary: companyToolHandlers.get_company_summary!,
};

export const openaiTools: FunctionTool[] = [
  {
    type: "function",
    name: "search_products",
    strict: false,
    description:
      "Search the catalog for products. Use when the customer asks to find, list, or filter products.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: {
          type: "string",
          description: "Search text such as a brand, product type, or name.",
        },
        maxPrice: {
          type: "number",
          description: "Optional maximum price in the requested currency.",
        },
        currency: {
          type: "string",
          description: "ISO currency code such as TZS.",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "get_product_details",
    strict: false,
    description:
      "Get details for one product by Medusa product id returned from search_products.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        productId: {
          type: "string",
          description: "Medusa product id, for example prod_123.",
        },
      },
      required: ["productId"],
    },
  },
  {
    type: "function",
    name: "get_customer_orders",
    strict: false,
    description:
      "List recent orders for the authenticated customer. The backend ignores any customerId argument and uses the signed-in session.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        customerId: {
          type: "string",
          description: "Ignored. Identity comes from the authenticated session.",
        },
        limit: {
          type: "number",
          description: "How many recent orders to return. Default 10.",
        },
      },
    },
  },
  {
    type: "function",
    name: "get_order_details",
    strict: false,
    description:
      "Get status and details for one order. Accepts AGZ-10245, #10245, a display id, or a Medusa order id.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        orderId: {
          type: "string",
          description: "Order number as spoken by the customer.",
        },
      },
      required: ["orderId"],
    },
  },
  {
    type: "function",
    name: "get_company_summary",
    strict: false,
    description:
      "Summarize the authenticated customer's company orders for the current month.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        period: {
          type: "string",
          enum: ["current_month"],
          description: "Reporting period. Only current_month is supported.",
        },
      },
    },
  },
];

export const geminiFunctionDeclarations = openaiTools.map((tool) => ({
  name: tool.name,
  description: tool.description ?? "",
  parametersJsonSchema: tool.parameters,
}));

export async function executeTool(
  name: string,
  rawArgs: string,
  context: Parameters<ToolHandler>[1]
): Promise<ToolResult> {
  const handler = toolHandlers[name as ToolName];
  if (!handler) {
    return { ok: false, code: "UNKNOWN_TOOL", message: "Unknown tool" };
  }

  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
  } catch {
    return {
      ok: false,
      code: "INVALID_ARGUMENTS",
      message: "Tool arguments were not valid JSON",
    };
  }

  if (args && typeof args === "object") {
    delete args.customerId;
  }

  return handler(args, context);
}
