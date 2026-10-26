import { NextResponse } from "next/server";
import db from "@/lib/db";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await db.contentPost.findFirst({
      where: {
        OR: [{ id }, { contentId: id }],
      },
      include: {
        slides: { orderBy: { slideIndex: "asc" } },
        evaluations: { orderBy: { evaluatedAt: "desc" } },
        reviews: { orderBy: { createdAt: "desc" } },
        publishingJobs: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.contentPost.findFirst({
      where: { OR: [{ id }, { contentId: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.hook !== undefined) updateData.hook = body.hook;
    if (body.mainNarrative !== undefined) updateData.mainNarrative = body.mainNarrative;
    if (body.caption !== undefined) updateData.caption = body.caption;
    if (body.hashtags !== undefined) {
      updateData.hashtags = typeof body.hashtags === "string" ? body.hashtags : JSON.stringify(body.hashtags);
    }
    if (body.options !== undefined) {
      updateData.optionsJson = JSON.stringify(body.options);
    }
    if (body.auraPoints !== undefined) {
      updateData.auraPoints = Number(body.auraPoints);
    }
    if (body.suggestedTemplate !== undefined) {
      updateData.suggestedTemplate = body.suggestedTemplate;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const updated = await db.contentPost.update({
      where: { id: existing.id },
      data: updateData,
    });

    // If updating slides in carousel
    if (body.slides && Array.isArray(body.slides)) {
      for (const s of body.slides) {
        if (s.id) {
          await db.contentSlide.update({
            where: { id: s.id },
            data: {
              headline: s.headline,
              subtext: s.subtext,
              bodyText: s.bodyText,
              badgeText: s.badgeText,
            },
          });
        }
      }
    }

    recordAuditLog({
      action: "POST_UPDATED",
      category: "EDITORIAL",
      details: `Updated post [${existing.contentId}]. New status: ${updated.status}`,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.contentPost.findFirst({
      where: { OR: [{ id }, { contentId: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await db.contentPost.delete({ where: { id: existing.id } });

    recordAuditLog({
      action: "POST_DELETED",
      category: "EDITORIAL",
      details: `Deleted post [${existing.contentId}]`,
      severity: "WARNING",
    });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
