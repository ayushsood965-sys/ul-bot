import db from "@/lib/db";
import { MetaInstagramService } from "./meta-instagram-service";
import { recordAuditLog } from "./audit-log-service";
import { AIService } from "./ai-service";
import { runContentModeration } from "./moderation-service";

export class PublishingSchedulerService {
  // Check if publishing is globally paused via Emergency Kill-Switch
  public static async isPublishingPaused(): Promise<boolean> {
    const setting = await db.systemSetting.findUnique({
      where: { key: "emergency_publish_pause" },
    });
    return setting?.value === "true";
  }

  // Schedule a post for a specific future timestamp
  public static async schedulePost(postId: string, scheduledFor: Date): Promise<any> {
    const post = await db.contentPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error("Post not found");

    if (
      post.status !== "APPROVED" &&
      post.status !== "DRAFT" &&
      post.status !== "NEEDS_REVIEW" &&
      post.status !== "SCHEDULED"
    ) {
      throw new Error(`Cannot schedule post in status: ${post.status}`);
    }

    const idempotencyKey = `pub_job_${post.id}_${scheduledFor.getTime()}`;

    // Create or update publishing job
    const job = await db.publishingJob.upsert({
      where: { idempotencyKey },
      update: {
        scheduledFor,
        status: "SCHEDULED",
        attempts: 0,
        lastError: null,
      },
      create: {
        jobId: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        postId: post.id,
        scheduledFor,
        status: "SCHEDULED",
        idempotencyKey,
      },
    });

    // Update post status to SCHEDULED
    await db.contentPost.update({
      where: { id: post.id },
      data: {
        status: "SCHEDULED",
        scheduledPublishAt: scheduledFor,
      },
    });

    recordAuditLog({
      action: "POST_SCHEDULED",
      category: "SCHEDULE",
      details: `Scheduled Case/Post [${post.contentId}] for ${scheduledFor.toISOString()}`,
      severity: "INFO",
    });

    return job;
  }

