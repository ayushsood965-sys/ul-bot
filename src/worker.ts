import db from "./lib/db";
import { PublishingSchedulerService } from "./lib/services/publishing-scheduler-service";
import { MetaInstagramService } from "./lib/services/meta-instagram-service";
import { recordAuditLog } from "./lib/services/audit-log-service";

const WORKER_ID = `worker_${process.pid}_${Math.random().toString(36).substring(2, 6)}`;
const POLL_INTERVAL_MS = 20000; // Poll database for due jobs every 20 seconds

console.log(`=======================================================`);
console.log(`🚀 Unfiltered Lore Studio — Background Publishing Daemon`);
console.log(`Worker ID: ${WORKER_ID} | Mode: Resilient Polling & BullMQ`);
console.log(`=======================================================`);

let isRunning = true;

async function updateHeartbeat() {
  try {
    await db.systemSetting.upsert({
      where: { key: "worker_last_heartbeat" },
      update: { value: new Date().toISOString() },
      create: { key: "worker_last_heartbeat", value: new Date().toISOString(), description: "Timestamp of worker liveness" },
    });
  } catch (err) {
    console.error("[Worker] Failed to update heartbeat:", err);
  }
}

async function runWorkerLoop() {
  // 1. Startup recovery
  try {
    const recovered = await PublishingSchedulerService.recoverStaleJobs();
    if (recovered > 0) {
      console.log(`[Worker] Cleaned up ${recovered} uncompleted/crashed jobs.`);
    }
  } catch (err) {
    console.error("[Worker] Startup recovery failed:", err);
  }

  // 2. Continuous scheduler loop
  while (isRunning) {
    try {
      await updateHeartbeat();

      // Process any due scheduled publishing jobs
      const result = await PublishingSchedulerService.processDueJobs(WORKER_ID);
      if (result.processed > 0) {
        console.log(`[Worker] Processed ${result.processed} jobs (${result.published} published, ${result.failed} failed)`);
      }
    } catch (err) {
      console.error("[Worker] Error in scheduler execution loop:", err);
    }

    // Sleep until next cycle
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[Worker] Graceful shutdown initiated (SIGINT)...");
  isRunning = false;
  await db.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[Worker] Graceful shutdown initiated (SIGTERM)...");
  isRunning = false;
  await db.$disconnect();
  process.exit(0);
});

runWorkerLoop();
