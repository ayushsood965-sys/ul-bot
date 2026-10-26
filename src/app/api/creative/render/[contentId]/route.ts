import { NextResponse } from "next/server";
import db from "@/lib/db";
import { CreativeRendererService } from "@/lib/services/creative-renderer-service";
import { Resvg } from "@resvg/resvg-js";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const { searchParams } = new URL(req.url);
    const slideNumber = searchParams.get("slide") ? parseInt(searchParams.get("slide")!, 10) : undefined;
    const format = searchParams.get("format") || "png";
    const download = searchParams.get("download") === "true";

    const post = await db.contentPost.findFirst({
      where: {
        OR: [{ contentId }, { id: contentId }],
      },
      include: {
        slides: { orderBy: { slideIndex: "asc" } },
      },
    });

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    let options = undefined;
    if (post.optionsJson) {
      try {
        options = JSON.parse(post.optionsJson);
      } catch {}
    }

    let headline = post.hook;
    let narrative = post.mainNarrative;
    let slideType = undefined;
    const templateCode = (post.suggestedTemplate || "THE_COURTROOM") as any;

    if (post.isCarousel && post.slides.length > 0) {
      const targetSlide = slideNumber
        ? post.slides.find((s) => s.slideIndex === slideNumber) || post.slides[0]
        : post.slides[0];

      headline = targetSlide.headline || post.hook;
      narrative = targetSlide.bodyText || post.mainNarrative;
      slideType = targetSlide.badgeText || `SLIDE ${targetSlide.slideIndex}/${post.slides.length}`;
    }

    const svg = CreativeRendererService.generateSVG({
      templateCode,
      caseNumber: post.contentId,
      pillar: post.pillar,
      headline,
      narrative,
      options,
      auraPoints: post.auraPoints ?? undefined,
      slideIndex: slideNumber || 1,
      slideTotal: post.slides.length || 1,
      slideType,
      stampText: post.status === "PUBLISHED" ? "VERDICT DELIVERED" : "VERDICT PENDING",
    });

    // If explicit SVG requested or download requested in SVG format
    if (format === "svg") {
      const headers: Record<string, string> = {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      };

      if (download) {
        headers["Content-Disposition"] = `attachment; filename="${post.contentId}${
          slideNumber ? `-slide-${slideNumber}` : ""
        }.svg"`;
      }

      return new Response(svg, { status: 200, headers });
    }

    // Default: Rasterize to high-fidelity PNG for Instagram Meta Graph API and Feed Display
    try {
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: 1080 },
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      const headers: Record<string, string> = {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      };

      if (download) {
        headers["Content-Disposition"] = `attachment; filename="${post.contentId}${
          slideNumber ? `-slide-${slideNumber}` : ""
        }.png"`;
      }

      return new Response(pngBuffer as any, { status: 200, headers });
    } catch (rasterErr: any) {
      console.warn("[CreativeRender] Resvg rasterization fallback to SVG:", rasterErr.message);
      return new Response(svg, {
        status: 200,
        headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
      });
    }
  } catch (err: any) {
    return new Response(`Rendering error: ${err.message}`, { status: 500 });
  }
}
