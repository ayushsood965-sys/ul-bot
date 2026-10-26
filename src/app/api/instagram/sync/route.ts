import { NextResponse } from "next/server";
import db from "@/lib/db";
import { MetaInstagramService } from "@/lib/services/meta-instagram-service";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function POST() {
  try {
    const publishedMediaList = await db.publishedMedia.findMany({
      orderBy: { publishedAt: "desc" },
      take: 10,
    });

    let syncedCount = 0;

    for (const item of publishedMediaList) {
      try {
        const insights = await MetaInstagramService.syncPostInsights(item.igMediaId);

        // Update PublishedMedia summary metrics
        await db.publishedMedia.update({
          where: { id: item.id },
          data: {
            latestReach: insights.reach,
            latestImpressions: insights.impressions,
            latestLikes: insights.likes,
            latestComments: insights.comments,
            latestShares: insights.shares,
            latestSaves: insights.saved,
            engagementRate:
              insights.reach > 0
                ? parseFloat(
                    (
                      ((insights.likes + insights.comments + insights.shares + insights.saved) /
                        insights.reach) *
                      100
                    ).toFixed(1)
                  )
                : 0.0,
          },
        });

        // Add Snapshot
        await db.mediaInsightSnapshot.create({
          data: {
            publishedMediaId: item.id,
            reach: insights.reach,
            impressions: insights.impressions,
            likes: insights.likes,
            comments: insights.comments,
            shares: insights.shares,
            saved: insights.saved,
            totalInteractions:
              insights.likes + insights.comments + insights.shares + insights.saved,
          },
        });

        syncedCount++;
      } catch (e) {
        console.warn(`[SyncAPI] Could not sync insights for media ${item.igMediaId}:`, e);
      }
    }

    recordAuditLog({
      action: "INSIGHTS_SYNCHRONIZED",
      category: "PUBLISH",
      details: `Synced Instagram insights for ${syncedCount} published posts.`,
      severity: "INFO",
    });

    return NextResponse.json({ success: true, syncedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
