import { NextResponse } from "next/server";
import { authenticateUser, createSessionToken, setSessionCookie } from "@/lib/services/auth-service";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken(user);
    await setSessionCookie(token);

    recordAuditLog({
      action: "USER_LOGIN_SUCCESS",
      category: "AUTH",
      details: `User ${user.email} logged in successfully`,
      actorId: user.userId,
      actorEmail: user.email,
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
