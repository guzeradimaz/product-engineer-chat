import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/db/queries/users";

export async function GET() {
  const session = await getSession();

  if (!session || session.type !== "user") {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
  }

  return NextResponse.json({ data: { user: { id: user.id, email: user.email } } });
}
