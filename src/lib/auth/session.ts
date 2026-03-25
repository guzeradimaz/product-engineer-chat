import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "auth_token";
const ANON_COOKIE_NAME = "anon_token";

export interface AuthSession {
  type: "user";
  userId: string;
  email: string;
}

export interface AnonSessionCtx {
  type: "anon";
  anonId: string;
}

export type SessionContext = AuthSession | AnonSessionCtx | null;

export async function signJWT(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT({ sub: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function getAnonToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ANON_COOKIE_NAME)?.value;
}

export async function setAnonCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ANON_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSession(): Promise<SessionContext> {
  const authToken = await getAuthToken();
  if (authToken) {
    const payload = await verifyJWT(authToken);
    if (payload) {
      return { type: "user", userId: payload.userId, email: payload.email };
    }
  }

  const anonToken = await getAnonToken();
  if (anonToken) {
    return { type: "anon", anonId: anonToken };
  }

  return null;
}
