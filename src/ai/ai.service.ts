import { randomUUID } from "node:crypto";
import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import type { Content, FunctionCall, GenerateContentResponse } from "@google/genai";
import { config } from "../config.js";
import { conversationStore } from "../conversation/conversation.store.js";
import { log } from "../logging.js";
import { executeTool, geminiFunctionDeclarations } from "./ai.tools.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import type {
  ChatResponseBody,
  Conversation,
  RequestContext,
} from "./types.js";

// --- OpenAI (keep for later) ---
// import OpenAI from "openai";
// import { openaiTools } from "./ai.tools.js";
// const openai = new OpenAI({
//   apiKey: config.openaiApiKey,
//   timeout: config.openaiTimeoutMs,
// });

const gemini = new GoogleGenAI({
  apiKey: config.geminiApiKey,
  httpOptions: { timeout: config.openaiTimeoutMs },
});

function looksSwahili(message: string): boolean {
  return /oda|yangu|iko|wapi|nataka|tafadhali|sijaweza|namba|samahani|kujua/i.test(
    message
  );
}

function fallbackUnavailable(message: string): string {
  if (looksSwahili(message)) {
    return "Samahani, huduma haipatikani kwa sasa. Tafadhali jaribu tena.";
  }
  return "Sorry, the assistant is temporarily unavailable. Please try again.";
}

function llmFailureMessage(message: string, error: unknown): string {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status)
      : undefined;
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";
  const text = error instanceof Error ? error.message : "";
  const swahili = looksSwahili(message);

  if (
    status === 404 ||
    /NOT_FOUND|no longer available|is not found/i.test(text)
  ) {
    return swahili
      ? "Modeli ya Gemini haipatikani. Tafadhali sasisha GEMINI_MODEL."
      : "That Gemini model is not available for this API key. Set GEMINI_MODEL to a current model such as gemini-3.6-flash.";
  }

  if (
    status === 429 ||
    code === "credit_balance_exhausted" ||
    code === "insufficient_quota" ||
    /RESOURCE_EXHAUSTED|quota|rate limit/i.test(text)
  ) {
    return swahili
      ? "Akaunti ya AI haina quota. Tafadhali jaribu tena baadaye au angalia billing."
      : "The AI provider hit a quota or rate limit. Check Gemini free-tier limits or billing, then try again.";
  }

  if (
    status === 400 ||
    /INVALID_ARGUMENT|thought_signature/i.test(text)
  ) {
    return swahili
      ? "Ombi la AI halikukubaliwa. Tafadhali jaribu tena."
      : "The AI request was rejected. Please try again.";
  }

  if (
    status === 401 ||
    status === 403 ||
    code === "invalid_api_key" ||
    /API key|API_KEY_INVALID|PERMISSION_DENIED/i.test(text)
  ) {
    return swahili
      ? "Ufunguo wa Gemini si sahihi. Tafadhali hakiki GEMINI_API_KEY."
      : "The Gemini API key was rejected. Check GEMINI_API_KEY in the AI service .env file.";
  }

  return fallbackUnavailable(message);
}

function getOrCreateConversation(conversationId?: string): Conversation {
  if (conversationId) {
    const existing = conversationStore.get(conversationId);
    if (existing) {
      return existing;
    }
  }

  const created: Conversation = {
    id: conversationId || randomUUID(),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return conversationStore.upsert(created);
}

function toGeminiHistory(conversation: Conversation): Content[] {
  return conversation.messages.slice(0, -1).map((item) => ({
    role: item.role === "user" ? "user" : "model",
    parts: [{ text: item.content }],
  }));
}

function functionCallsOf(
  response: GenerateContentResponse
): FunctionCall[] {
  return (response.functionCalls ?? []).filter(
    (call): call is FunctionCall => Boolean(call?.name)
  );
}

function isGeminiRateLimit(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  const text = error instanceof Error ? error.message : String(error);
  return status === 429 || /RESOURCE_EXHAUSTED|rate.?limit/i.test(text);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function generateGemini(
  contents: Content[]
): Promise<GenerateContentResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await gemini.models.generateContent({
        model: config.geminiModel,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: geminiFunctionDeclarations }],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
      });
    } catch (error) {
      lastError = error;
      if (!isGeminiRateLimit(error) || attempt === 3) {
        throw error;
      }
      const waitMs = 8_000 * 2 ** attempt;
      console.warn(
        `[gemini] rate limited on ${config.geminiModel}; retry ${attempt + 1}/3 in ${waitMs}ms`
      );
      await sleep(waitMs);
    }
  }

  throw lastError;
}

