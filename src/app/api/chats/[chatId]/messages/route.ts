import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getChat } from "@/lib/db/queries/chats";
import { getAnonSessionByToken, getAnonSessionById, incrementAnonCount } from "@/lib/db/queries/anonymous";
import {
  createMessage,
  listMessages,
  updateMessageContent,
  countMessages,
  linkAttachmentsToMessage,
} from "@/lib/db/queries/messages";
import { supabase } from "@/lib/db/client";
import { getProvider, generateTitle, LLMMessage } from "@/lib/llm";
import { downloadFile } from "@/lib/storage/upload";
import { Chat } from "@/types";

export const maxDuration = 30;

const MAX_CONTENT_LENGTH = 32000;
const ANON_QUESTION_LIMIT = 3;

async function verifyOwnership(chatId: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 };

  const chat = await getChat(chatId);
  if (!chat) return { error: "Chat not found", status: 404 };

  if (session.type === "user" && chat.user_id === session.userId) {
    return { chat, session, anonSession: null };
  }

  if (session.type === "anon") {
    const anonSession = await getAnonSessionByToken(session.anonId);
    if (anonSession && chat.anonymous_session_id === anonSession.id) {
      return { chat, session, anonSession };
    }
  }

  return { error: "Forbidden", status: 403 };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const ownership = await verifyOwnership(chatId);
    if ("error" in ownership) {
      return NextResponse.json(
        { error: { message: ownership.error } },
        { status: ownership.status }
      );
    }

    const messages = await listMessages(chatId);
    return NextResponse.json({ data: { messages } });
  } catch (err) {
    console.error("[GET messages]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const ownership = await verifyOwnership(chatId);

  if ("error" in ownership) {
    return NextResponse.json(
      { error: { message: ownership.error } },
      { status: ownership.status }
    );
  }

  const { chat, anonSession } = ownership;

  // Parse body
  let content: string;
  let attachmentIds: string[] = [];
  try {
    const body = await req.json();
    content = body.content?.trim() ?? "";
    attachmentIds = body.attachmentIds ?? [];
  } catch {
    return NextResponse.json({ error: { message: "Invalid request body" } }, { status: 400 });
  }

  if (!content && !attachmentIds.length) {
    return NextResponse.json({ error: { message: "Message content is required" } }, { status: 400 });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: { message: "Message too long" } }, { status: 400 });
  }

  // Anonymous limit check and atomic increment
  if (anonSession) {
    if (anonSession.question_count >= ANON_QUESTION_LIMIT) {
      return NextResponse.json(
        { error: { message: "Free question limit reached", code: "ANON_LIMIT_REACHED" } },
        { status: 403 }
      );
    }
    await incrementAnonCount(anonSession.id);
  }

  // Fetch attachments if any
  let imageBase64Parts: { type: "image_url"; image_url: { url: string } }[] = [];
  let documentContext = "";

  if (attachmentIds.length > 0) {
    const { data: attachments } = await supabase
      .from("attachments")
      .select()
      .in("id", attachmentIds);

    for (const att of attachments ?? []) {
      try {
        const buffer = await downloadFile(att.storage_path);
        if (att.file_type === "image") {
          const base64 = buffer.toString("base64");
          imageBase64Parts.push({
            type: "image_url",
            image_url: { url: `data:${att.mime_type};base64,${base64}` },
          });
        } else if (att.file_type === "document") {
          let text = "";
          if (att.mime_type === "application/pdf") {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
            const result = await pdfParse(buffer);
            text = result.text;
          } else {
            text = buffer.toString("utf-8");
          }
          documentContext += `[Document: ${att.file_name}]\n${text.slice(0, 8000)}\n---\n`;
        }
      } catch (e) {
        console.error("Failed to process attachment", att.id, e);
      }
    }
  }

  // Build message content
  const userContent: LLMMessage["content"] =
    imageBase64Parts.length > 0
      ? [{ type: "text", text: content || "What's in this image?" }, ...imageBase64Parts]
      : content;

  // Insert user message
  const userMessage = await createMessage(chatId, "user", content);

  // Link attachments to user message
  if (attachmentIds.length > 0) {
    await linkAttachmentsToMessage(attachmentIds, userMessage.id);
  }

  // Insert empty assistant message
  const assistantMessage = await createMessage(chatId, "assistant", "");

  // Check if first message (for title generation)
  const msgCount = await countMessages(chatId);
  const isFirstMessage = msgCount <= 2; // user + assistant just inserted

  // Build full conversation history for LLM
  const history = await listMessages(chatId);
  const llmMessages: LLMMessage[] = [
    {
      role: "system",
      content: documentContext
        ? `You are a helpful assistant.\n\n${documentContext}`
        : "You are a helpful assistant.",
    },
    // Previous messages (exclude the just-inserted ones)
    ...history
      .filter((m) => m.id !== userMessage.id && m.id !== assistantMessage.id)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    // New user message with possible images
    { role: "user" as const, content: userContent },
  ];

  // SSE streaming response
  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object | string) => {
        const line = `data: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      try {
        const provider = getProvider(chat.model);
        for await (const chunk of provider.streamChat(llmMessages)) {
          fullText += chunk;
          send({ type: "chunk", content: chunk });
        }

        // Save final content
        await updateMessageContent(assistantMessage.id, fullText);

        // Fire-and-forget title generation on first message
        if (isFirstMessage && content) {
          generateChatTitle(chatId, content, chat).catch(console.error);
        }

        send({ type: "done", messageId: assistantMessage.id });
        send("[DONE]");
      } catch (err) {
        console.error("[stream error]", err);
        send({ type: "error", message: "Stream failed" });
        send("[DONE]");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

async function generateChatTitle(chatId: string, firstMessage: string, chat: Chat) {
  const { updateChat } = await import("@/lib/db/queries/chats");
  const title = await generateTitle(firstMessage);
  await updateChat(chatId, { title });
}
