import { NextResponse } from "next/server";
import { PublishingSchedulerService } from "@/lib/services/publishing-scheduler-service";

export async function POST(req: Request) {
  try {
    const { postId, scheduledFor } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    let date: Date;
    if (scheduledFor) {
      date = new Date(scheduledFor);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid scheduledFor date format" }, { status: 400 });
      }
    } else {
      // Automatically calculate next available 4-5 hour interval slot
      date = await PublishingSchedulerService.getNextPublishSlot();
    }

    const job = await PublishingSchedulerService.schedulePost(postId, date);

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
