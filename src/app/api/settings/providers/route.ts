import { NextResponse } from "next/server";
import db from "@/lib/db";
import { AIService } from "@/lib/services/ai-service";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET() {
  try {
    const providers = await db.aIProviderConfiguration.findMany({
      orderBy: { isPrimary: "desc" },
    });

    // Mask API keys for security
    const sanitized = providers.map((p) => ({
      ...p,
      hasApiKey: !!(p.apiKeyEncrypted || (p.providerName === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENROUTER_API_KEY)),
      apiKeyEncrypted: undefined,
    }));

    return NextResponse.json({ providers: sanitized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, primaryModel, apiKey, monthlyBudgetUsd, isFallbackEnabled, fallbackModel, temperature } = body;

    const existing = await db.aIProviderConfiguration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Provider configuration not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (primaryModel !== undefined) updateData.primaryModel = primaryModel;
    if (apiKey !== undefined && apiKey.trim().length > 0) updateData.apiKeyEncrypted = apiKey.trim();
    if (monthlyBudgetUsd !== undefined) updateData.monthlyBudgetUsd = Number(monthlyBudgetUsd);
    if (isFallbackEnabled !== undefined) updateData.isFallbackEnabled = !!isFallbackEnabled;
    if (fallbackModel !== undefined) updateData.fallbackModel = fallbackModel;
    if (temperature !== undefined) updateData.temperature = Number(temperature);

    const updated = await db.aIProviderConfiguration.update({
      where: { id },
      data: updateData,
    });

    recordAuditLog({
      action: "AI_PROVIDER_UPDATED",
      category: "CONFIG",
      details: `Updated AI provider settings for ${updated.displayName}`,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, provider: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { provider, apiKey, model } = await req.json();
    const result = await AIService.testConnection(provider || "gemini", apiKey, model);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
