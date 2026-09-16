import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const config = {
  port: Number(optional("PORT", "3001")),
  openaiApiKey: optional("OPENAI_API_KEY"),
  openaiModel: optional("OPENAI_MODEL", "gpt-4o"),
  geminiApiKey: optional("GEMINI_API_KEY"),
  geminiModel: optional("GEMINI_MODEL", "gemini-3.6-flash"),
  medusaBackendUrl: optional(
    "MEDUSA_BACKEND_URL",
    "http://localhost:9000"
  ).replace(/\/$/, ""),
  medusaPublishableKey: optional("MEDUSA_PUBLISHABLE_KEY"),
  medusaRegionId: optional("MEDUSA_REGION_ID"),
  frontendOrigin: optional("FRONTEND_ORIGIN", "http://localhost:3000"),
  storefrontOrigin: optional("STOREFRONT_ORIGIN", "http://localhost:8001"),
  extraCorsOrigins: optional("CORS_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  medusaTimeoutMs: 15_000,
  openaiTimeoutMs: 45_000,
  maxToolRounds: 8,
};

export function assertRuntimeConfig(): void {
  required("GEMINI_API_KEY");
  // required("OPENAI_API_KEY"); // keep when switching back to OpenAI
  if (!config.medusaPublishableKey) {
    throw new Error("Missing required environment variable: MEDUSA_PUBLISHABLE_KEY");
  }
}
