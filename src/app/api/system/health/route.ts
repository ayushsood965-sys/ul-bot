import { NextResponse } from "next/server";
import db from "@/lib/db";
import { MetaInstagramService } from "@/lib/services/meta-instagram-service";

export async function GET() {
  try {
    const startTime = Date.now();

    // 1. Database check
    await db.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    // 2. Worker heartbeat
    const workerHeartbeatSetting = await db.systemSetting.findUnique({
      where: { key: "worker_last_heartbeat" },
    });
    const lastHeartbeat = workerHeartbeatSetting?.value
      ? new Date(workerHeartbeatSetting.value)
      : null;

    const workerIsAlive =
      lastHeartbeat && Date.now() - lastHeartbeat.getTime() < 60000; // active within last 60s

    // 3. Queue stats
    const [scheduledJobsCount, failedJobsCount, claimedJobsCount] = await Promise.all([
      db.publishingJob.count({ where: { status: "SCHEDULED" } }),
      db.publishingJob.count({ where: { status: "FAILED" } }),
      db.publishingJob.count({ where: { status: "CLAIMED" } }),
    ]);

    // 4. Meta connection status
    const isMetaConfigured = MetaInstagramService.isCredentialsConfigured();

    return NextResponse.json({
      status: "HEALTHY",
      timestamp: new Date().toISOString(),
      database: {
        status: "CONNECTED",
        latencyMs: dbLatencyMs,
      },
      worker: {
        status: workerIsAlive ? "ACTIVE" : "STANDBY_OR_OFFLINE",
        lastHeartbeat: lastHeartbeat?.toISOString() || null,
        note: workerIsAlive
          ? "Background daemon running actively"
          : "Worker will poll on demand or can be started via 'npm run worker'",
      },
      queue: {
        scheduled: scheduledJobsCount,
        claimed: claimedJobsCount,
        failed: failedJobsCount,
      },
      metaApi: {
        mode: isMetaConfigured ? "LIVE_GRAPH_API" : "DEMO_MOCK_MODE",
        isConfigured: isMetaConfigured,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "DEGRADED",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
