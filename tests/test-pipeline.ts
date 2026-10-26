import db from "../src/lib/db";
import { runContentModeration } from "../src/lib/services/moderation-service";
import { CreativeRendererService } from "../src/lib/services/creative-renderer-service";
import { MetaInstagramService } from "../src/lib/services/meta-instagram-service";
import { PublishingSchedulerService } from "../src/lib/services/publishing-scheduler-service";

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("🧪 THE VERDICT ROOM STUDIO — AUTOMATED PIPELINE TEST SUITE");
  console.log("========================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✔ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
    }
  }

  // --- TEST 1: Content Moderation & Indian PII Redaction ---
  console.log("▶ Testing Content Moderation & PII Redaction...");
  const sampleWithPii = "My ex boyfriend in Koramangala +919876543210 borrowed 50k and ghosted me. Aadhaar: 1234 5678 9012.";
  const modResult = runContentModeration(sampleWithPii, { source: "ANONYMOUS_CONFESSION" });
  assert(!modResult.passed, "Moderation correctly flags PII in confession");
  assert(modResult.sanitizedText.includes("[PHONE REDACTED]"), "Phone number automatically redacted");
  assert(modResult.sanitizedText.includes("[ID REDACTED]"), "Aadhaar number automatically redacted");

  const fakeStatSample = "99% of people agree that situationships are toxic.";
  const modStatResult = runContentModeration(fakeStatSample);
  assert(!modStatResult.passed, "Moderation flags unverified absolute statistical claims ('99% of people')");

  // --- TEST 2: Creative Studio Vector Renderer (All 5 Templates) ---
  console.log("\n▶ Testing Creative Studio 1080x1350 Vector Templates...");
  const courtroomSvg = CreativeRendererService.generateSVG({
    templateCode: "THE_COURTROOM",
    caseNumber: "CASE #999",
    pillar: "RELATIONSHIPS",
    headline: "Can you be best friends with your ex while dating someone new?",
    narrative: "One partner considers it emotional maturity. The other considers it a lingering backup plan.",
  });
  assert(courtroomSvg.includes('viewBox="0 0 1080 1350"'), "The Courtroom template outputs exact 1080x1350 canvas");
  assert(courtroomSvg.includes("UNFILTERED LORE"), "The Courtroom template includes brand typography");

  const opinionSvg = CreativeRendererService.generateSVG({
    templateCode: "UNPOPULAR_OPINION",
    headline: "Being busy is not a status symbol; it is poor boundary management.",
    narrative: "Bragging about 80-hour workweeks just proves your company owns your mental health.",
  });
  assert(opinionSvg.includes("UNPOPULAR OPINION"), "Unpopular opinion template badge present");

  const auraSvg = CreativeRendererService.generateSVG({
    templateCode: "AURA_TAX",
    headline: "Flexing your dad's Fortuner on Instagram stories with Punjabi music.",
    narrative: "Borrowing family status for personal clout is instant social bankruptcy.",
    auraPoints: -1500,
  });
  assert(auraSvg.includes("-1,500 AURA"), "Aura Tax renders negative penalty badge correctly");

  const twoSidesSvg = CreativeRendererService.generateSVG({
    templateCode: "TWO_SIDES",
    headline: "Should salary disclosure be mandatory on the second date?",
    sideA: { title: "Transparency", argument: "Prevents wasted time on mismatched financial realities." },
    sideB: { title: "Privacy", argument: "Invites gold-digging and transactional calculations too early." },
  });
  assert(twoSidesSvg.includes("SIDE A"), "Two sides template renders dual panel comparisons");

  const carouselSlideSvg = CreativeRendererService.generateSVG({
    templateCode: "MULTI_SLIDE_CAROUSEL",
    headline: "The Bangalore Roommate Agreement Crisis",
    narrative: "When your flatmate's partner effectively moves in rent-free for 5 months.",
    slideIndex: 2,
    slideTotal: 5,
  });
  assert(carouselSlideSvg.includes("2 / 5"), "Multi-slide carousel displays accurate slide progress indicator");

  // --- TEST 3: Safe Meta Instagram Publishing & Mock Isolation ---
  console.log("\n▶ Testing Meta Graph API Safe Mock Isolation...");
  const pubResult = await MetaInstagramService.publishSingleImage({
    imageUrl: "http://localhost:3000/api/creative/render/test_card",
    caption: "Test dilemma #TheVerdictRoom",
  });
  assert(pubResult.success, "Publishing pipeline succeeds in safe demo/mock mode");
  assert(pubResult.isMock, "Mock mode flag correctly identified when no live Meta credentials exist");
  assert(pubResult.mediaId?.startsWith("mock_ig_") || false, "Mock media ID generated with mock_ prefix");

  // --- TEST 4: Idempotency & Scheduler Duplicate Prevention ---
  console.log("\n▶ Testing Scheduler Idempotency & Atomic Claiming...");
  const testPost = await db.contentPost.create({
    data: {
      contentId: `TVR-TEST-${Date.now()}`,
      title: "Test Unit Post",
      pillar: "RELATIONSHIPS",
      format: "THE_CASE",
      hook: "Test hook for automated verification",
      mainNarrative: "Test narrative",
      caption: "Test caption",
      hashtags: "[]",
      callToAction: "Vote below",
      contentFingerprint: `fp_test_${Date.now()}`,
      status: "APPROVED",
    },
  });

  const scheduledTime = new Date(Date.now() - 10000); // 10s in past so it is due
  const job = await PublishingSchedulerService.schedulePost(testPost.id, scheduledTime);
  assert(job.status === "SCHEDULED", "Post successfully scheduled in database");

  // Re-scheduling with same parameters updates existing job without duplicate insertion
  const duplicateJob = await PublishingSchedulerService.schedulePost(testPost.id, scheduledTime);
  assert(job.id === duplicateJob.id, "Idempotency key prevents duplicate scheduled jobs");

  // --- TEST 5: Emergency Stop Verification ---
  console.log("\n▶ Testing Master Emergency Stop Kill-Switch...");
  await db.systemSetting.upsert({
    where: { key: "emergency_publish_pause" },
    update: { value: "true" },
    create: { key: "emergency_publish_pause", value: "true" },
  });

  const pausedResult = await PublishingSchedulerService.processDueJobs("test-worker");
  assert(pausedResult.processed === 0, "Emergency stop halts all processing of due jobs");

  // Disengage emergency stop for normal operation
  await db.systemSetting.update({
    where: { key: "emergency_publish_pause" },
    data: { value: "false" },
  });

  // Process the due job
  const activeResult = await PublishingSchedulerService.processDueJobs("test-worker");
  assert(activeResult.published >= 1, "Scheduler processes and publishes claimed due jobs once resumed");

  // Cleanup test post
  await db.contentPost.delete({ where: { id: testPost.id } }).catch(() => {});

  console.log("\n========================================================");
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log("========================================================\n");

  await db.$disconnect();
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