export async function chat(
  message: string,
  context: RequestContext
): Promise<ChatResponseBody> {
  const conversation = getOrCreateConversation(context.conversationId);
  conversation.messages.push({ role: "user", content: message });

  try {
    const contents: Content[] = [
      ...toGeminiHistory(conversation),
      { role: "user", parts: [{ text: message }] },
    ];

    let response = await generateGemini(contents);

    for (let round = 0; round < config.maxToolRounds; round += 1) {
      const calls = functionCallsOf(response);
      if (!calls.length) {
        break;
      }

      const toolParts = await Promise.all(
        calls.map(async (call) => {
          const started = Date.now();
          const result = await executeTool(
            call.name ?? "",
            JSON.stringify(call.args ?? {}),
            context
          );
          log("tool.invoked", {
            requestId: context.requestId,
            conversationId: conversation.id,
            tool: call.name,
            durationMs: Date.now() - started,
            ok: result.ok,
            code: result.ok ? undefined : result.code,
          });
          return {
            functionResponse: {
              name: call.name,
              id: call.id,
              response: result,
            },
          };
        })
      );

      const modelContent = response.candidates?.[0]?.content;
      contents.push(
        modelContent ?? {
          role: "model",
          parts: calls.map((call) => ({ functionCall: call })),
        }
      );
      contents.push({
        role: "user",
        parts: toolParts,
      });

      response = await generateGemini(contents);
    }

    const answer =
      response.text?.trim() ||
      (looksSwahili(message)
        ? "Samahani, sikuweza kutoa jibu sasa. Tafadhali jaribu tena."
        : "I could not produce a response. Please try again.");

    conversation.messages.push({ role: "assistant", content: answer });
    conversationStore.upsert(conversation);

    return { answer, conversationId: conversation.id };
  } catch (error) {
    log("llm.error", {
      requestId: context.requestId,
      conversationId: conversation.id,
      provider: "gemini",
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : "Gemini request failed",
      status:
        typeof error === "object" && error && "status" in error
          ? (error as { status?: number }).status
          : undefined,
      code:
        typeof error === "object" && error && "code" in error
          ? (error as { code?: string }).code
          : undefined,
    });

    const answer = llmFailureMessage(message, error);
    conversation.messages.push({ role: "assistant", content: answer });
    conversationStore.upsert(conversation);
    return { answer, conversationId: conversation.id };
  }
}

/*
// --- OpenAI Responses API path (restore later) ---
//
// const openai = new OpenAI({
//   apiKey: config.openaiApiKey,
//   timeout: config.openaiTimeoutMs,
// });
//
// type OpenAIFunctionCall = {
//   type: "function_call";
//   name: string;
//   arguments: string;
//   call_id: string;
// };
//
// function asFunctionCalls(output: unknown): OpenAIFunctionCall[] {
//   if (!Array.isArray(output)) return [];
//   return output.filter(
//     (item): item is OpenAIFunctionCall =>
//       Boolean(item) &&
//       typeof item === "object" &&
//       (item as OpenAIFunctionCall).type === "function_call" &&
//       typeof (item as OpenAIFunctionCall).name === "string" &&
//       typeof (item as OpenAIFunctionCall).call_id === "string"
//   );
// }
//
// export async function chatWithOpenAI(
//   message: string,
//   context: RequestContext
// ): Promise<ChatResponseBody> {
//   const conversation = getOrCreateConversation(context.conversationId);
//   conversation.messages.push({ role: "user", content: message });
//
//   let response = await openai.responses.create({
//     model: config.openaiModel,
//     instructions: SYSTEM_PROMPT,
//     tools: openaiTools,
//     store: true,
//     input: [{ role: "user", content: message }],
//     ...(conversation.previousResponseId
//       ? { previous_response_id: conversation.previousResponseId }
//       : {}),
//   });
//
//   for (let round = 0; round < config.maxToolRounds; round += 1) {
//     const calls = asFunctionCalls(response.output);
//     if (!calls.length) break;
//
//     const toolOutputs = await Promise.all(
//       calls.map(async (call) => {
//         const result = await executeTool(call.name, call.arguments, context);
//         return {
//           type: "function_call_output" as const,
//           call_id: call.call_id,
//           output: JSON.stringify(result),
//         };
//       })
//     );
//
//     response = await openai.responses.create({
//       model: config.openaiModel,
//       instructions: SYSTEM_PROMPT,
//       tools: openaiTools,
//       store: true,
//       previous_response_id: response.id,
//       input: toolOutputs,
//     });
//   }
//
//   const answer = response.output_text?.trim() || fallbackUnavailable(message);
//   conversation.previousResponseId = response.id;
//   conversation.messages.push({ role: "assistant", content: answer });
//   conversationStore.upsert(conversation);
//   return { answer, conversationId: conversation.id };
// }
*/
