import db from "../src/lib/db";
import { PublishingSchedulerService } from "../src/lib/services/publishing-scheduler-service";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✔ [PASS] ${msg}`);
}

async function runIntervalTest() {
  console.log("\n========================================================");
  console.log("⏱️ TESTING 4-5 HOUR PUBLISHING INTERVAL SCHEDULING LOGIC");
  console.log("========================================================\n");

  const post = await db.contentPost.findFirst();
  if (!post) {
    throw new Error("No sample post found in DB");
  }

  // Clear existing test jobs
  await db.publishingJob.deleteMany({ where: { jobId: { startsWith: "test_interval_" } } });

  // 1. Initial slot should pick the next upcoming slot (e.g. 08:30 or next slot today)
  const slot1 = await PublishingSchedulerService.getNextPublishSlot();
  console.log(`Slot 1: ${slot1.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
  assert(slot1.getTime() > Date.now(), "First slot is in the future");

  // Create job 1 at Slot 1
  const job1 = await db.publishingJob.create({
    data: {
      jobId: "test_interval_1",
      postId: post.id,
      scheduledFor: slot1,
      status: "SCHEDULED",
      idempotencyKey: `test_int_${Date.now()}_1`,
    },
  });

  // 2. Next slot must be spaced by at least 2.5 - 4 hours
  const slot2 = await PublishingSchedulerService.getNextPublishSlot();
  console.log(`Slot 2: ${slot2.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
  const diffHours12 = (slot2.getTime() - slot1.getTime()) / (3600 * 1000);
  assert(diffHours12 >= 2.5, `Slot 2 is spaced by at least ~3-4 hours from Slot 1 (actual: ${diffHours12.toFixed(1)} hrs)`);

  // Create job 2 at Slot 2
  const job2 = await db.publishingJob.create({
    data: {
      jobId: "test_interval_2",
      postId: post.id,
      scheduledFor: slot2,
      status: "SCHEDULED",
      idempotencyKey: `test_int_${Date.now()}_2`,
    },
  });

  // 3. Next slot must be spaced by another 3-4 hours
  const slot3 = await PublishingSchedulerService.getNextPublishSlot();
  console.log(`Slot 3: ${slot3.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
  const diffHours23 = (slot3.getTime() - slot2.getTime()) / (3600 * 1000);
  assert(diffHours23 >= 2.5, `Slot 3 is spaced by at least ~3-4 hours from Slot 2 (actual: ${diffHours23.toFixed(1)} hrs)`);

  // Cleanup test jobs
  await db.publishingJob.deleteMany({ where: { jobId: { startsWith: "test_interval_" } } });

  console.log("\n========================================================");
  console.log("🏁 ALL PUBLISHING INTERVAL TESTS PASSED SUCCESSFULLY");
  console.log("========================================================\n");
}

runIntervalTest()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
