import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/db/queries/users";
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

    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json(
        { error: { message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: { message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const token = await signJWT({ userId: user.id, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({
      data: { user: { id: user.id, email: user.email } },
    });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
