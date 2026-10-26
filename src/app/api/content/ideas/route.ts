import { NextResponse } from "next/server";
import db from "@/lib/db";
import { AIService } from "@/lib/services/ai-service";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pillar = searchParams.get("pillar");
    const status = searchParams.get("status");

    const where: any = {};
    if (pillar && pillar !== "ALL") where.pillar = pillar;
    if (status && status !== "ALL") where.status = status;

    const ideas = await db.contentIdea.findMany({
      where,
      orderBy: { overallScore: "desc" },
      take: 50,
    });

    return NextResponse.json({ ideas });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pillar = body.pillar || "RELATIONSHIPS";
    const format = body.format || "THE_CASE";
    const count = body.count || 3;

    // Generate with AI service (Gemini primary -> OpenRouter fallback)
    const { ideas, meta } = await AIService.generateIdeas({ pillar, format, count });

    // Persist ideas into database
    const savedIdeas = [];
    for (const idea of ideas) {
      const fingerprint = `idea_${idea.pillar}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const saved = await db.contentIdea.create({
        data: {
          title: idea.title,
          pillar: idea.pillar,
          format: idea.format,
          premise: idea.premise,
          hook: idea.hook,
          scoreHook: idea.scoreHook,
          scoreRelatability: idea.scoreRelatability,
          scoreDebate: idea.scoreDebate,
          scoreOriginality: idea.scoreOriginality,
          overallScore: idea.overallScore,
          fingerprint,
          status: "SUGGESTED",
        },
      });
      savedIdeas.push(saved);
    }

    recordAuditLog({
      action: "AI_IDEAS_GENERATED",
      category: "AI_GEN",
      details: `Generated ${savedIdeas.length} ideas using ${meta.providerUsed} (${meta.modelUsed})`,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, ideas: savedIdeas, meta });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate ideas" }, { status: 500 });
  }
}
