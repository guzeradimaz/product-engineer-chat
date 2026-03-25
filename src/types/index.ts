export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AnonSession {
  id: string;
  session_token: string;
  question_count: number;
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string | null;
  anonymous_session_id: string | null;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  message_id: string | null;
  file_name: string;
  file_type: "image" | "document";
  storage_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  signed_url?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface MessageWithAttachments extends Message {
  attachments: Attachment[];
}

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: { message: string; code?: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type LLMModel = "gemini-flash-lite-latest" | "gemini-2.5-flash";

export const LLM_MODELS: { value: LLMModel; label: string; description: string }[] = [
  { value: "gemini-flash-lite-latest", label: "Gemini Flash Lite", description: "Google — Fast & free" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Google — Most capable" },
];
