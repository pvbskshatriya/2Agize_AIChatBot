import { z } from "zod";
import type { ToolHandler, ToolName, ToolResult } from "../ai/types.js";
import { getCompanySummary } from "../medusa/company.service.js";

const schema = z.object({
  period: z.enum(["current_month"]).optional(),
});

function invalid(error: z.ZodError): ToolResult {
  return {
    ok: false,
    code: "INVALID_ARGUMENTS",
    message: error.issues.map((issue) => issue.message).join("; "),
  };
}

export const getCompanySummaryTool: ToolHandler = async (args, context) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  return getCompanySummary(context, parsed.data.period ?? "current_month");
};

export const companyToolHandlers: Partial<Record<ToolName, ToolHandler>> = {
  get_company_summary: getCompanySummaryTool,
};
