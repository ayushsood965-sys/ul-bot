import { NextResponse } from "next/server";
import db from "@/lib/db";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET() {
  try {
    const brand = await db.brandConfiguration.findFirst({ where: { isActive: true } });
    return NextResponse.json({ brand });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const existing = await db.brandConfiguration.findFirst({ where: { isActive: true } });

    if (!existing) {
      return NextResponse.json({ error: "Brand configuration not found" }, { status: 404 });
    }

    const updated = await db.brandConfiguration.update({
      where: { id: existing.id },
      data: {
        brandName: body.brandName ?? existing.brandName,
        tagline: body.tagline ?? existing.tagline,
        voiceTone: body.voiceTone ?? existing.voiceTone,
        targetAudience: body.targetAudience ?? existing.targetAudience,
        languageMode: body.languageMode ?? existing.languageMode,
        pillarRelationshipsWeight: Number(body.pillarRelationshipsWeight ?? existing.pillarRelationshipsWeight),
        pillarSocialBehaviourWeight: Number(body.pillarSocialBehaviourWeight ?? existing.pillarSocialBehaviourWeight),
        pillarMoneyModernLifeWeight: Number(body.pillarMoneyModernLifeWeight ?? existing.pillarMoneyModernLifeWeight),
        slangVocabulary: typeof body.slangVocabulary === "string" ? body.slangVocabulary : JSON.stringify(body.slangVocabulary),
        forbiddenPhrases: typeof body.forbiddenPhrases === "string" ? body.forbiddenPhrases : JSON.stringify(body.forbiddenPhrases),
      },
    });

    recordAuditLog({
      action: "BRAND_CONFIG_UPDATED",
      category: "CONFIG",
      details: "Updated brand voice, content pillar weights, and slang vocabulary",
      severity: "INFO",
    });

    return NextResponse.json({ success: true, brand: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
