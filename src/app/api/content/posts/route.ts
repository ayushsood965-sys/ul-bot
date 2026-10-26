import { NextResponse } from "next/server";
import db from "@/lib/db";
import { runContentModeration } from "@/lib/services/moderation-service";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const pillar = searchParams.get("pillar");
    const format = searchParams.get("format");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (pillar && pillar !== "ALL") where.pillar = pillar;
    if (format && format !== "ALL") where.format = format;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { hook: { contains: search } },
        { contentId: { contains: search } },
      ];
    }

    const posts = await db.contentPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        slides: { orderBy: { slideIndex: "asc" } },
        evaluations: { orderBy: { evaluatedAt: "desc" }, take: 1 },
        reviews: { orderBy: { createdAt: "desc" }, take: 1 },
        publishingJobs: { orderBy: { scheduledFor: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ posts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contentId = `TVR-${new Date().getFullYear()}-${body.format?.slice(0, 4) || "POST"}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    // Run automated moderation safety check
    const modResult = runContentModeration(`${body.hook} ${body.mainNarrative} ${body.caption}`, {
      source: body.format,
      contentId,
    });

    const post = await db.contentPost.create({
      data: {
        contentId,
        ideaId: body.ideaId || null,
        title: body.title || "Untitled Post",
        pillar: body.pillar || "RELATIONSHIPS",
        format: body.format || "THE_CASE",
        primaryLanguage: body.primaryLanguage || "en-IN",
        targetAudience: body.targetAudience || "Indian Gen Z",
        hook: body.hook || "",
        mainNarrative: modResult.sanitizedText || body.mainNarrative || "",
        caption: body.caption || "",
        hashtags: typeof body.hashtags === "string" ? body.hashtags : JSON.stringify(body.hashtags || []),
        callToAction: body.callToAction || "Cast your verdict below.",
        suggestedTemplate: body.suggestedTemplate || "THE_COURTROOM",
        optionsJson: body.options ? JSON.stringify(body.options) : null,
        auraPoints: body.auraPoints ? Number(body.auraPoints) : null,
        status: modResult.passed ? "DRAFT" : "NEEDS_REVIEW",
        moderationStatus: modResult.passed ? "PASSED" : "FLAGGED",
        qualityScore: body.qualityScore || 8.5,
        isCarousel: !!body.isCarousel,
        slideCount: body.slides?.length || 1,
        contentFingerprint: `fp_${contentId}_${Date.now()}`,
        renderedAssetUrl: `/api/creative/render/${contentId}`,
      },
    });

    // Create slides if carousel
    if (body.slides && Array.isArray(body.slides)) {
      for (let i = 0; i < body.slides.length; i++) {
        const s = body.slides[i];
        await db.contentSlide.create({
          data: {
            postId: post.id,
            slideIndex: i + 1,
            slideType: s.slideType || "COVER",
            headline: s.headline || "",
            subtext: s.subtext || "",
            badgeText: s.badgeText || `SLIDE ${i + 1}`,
            bodyText: s.bodyText || "",
            renderedImageUrl: `/api/creative/render/${contentId}?slide=${i + 1}`,
          },
        });
      }
    }

    recordAuditLog({
      action: "POST_CREATED",
      category: "EDITORIAL",
      details: `Created draft post [${contentId}]. Moderation status: ${post.moderationStatus}`,
      severity: modResult.passed ? "INFO" : "WARNING",
    });

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
