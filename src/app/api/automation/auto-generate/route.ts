import { NextResponse } from "next/server";
import { PublishingSchedulerService } from "@/lib/services/publishing-scheduler-service";

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
