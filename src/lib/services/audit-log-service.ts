import db from "@/lib/db";

export type AuditCategory =
  | "AI_GEN"
  | "EDITORIAL"
  | "SCHEDULE"
  | "PUBLISH"
  | "CONFIG"
  | "AUTH"
  | "MODERATION";

export type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface LogAuditParams {
  action: string;
  category: AuditCategory;
  details: string;
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  severity?: AuditSeverity;
}

export async function recordAuditLog(params: LogAuditParams) {
  try {
    return await db.auditLog.create({
      data: {
        action: params.action,
        category: params.category,
        details: params.details,
        actorId: params.actorId || null,
        actorEmail: params.actorEmail || null,
        ipAddress: params.ipAddress || null,
        severity: params.severity || "INFO",
      },
    });
  } catch (error) {
    console.error("[AuditLogService] Failed to record audit log:", error);
    return null;
  }
}
