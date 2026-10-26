import { NextResponse } from "next/server";
import { PublishingSchedulerService } from "@/lib/services/publishing-scheduler-service";

export async function POST(req: Request) {
  try {
    const { postId, scheduledFor } = await req.json();

    if (!postId || !scheduledFor) {
      return NextResponse.json({ error: "postId and scheduledFor timestamp are required" }, { status: 400 });
    }

    const date = new Date(scheduledFor);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledFor date format" }, { status: 400 });
    }

    const job = await PublishingSchedulerService.schedulePost(postId, date);

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
