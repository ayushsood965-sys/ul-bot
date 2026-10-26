import { NextResponse } from "next/server";
import db from "@/lib/db";
import { PublishingSchedulerService } from "@/lib/services/publishing-scheduler-service";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET() {
  try {
    const jobs = await db.publishingJob.findMany({
      orderBy: { scheduledFor: "asc" },
      include: {
        post: {
          select: {
            id: true,
            contentId: true,
            title: true,
            pillar: true,
            format: true,
            hook: true,
            caption: true,
            status: true,
            isCarousel: true,
            slideCount: true,
            renderedAssetUrl: true,
          },
        },
      },
    });

    const isPaused = await PublishingSchedulerService.isPublishingPaused();

    return NextResponse.json({ jobs, isPaused });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, jobId, postId } = body;

    // Action 1: Publish Now (Trigger immediate execution)
    if (action === "publish_now") {
      const result = await PublishingSchedulerService.processDueJobs("manual-admin-trigger");
      return NextResponse.json({ success: true, result });
    }

    // Action 2: Cancel Job
    if (action === "cancel") {
      if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
      const job = await db.publishingJob.update({
        where: { id: jobId },
        data: { status: "CANCELLED" },
        include: { post: true },
      });

      if (job.postId) {
        await db.contentPost.update({
          where: { id: job.postId },
          data: { status: "CANCELLED" },
        });
      }

      recordAuditLog({
        action: "PUBLISH_JOB_CANCELLED",
        category: "SCHEDULE",
        details: `Cancelled publishing job [${job.jobId}] for post ${job.post.contentId}`,
        severity: "WARNING",
      });

      return NextResponse.json({ success: true, job });
    }

    // Action 3: Retry Job
    if (action === "retry") {
      if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
      const job = await db.publishingJob.update({
        where: { id: jobId },
        data: { status: "SCHEDULED", scheduledFor: new Date(), attempts: 0, lastError: null },
      });
      return NextResponse.json({ success: true, job });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
