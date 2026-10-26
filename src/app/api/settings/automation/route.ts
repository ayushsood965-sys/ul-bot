import { NextResponse } from "next/server";
import db from "@/lib/db";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET() {
  try {
    const settings = await db.systemSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return NextResponse.json({ settings: map });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json(); // e.g. { emergency_publish_pause: "true", ... }

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
        await db.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    const isEmergency = body.emergency_publish_pause === true || body.emergency_publish_pause === "true";

    recordAuditLog({
      action: isEmergency ? "EMERGENCY_PAUSE_TRIGGERED" : "AUTOMATION_SETTINGS_UPDATED",
      category: "CONFIG",
      details: isEmergency
        ? "🚨 EMERGENCY KILL-SWITCH ACTIVATED: All publishing paused."
        : "Updated automation control panel settings.",
      severity: isEmergency ? "CRITICAL" : "INFO",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
