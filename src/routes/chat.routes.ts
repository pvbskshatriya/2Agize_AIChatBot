import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { chat } from "../ai/ai.service.js";
import { resolveAuthContext } from "../medusa/customer.service.js";
import { log } from "../logging.js";

const chatBodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().trim().min(1).max(80).optional(),
});

function bearerToken(header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

export const chatRouter = Router();

chatRouter.post("/chat", async (req, res) => {
  const requestId = randomUUID();
  const parsed = chatBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request",
      details: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  const conversationId = parsed.data.conversationId || randomUUID();
  const token = bearerToken(req.header("authorization"));
  const auth = await resolveAuthContext(token, requestId);

  log("chat.request", {
    requestId,
    conversationId,
    hasToken: Boolean(token),
    authenticated: Boolean(auth.customerId),
    hasCompany: Boolean(auth.companyId),
  });

  const result = await chat(parsed.data.message, {
    requestId,
    conversationId,
    ...auth,
  });

  log("chat.response", {
    requestId,
    conversationId: result.conversationId,
  });

  res.json(result);
});
