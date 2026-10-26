import { NextResponse } from "next/server";
import { MetaInstagramService } from "@/lib/services/meta-instagram-service";
import db from "@/lib/db";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function GET() {
  try {
    const health = await MetaInstagramService.checkConnectionHealth();
    const account = await db.instagramAccount.findFirst({
      include: { tokenMetadata: true },
    });

    return NextResponse.json({
      health,
      account,
      isCredentialsConfigured: MetaInstagramService.isCredentialsConfigured(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken, accountId, isMockMode } = body;

    const existing = await db.instagramAccount.findFirst({
      include: { tokenMetadata: true },
    });

    if (isMockMode !== undefined) {
      if (existing) {
        await db.instagramAccount.update({
          where: { id: existing.id },
          data: { isMockMode: !!isMockMode, status: isMockMode ? "MOCK_ACTIVE" : "CONNECTED" },
        });
      }
    }

    if (accessToken && accountId) {
      if (existing) {
        await db.instagramAccount.update({
          where: { id: existing.id },
          data: {
            igUserId: accountId,
            status: "CONNECTED",
            isMockMode: false,
          },
        });
        if (existing.tokenMetadata) {
          await db.metaTokenMetadata.update({
            where: { id: existing.tokenMetadata.id },
            data: { accessTokenEncrypted: accessToken, isValid: true },
          });
        }
      }
    }

    recordAuditLog({
      action: "INSTAGRAM_CONNECTION_UPDATED",
      category: "CONFIG",
      details: `Updated Instagram connection settings. Mode: ${isMockMode ? "MOCK" : "LIVE"}`,
      severity: "INFO",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
