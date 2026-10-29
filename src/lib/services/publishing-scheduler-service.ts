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

    // Check rate limit spacing: protect against rapid successive publishing
    const spacingSetting = await db.systemSetting.findUnique({ where: { key: "min_spacing_seconds" } });
    const minSpacingSeconds = spacingSetting?.value ? parseInt(spacingSetting.value, 10) : 300;

    const lastPublished = await db.contentPost.findFirst({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    });

    if (lastPublished?.publishedAt && workerId !== "manual-admin-trigger" && workerId !== "test-worker") {
      const elapsedSeconds = (now.getTime() - lastPublished.publishedAt.getTime()) / 1000;
      if (elapsedSeconds < minSpacingSeconds) {
        return { processed: 0, published: 0, failed: 0 };
      }
    }

    // 1. Find jobs ready to publish (scheduledFor <= now and status == SCHEDULED)
    // Worker processes 1 due job at a time to guarantee proper interval spacing between live posts
    const batchSize = workerId === "manual-admin-trigger" || workerId === "test-worker" ? 5 : 1;
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
      take: batchSize,
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

  // Helper to construct a Date object for a specific "HH:mm" slot in the configured timezone (default Asia/Kolkata).
  public static getSlotDateTime(
    slotTime: string,
    dayOffset: number = 0,
    timezone: string = "Asia/Kolkata"
  ): Date {
    const [hStr, mStr] = slotTime.split(":");
    const hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const year = Number(parts.find((p) => p.type === "year")?.value || now.getFullYear());
    const month = Number(parts.find((p) => p.type === "month")?.value || now.getMonth() + 1) - 1;
    const day = Number(parts.find((p) => p.type === "day")?.value || now.getDate()) + dayOffset;

    // For Asia/Kolkata, offset is +05:30 (330 minutes)
    const offsetMinutes = timezone === "Asia/Kolkata" ? 330 : 0;
    const targetUtcMs = Date.UTC(year, month, day, hours, minutes) - offsetMinutes * 60 * 1000;
    return new Date(targetUtcMs);
  }

  // Calculate the next available publishing slot with 4-5 hours interval throughout the day
  public static async getNextPublishSlot(referenceDate: Date = new Date()): Promise<Date> {
    const tzSetting = await db.systemSetting.findUnique({ where: { key: "timezone" } });
    const timezone = tzSetting?.value || "Asia/Kolkata";

    // 1. Fetch enabled schedule slots from DB, or fallback to standard 4-hour spaced slots
    const dbSlots = await db.publishingSchedule.findMany({
      where: { isEnabled: true },
      orderBy: { slotTime: "asc" },
    });

    const defaultSlots = ["08:30", "12:30", "16:30", "20:30", "23:30"];
    const slotTimes = dbSlots.length > 0 ? dbSlots.map((s) => s.slotTime) : defaultSlots;

    // Minimum gap required between consecutive posts: 2.5 hours (150 mins)
    const MIN_INTERVAL_MS = 150 * 60 * 1000;

    // 2. Fetch all upcoming or recent jobs (today and future) to check existing occupation
    const startOfToday = this.getSlotDateTime("00:00", 0, timezone);
    const existingJobs = await db.publishingJob.findMany({
      where: {
        status: { in: ["SCHEDULED", "CLAIMED", "PUBLISHED"] },
        scheduledFor: { gte: startOfToday },
      },
      orderBy: { scheduledFor: "asc" },
    });

    // Also check the most recent published post to ensure spacing from recent activity
    const lastPublishedPost = await db.contentPost.findFirst({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    });

    const lastPublishTime = lastPublishedPost?.publishedAt?.getTime() || 0;
    const nowMs = referenceDate.getTime();

    // 3. Search today, tomorrow, and day after tomorrow slots
    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      for (const slotTime of slotTimes) {
        const slotDate = this.getSlotDateTime(slotTime, dayOffset, timezone);
        const slotMs = slotDate.getTime();

        // Must be in the future (at least 2 minutes from now)
        if (slotMs < nowMs + 2 * 60 * 1000) {
          continue;
        }

        // Must be at least MIN_INTERVAL_MS after the last published post
        if (lastPublishTime > 0 && slotMs - lastPublishTime < MIN_INTERVAL_MS) {
          continue;
        }

        // Check if any existing job is already occupying this slot (within 75 minutes)
        const isOccupied = existingJobs.some((job) => {
          const diff = Math.abs(job.scheduledFor.getTime() - slotMs);
          return diff < 75 * 60 * 1000;
        });

        if (isOccupied) {
          continue;
        }

        // Check spacing with the latest existing scheduled job before this slot
        const jobsBefore = existingJobs.filter((job) => job.scheduledFor.getTime() < slotMs);
        if (jobsBefore.length > 0) {
          const latestBefore = jobsBefore[jobsBefore.length - 1];
          if (slotMs - latestBefore.scheduledFor.getTime() < MIN_INTERVAL_MS) {
            continue;
          }
        }

        // Check spacing with the earliest existing scheduled job after this slot
        const jobsAfter = existingJobs.filter((job) => job.scheduledFor.getTime() > slotMs);
        if (jobsAfter.length > 0) {
          const earliestAfter = jobsAfter[0];
          if (earliestAfter.scheduledFor.getTime() - slotMs < MIN_INTERVAL_MS) {
            continue;
          }
        }

        // Valid slot found!
        return slotDate;
      }
    }

    // Fallback if all standard slots are exhausted: 4 hours after the latest job or now
    const latestJobMs = existingJobs.length > 0
      ? existingJobs[existingJobs.length - 1].scheduledFor.getTime()
      : nowMs;
    const fallbackMs = Math.max(nowMs, latestJobMs) + 4 * 60 * 60 * 1000;
    return new Date(fallbackMs);
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

    // Check count today in operating timezone
    const tzSetting = await db.systemSetting.findUnique({ where: { key: "timezone" } });
    const timezone = tzSetting?.value || "Asia/Kolkata";
    const startOfDay = this.getSlotDateTime("00:00", 0, timezone);
    const endOfDay = this.getSlotDateTime("23:59", 0, timezone);

    const postsToday = await db.contentPost.count({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
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

    const isCarousel = !!(generated.slides && generated.slides.length > 1);

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
        suggestedTemplate: generated.suggestedTemplate || (isCarousel ? "MULTI_SLIDE_CAROUSEL" : "THE_COURTROOM"),
        optionsJson: generated.options ? JSON.stringify(generated.options) : null,
        auraPoints: generated.auraPoints ? Number(generated.auraPoints) : null,
        status: "APPROVED",
        moderationStatus: modCheck.passed ? "PASSED" : "FLAGGED",
        qualityScore: 8.8,
        isCarousel,
        slideCount: generated.slides?.length || 1,
        contentFingerprint: `fp_${contentId}_${Date.now()}`,
        renderedAssetUrl: `/api/creative/render/${contentId}`,
      },
    });

    // Persist Engine 5 carousel slides if present
    if (isCarousel && generated.slides && Array.isArray(generated.slides)) {
      for (const s of generated.slides) {
        const bodyToStore =
          s.chatMessages && s.chatMessages.length > 0
            ? JSON.stringify({
                contactName: s.chatContactName || "Chat Evidence",
                messages: s.chatMessages,
                originalBody: s.bodyText,
              })
            : s.bodyText;

        await db.contentSlide.create({
          data: {
            postId: newPost.id,
            slideIndex: s.slideIndex,
            slideType: s.slideType,
            headline: s.headline,
            subtext: s.subtext,
            badgeText: s.badgeText || `SLIDE ${s.slideIndex}`,
            bodyText: bodyToStore,
            renderedImageUrl: `/api/creative/render/${contentId}?slide=${s.slideIndex}`,
          },
        });
      }
    }

    // Schedule for the next available publishing slot spaced across the day (4-5 hours interval)
    const scheduledTime = await this.getNextPublishSlot();
    const job = await this.schedulePost(newPost.id, scheduledTime);

    const timeString = scheduledTime.toLocaleTimeString("en-IN", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
    });

    recordAuditLog({
      action: "AUTO_POST_GENERATED_AND_QUEUED",
      category: "AI_GEN",
      details: `Autonomous post created and queued: [${contentId}] "${newPost.title}" for ${timeString} IST (${scheduledTime.toISOString()})`,
      severity: "INFO",
    });

    return {
      success: true,
      post: newPost,
      job,
      message: `Generated and queued [${contentId}] "${newPost.title}" for ${timeString} IST`,
    };
  }
}
