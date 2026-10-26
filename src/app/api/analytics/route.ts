import { NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [overview, performance] = await Promise.all([
      AnalyticsService.getDashboardMetrics(),
      AnalyticsService.getPerformanceAnalytics(),
    ]);

    return NextResponse.json({ overview, ...performance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