  // Claim and execute next ready publishing jobs
  public static async processDueJobs(workerId: string = "default-worker"): Promise<{
    processed: number;
    published: number;
    failed: number;
  }> {
    if (await this.isPublishingPaused()) {
      console.log("[PublishingScheduler] Publishing is currently PAUSED by emergency stop.");
      return { processed: 0, published: 0, failed: 0 };
    }

    const now = new Date();

    // 1. Find jobs ready to publish (scheduledFor <= now and status == SCHEDULED)
    const dueJobs = await db.publishingJob.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: now },
      },
      include: {
        post: {
          include: { slides: true },
        },
      },
      take: 5,
    });

    let publishedCount = 0;
    let failedCount = 0;

    for (const job of dueJobs) {
      // 2. Claim job atomically with worker ID
      const claimed = await db.publishingJob.updateMany({
        where: {
          id: job.id,
          status: "SCHEDULED",
        },
        data: {
          status: "CLAIMED",
          claimedAt: now,
          claimedByWorker: workerId,
        },
      });

      if (claimed.count === 0) continue; // Claimed by another worker

      console.log(`[PublishingScheduler] Claimed job ${job.jobId} for post ${job.post.contentId}`);

      try {
        // Transition post to PUBLISHING
        await db.contentPost.update({
          where: { id: job.postId },
          data: { status: "PUBLISHING" },
        });

        // Determine image URL or carousel URLs (ensure public domain for Meta Graph API)
        const appUrl =
          process.env.APP_URL && !process.env.APP_URL.includes("localhost")
            ? process.env.APP_URL
            : "https://unfilteredlore.scholarhubhpu.in";
        let publishRes;

        if (job.post.isCarousel && job.post.slides.length > 1) {
          const slideUrls = job.post.slides
            .sort((a, b) => a.slideIndex - b.slideIndex)
            .map((s) => `${appUrl}/api/creative/render/${job.post.contentId}?slide=${s.slideIndex}`);

          publishRes = await MetaInstagramService.publishCarousel({
            imageUrls: slideUrls,
            caption: job.post.caption,
            postId: job.post.id,
          });
        } else {
          const singleUrl = `${appUrl}/api/creative/render/${job.post.contentId}`;
          publishRes = await MetaInstagramService.publishSingleImage({
            imageUrl: singleUrl,
            caption: job.post.caption,
            postId: job.post.id,
          });
        }

        if (publishRes.success && publishRes.mediaId) {
          // Success transition
          await db.contentPost.update({
            where: { id: job.postId },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
              igMediaId: publishRes.mediaId,
              igPermalink: publishRes.permalink,
            },
          });

          await db.publishingJob.update({
            where: { id: job.id },
            data: { status: "PUBLISHED" },
          });

          // Create PublishedMedia record for analytics tracking
          const igAcc = await db.instagramAccount.findFirst();
          if (igAcc) {
            await db.publishedMedia.create({
              data: {
                accountId: igAcc.id,
                postId: job.postId,
                igMediaId: publishRes.mediaId,
                mediaType: job.post.isCarousel ? "CAROUSEL_ALBUM" : "IMAGE",
                permalink: publishRes.permalink,
                caption: job.post.caption,
                publishedAt: new Date(),
              },
            });
          }

          publishedCount++;
        } else {
          throw new Error(publishRes.error || "Unknown Meta publishing error");
        }
      } catch (err: any) {
        console.error(`[PublishingScheduler] Failed publishing job ${job.id}:`, err);
        failedCount++;

        const newAttempts = job.attempts + 1;
        const isExhausted = newAttempts >= job.maxAttempts;

        await db.publishingJob.update({
          where: { id: job.id },
          data: {
            status: isExhausted ? "FAILED" : "SCHEDULED",
            attempts: newAttempts,
            lastError: err.message,
            nextRetryAt: isExhausted ? null : new Date(Date.now() + 1000 * 60 * 5 * newAttempts),
          },
        });

        await db.contentPost.update({
          where: { id: job.postId },
          data: {
            status: isExhausted ? "PUBLISH_FAILED" : "SCHEDULED",
          },
        });

        recordAuditLog({
          action: "PUBLISH_ATTEMPT_FAILED",
          category: "PUBLISH",
          details: `Job ${job.jobId} failed attempt ${newAttempts}/${job.maxAttempts}: ${err.message}`,
          severity: "ERROR",
        });
      }
    }

    return { processed: dueJobs.length, published: publishedCount, failed: failedCount };
  }

  // Recover interrupted jobs upon worker startup
  public static async recoverStaleJobs(): Promise<number> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const staleJobs = await db.publishingJob.updateMany({
      where: {
        status: "CLAIMED",
        claimedAt: { lt: tenMinutesAgo },
      },
      data: {
        status: "SCHEDULED",
        claimedByWorker: null,
      },
    });

    if (staleJobs.count > 0) {
      console.log(`[PublishingScheduler] Recovered ${staleJobs.count} stale/crashed publishing jobs.`);
      recordAuditLog({
        action: "STALE_JOBS_RECOVERED",
        category: "SCHEDULE",
        details: `Reset ${staleJobs.count} uncompleted claimed jobs to SCHEDULED state.`,
        severity: "WARNING",
      });
    }

    return staleJobs.count;
  }

  // Autonomous content generation & queue scheduling
  public static async autoGenerateNextPost(options?: { force?: boolean }): Promise<{ success: boolean; post?: any; job?: any; message: string }> {
    if (await this.isPublishingPaused()) {
      return { success: false, message: "Publishing is paused by emergency stop." };
    }

    const genEnabled = await db.systemSetting.findUnique({ where: { key: "automation_generation_enabled" } });
    if (genEnabled?.value === "false" && !options?.force) {
      return { success: false, message: "Automation content generation is disabled in settings." };
    }

    const targetSetting = await db.systemSetting.findUnique({ where: { key: "daily_publishing_target" } });
    const dailyTarget = targetSetting?.value ? parseInt(targetSetting.value, 10) : 5;

    // Check count today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const postsToday = await db.contentPost.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    });

    if (!options?.force && postsToday >= dailyTarget) {
      return { success: false, message: `Daily target of ${dailyTarget} posts already reached today (${postsToday} created).` };
    }

    // Pick rotating pillar & format
    const pillars = ["RELATIONSHIPS", "SOCIAL_BEHAVIOUR", "MONEY_MODERN_LIFE"] as const;
    const formats = ["THE_CASE", "UNPOPULAR_OPINION", "AURA_TAX", "TWO_SIDES"] as const;
    const pillar = pillars[postsToday % pillars.length];
    const format = formats[postsToday % formats.length];

    // Generate idea & post
    const { ideas } = await AIService.generateIdeas({ pillar, format, count: 1 });
    const topIdea = ideas[0];
    if (!topIdea) {
      throw new Error("AI did not produce an idea candidate");
    }

    const { post: generated } = await AIService.generateStructuredPost({
      ideaPremise: topIdea.premise,
      pillar,
      format,
    });

    const modCheck = runContentModeration(
      `${generated.hook} ${generated.mainNarrative} ${generated.caption}`,
      { source: format }
    );

    const contentId = `TVR-${new Date().getFullYear()}-${format.slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;

    const newPost = await db.contentPost.create({
      data: {
        contentId,
        title: generated.title,
        pillar: generated.pillar,
        format: generated.format,
        primaryLanguage: "en-IN",
        targetAudience: "Indian Gen Z",
        hook: generated.hook,
        mainNarrative: modCheck.sanitizedText || generated.mainNarrative,
        caption: generated.caption,
        hashtags: JSON.stringify(generated.hashtags || []),
        callToAction: generated.callToAction,
        suggestedTemplate: generated.suggestedTemplate || "THE_COURTROOM",
        optionsJson: generated.options ? JSON.stringify(generated.options) : null,
        auraPoints: generated.auraPoints ? Number(generated.auraPoints) : null,
        status: "APPROVED",
        moderationStatus: modCheck.passed ? "PASSED" : "FLAGGED",
        qualityScore: 8.8,
        isCarousel: false,
        slideCount: 1,
        contentFingerprint: `fp_${contentId}_${Date.now()}`,
        renderedAssetUrl: `/api/creative/render/${contentId}`,
      },
    });

    // Schedule for immediate publication or next slot (+5 minutes)
    const scheduledTime = new Date(Date.now() + 5 * 60 * 1000);
    const job = await this.schedulePost(newPost.id, scheduledTime);

    recordAuditLog({
      action: "AUTO_POST_GENERATED_AND_QUEUED",
      category: "AI_GEN",
      details: `Autonomous post created and queued: [${contentId}] "${newPost.title}" for ${scheduledTime.toLocaleTimeString()}`,
      severity: "INFO",
    });

    return { success: true, post: newPost, job, message: `Generated and queued [${contentId}] "${newPost.title}"` };
  }
}
