import { NextResponse } from "next/server";
import { PublishingSchedulerService } from "@/lib/services/publishing-scheduler-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let force = true;
    try {
      const body = await req.json();
      if (typeof body?.force === "boolean") force = body.force;
    } catch {}

    const result = await PublishingSchedulerService.autoGenerateNextPost({ force });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[AutoGenerateAPI] Error:", err);
    let message = err?.message || "Autonomous generation failed";
    if (typeof message === "string" && (message.startsWith("[") || message.startsWith("{"))) {
      try {
        const parsed = JSON.parse(message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          message = parsed.map((p: any) => p.message || p.code).join(", ");
        }
      } catch {}
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
