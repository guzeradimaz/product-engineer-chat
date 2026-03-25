import "server-only";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { LLMMessage, LLMProvider, ContentPart } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function toGeminiContents(messages: LLMMessage[]): Content[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts:
        typeof m.content === "string"
          ? [{ text: m.content }]
          : (m.content as ContentPart[]).map((p) =>
              p.type === "text"
                ? { text: p.text }
                : {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: p.image_url.url.split(",")[1] ?? "",
                    },
                  }
            ),
    }));
}

export async function generateTitle(firstMessage: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
  const result = await model.generateContent(
    `Create a very short title (4-6 words) for a chat starting with: "${firstMessage.slice(0, 200)}". Reply with only the title.`
  );
  return result.response.text().trim();
}

export class GeminiProvider implements LLMProvider {
  constructor(private model: string) {}

  async *streamChat(messages: LLMMessage[]): AsyncIterable<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const systemInstruction =
      typeof systemMsg?.content === "string" ? systemMsg.content : undefined;

    const geminiModel = genAI.getGenerativeModel({
      model: this.model,
      ...(systemInstruction ? { systemInstruction } : {}),
    });

    const contents = toGeminiContents(messages);
    const result = await geminiModel.generateContentStream({ contents });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
}
