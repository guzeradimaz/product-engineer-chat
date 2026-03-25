import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createChat, listChats } from "@/lib/db/queries/chats";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.type !== "user") {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const chats = await listChats(session.userId);
    return NextResponse.json({ data: { chats } });
  } catch (err) {
    console.error("[GET /api/chats]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const model = body.model ?? "gpt-4o";

    let chat;
    if (session.type === "user") {
      chat = await createChat({ userId: session.userId }, model);
    } else {
      // Anonymous: get session ID from token
      const { getAnonSessionByToken } = await import("@/lib/db/queries/anonymous");
      const anonSession = await getAnonSessionByToken(session.anonId);
      if (!anonSession) {
        return NextResponse.json({ error: { message: "Invalid anonymous session" } }, { status: 401 });
      }
      chat = await createChat({ anonId: anonSession.id }, model);
    }

    return NextResponse.json({ data: { chat } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/chats]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
