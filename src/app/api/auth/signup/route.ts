import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/db/queries/users";
import { signJWT, setAuthCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: "Email and password are required" } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: "Password must be at least 8 characters" } },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json(
        { error: { message: "Email already registered" } },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser(email.toLowerCase().trim(), passwordHash);

    const token = await signJWT({ userId: user.id, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json(
      { data: { user: { id: user.id, email: user.email } } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
