export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface LLMProvider {
  streamChat(messages: LLMMessage[]): AsyncIterable<string>;
}
