import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getChat, updateChat, deleteChat } from "@/lib/db/queries/chats";
import { getAnonSessionByToken } from "@/lib/db/queries/anonymous";
import { Chat } from "@/types";

async function verifyOwnership(chatId: string): Promise<{ chat: Chat } | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const chat = await getChat(chatId);
  if (!chat) {
    return NextResponse.json({ error: { message: "Chat not found" } }, { status: 404 });
  }

  if (session.type === "user" && chat.user_id === session.userId) {
    return { chat };
  }

  if (session.type === "anon") {
    const anonSession = await getAnonSessionByToken(session.anonId);
    if (anonSession && chat.anonymous_session_id === anonSession.id) {
      return { chat };
    }
  }

  return NextResponse.json({ error: { message: "Forbidden" } }, { status: 403 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const result = await verifyOwnership(chatId);
  if (result instanceof NextResponse) return result;
  return NextResponse.json({ data: { chat: result.chat } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const result = await verifyOwnership(chatId);
    if (result instanceof NextResponse) return result;

    const { title } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: { message: "Title is required" } }, { status: 400 });
    }

    const updated = await updateChat(chatId, { title: title.trim() });
    return NextResponse.json({ data: { chat: updated } });
  } catch (err) {
    console.error("[PATCH /api/chats/:id]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const result = await verifyOwnership(chatId);
    if (result instanceof NextResponse) return result;

    await deleteChat(chatId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/chats/:id]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
