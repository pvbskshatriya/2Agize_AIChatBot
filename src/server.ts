import cors from "cors";
import express from "express";
import { assertRuntimeConfig, config } from "./config.js";
import { log } from "./logging.js";
import { chatRouter } from "./routes/chat.routes.js";

assertRuntimeConfig();

const app = express();

const allowedOrigins = new Set([
  config.frontendOrigin,
  config.storefrontOrigin,
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:8000",
  "http://localhost:8001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
  "http://192.168.1.20:3000",
  "http://192.168.1.20:3002",
  "http://192.168.1.20:3003",
  "http://192.168.1.20:8001",
  ...config.extraCorsOrigins,
]);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }
  if (allowedOrigins.has(origin)) {
    return true;
  }
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    || /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Medusa-Cart-Id"],
  })
);
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "2agize-ai-assistant" });
});

app.use("/api", chatRouter);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    log("server.error", {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : "Unhandled error",
    });
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(config.port, () => {
    log("server.started", {
      port: config.port,
      medusa: config.medusaBackendUrl,
      model: config.geminiModel,
      provider: "gemini",
    });
});
