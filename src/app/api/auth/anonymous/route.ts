import { NextResponse } from "next/server";
import { getAnonToken, setAnonCookie } from "@/lib/auth/session";
import { createAnonSession, getAnonSessionByToken } from "@/lib/db/queries/anonymous";

export async function GET() {
  try {
    const token = await getAnonToken();
    if (!token) return NextResponse.json({ data: { questionCount: null } });
    const session = await getAnonSessionByToken(token);
    return NextResponse.json({ data: { questionCount: session?.question_count ?? null } });
  } catch {
    return NextResponse.json({ data: { questionCount: null } });
  }
}

export async function POST() {
  try {
    const existingToken = await getAnonToken();

    if (existingToken) {
      const session = await getAnonSessionByToken(existingToken);
      if (session) {
        return NextResponse.json({
          data: { questionCount: session.question_count },
        });
      }
    }

    // Create new anonymous session
    const session = await createAnonSession();
    await setAnonCookie(session.session_token);

    return NextResponse.json(
      { data: { questionCount: 0 } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[anonymous]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
