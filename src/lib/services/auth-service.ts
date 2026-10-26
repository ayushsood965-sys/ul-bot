import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "verdict_room_dev_secret_key_32chars_long_2026!"
);
const SESSION_COOKIE_NAME = "tvr_session";
const SESSION_DURATION = 72 * 60 * 60; // 72 hours in seconds

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "OWNER" | "EDITOR" | "VIEWER",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function authenticateUser(email: string, password: string): Promise<UserSessionPayload | null> {
  const cleanInput = email.toLowerCase().trim();
  const normalizedEmail =
    cleanInput === "admin" || cleanInput === "owner" || cleanInput === "ayush"
      ? "owner@unfilteredlore.com"
      : cleanInput;

  let user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user && (cleanInput === "admin" || cleanInput === "owner" || cleanInput === "ayush")) {
    user = await db.user.findFirst({
      where: { role: "OWNER" },
    });
  }

  if (!user) return null;
  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "OWNER" | "EDITOR" | "VIEWER",
  };
}
