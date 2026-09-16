export type ToolName =
  | "search_products"
  | "get_product_details"
  | "get_customer_orders"
  | "get_order_details"
  | "get_company_summary";

export type AuthContext = {
  customerId?: string;
  companyId?: string;
  companyName?: string;
  customerToken?: string;
};

export type RequestContext = AuthContext & {
  requestId: string;
  conversationId: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: string;
  messages: ChatMessage[];
  previousResponseId?: string;
  createdAt: number;
  updatedAt: number;
};

export type ToolResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "UNAUTHORIZED"
        | "INVALID_ARGUMENTS"
        | "MEDUSA_ERROR"
        | "TIMEOUT"
        | "UNKNOWN_TOOL";
      message: string;
    };

export type ToolHandler = (
  args: Record<string, unknown>,
  context: RequestContext
) => Promise<ToolResult>;

export type ChatRequestBody = {
  message: string;
  conversationId?: string;
};

export type ChatResponseBody = {
  answer: string;
  conversationId: string;
};
