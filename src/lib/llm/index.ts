import "server-only";
import { LLMProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";

export function getProvider(model: string): LLMProvider {
  if (model.startsWith("gpt-") && process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("placeholder")) {
    return new OpenAIProvider(model);
  }
  if (model.startsWith("gemini-") || model.startsWith("gemini")) return new GeminiProvider(model);
  // Fallback: use Gemini if model is unknown or OpenAI key is missing
  return new GeminiProvider("gemini-flash-lite-latest");
}

export { generateTitle } from "./gemini";
export type { LLMMessage, LLMProvider, ContentPart } from "./types";
