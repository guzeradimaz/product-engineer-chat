import "server-only";
import OpenAI from "openai";
import { LLMMessage, LLMProvider } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class OpenAIProvider implements LLMProvider {
  constructor(private model: string) {}

  async *streamChat(messages: LLMMessage[]): AsyncIterable<string> {
    const stream = await openai.chat.completions.create({
      model: this.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}

export async function generateTitle(firstMessage: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Create a very short title (4-6 words) for a conversation that starts with: "${firstMessage.slice(0, 200)}". Reply with only the title, no quotes or punctuation.`,
      },
    ],
    max_tokens: 20,
    temperature: 0.7,
  });
  return completion.choices[0]?.message.content?.trim() ?? "New Chat";
}
