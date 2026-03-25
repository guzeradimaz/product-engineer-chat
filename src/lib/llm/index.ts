import "server-only";
import { LLMProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";

export function getProvider(model: string): LLMProvider {
  if (model.startsWith("gpt-")) return new OpenAIProvider(model);
  if (model.startsWith("gemini-")) return new GeminiProvider(model);
  throw new Error(`Unknown model: ${model}`);
}

export { generateTitle } from "./openai";
export type { LLMMessage, LLMProvider, ContentPart } from "./types";
