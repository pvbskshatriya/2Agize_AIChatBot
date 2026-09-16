import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const models = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite",
];

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: "Reply with ok",
      });
      console.log(model, "OK", Boolean(response.text));
    } catch (error) {
      const err = error as { status?: number; message?: string };
      const snippet = (err.message ?? "").slice(0, 180).replace(/\s+/g, " ");
      console.log(model, "FAIL", err.status, snippet);
    }
  }
}

void main();
