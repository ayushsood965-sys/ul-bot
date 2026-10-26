import { NextResponse } from "next/server";
import { PublishingSchedulerService } from "@/lib/services/publishing-scheduler-service";

export async function POST() {
  try {
    const result = await PublishingSchedulerService.autoGenerateNextPost();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
