import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding The Verdict Room Studio database...");

  // 1. Owner & Editor User
  const passwordHash = await bcrypt.hash("Verdict@2026!", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@theverdictroom.internal" },
    update: {},
    create: {
      email: "owner@theverdictroom.internal",
      name: "Chief Editor (The Verdict Room)",
      passwordHash,
      role: "OWNER",
    },
  });
  console.log("✔ Owner user ready:", owner.email);

  // 2. Brand Configuration
  await prisma.brandConfiguration.deleteMany({});
  const brandConfig = await prisma.brandConfiguration.create({
    data: {
      brandName: "Unfiltered Lore",
      tagline: "Raw Everyday Lore & Unfiltered Verdicts.",
      voiceTone: "Bold, raw, intelligent, witty, culturally rooted Indian Gen Z",
      targetAudience: "Indian Gen Z, metro & tier-1/2 youth (18-26)",
      languageMode: "English-first with natural conversational Hinglish nuances",
      pillarRelationshipsWeight: 40,
      pillarSocialBehaviourWeight: 30,
      pillarMoneyModernLifeWeight: 30,
      slangVocabulary: JSON.stringify([
        "situationship", "delulu", "red flag", "green flag", "cooked",
        "aura", "ghosting", "breadcrumbing", "main character energy",
        "toxic trait", "bhai", "yaar", "cringe", "soft launch", "hard launch",
        "drip", "rizz", "snack", "beige flag", "gatekeep"
      ]),
      forbiddenPhrases: JSON.stringify([
        "In today's fast-paced world",
        "Unlock your potential",
        "Remember to follow and share",
        "Hey guys welcome back",
        "Click the link in bio for more",
        "99% of people agree"
      ]),
      isActive: true,
    },
  });
  console.log("✔ Brand Configuration created:", brandConfig.brandName);

  // 3. AI Providers (Gemini Primary + OpenRouter Fallback)
  await prisma.aIProviderConfiguration.deleteMany({});
  await prisma.aIProviderConfiguration.create({
    data: {
      providerName: "gemini",
      displayName: "Google Gemini 2.5 Flash (Primary)",
      apiBaseUrl: "https://generativelanguage.googleapis.com",
      apiKeyEncrypted: "",
      primaryModel: "gemini-2.5-flash",
      evaluationModel: "gemini-2.5-flash",
      moderationModel: "gemini-2.5-flash",
      maxOutputTokens: 2048,
      temperature: 0.7,
      timeoutMs: 25000,
      retryPolicy: JSON.stringify({ maxRetries: 3, backoffMs: 1200 }),
      monthlyBudgetUsd: 50.0,
      currentMonthSpendUsd: 1.45,
      isFallbackEnabled: true,
      fallbackModel: "deepseek/deepseek-chat",
      isActive: true,
      isPrimary: true,
    },
  });

  await prisma.aIProviderConfiguration.create({
    data: {
      providerName: "openrouter",
      displayName: "OpenRouter Multi-Model Fallback",
      apiBaseUrl: "https://openrouter.ai/api/v1",
      apiKeyEncrypted: "",
      primaryModel: "deepseek/deepseek-chat",
      evaluationModel: "meta-llama/llama-3.3-70b-instruct",
      moderationModel: "deepseek/deepseek-chat",
      maxOutputTokens: 2048,
      temperature: 0.7,
      timeoutMs: 20000,
      retryPolicy: JSON.stringify({ maxRetries: 2, backoffMs: 1500 }),
      monthlyBudgetUsd: 25.0,
      currentMonthSpendUsd: 0.40,
      isFallbackEnabled: false,
      fallbackModel: "google/gemini-2.5-flash",
      isActive: true,
      isPrimary: false,
    },
  });
  console.log("✔ AI Providers configured (Gemini + OpenRouter fallback)");

  // 4. Creative Templates (5 formats)
  await prisma.creativeTemplate.deleteMany({});
  await prisma.creativeTemplate.createMany({
    data: [
      {
        code: "THE_COURTROOM",
        name: "The Courtroom Flagship",
        description: "Dark luxury editorial aesthetic with large case stamp, high-contrast typography, 4 distinct verdicts, and branded jury footer.",
        canvasWidth: 1080,
        canvasHeight: 1350,
        aspectRatio: "4:5",
        themeJson: JSON.stringify({
          bg: "#0B0C10",
          cardBg: "#14161E",
          primaryText: "#FFFFFF",
          secondaryText: "#A0A5B5",
          accentCrimson: "#DC2626",
          stampColor: "#EF4444",
          border: "#1F2330",
          fontHeadline: "Playfair Display, serif",
          fontBody: "Inter, sans-serif",
        }),
        isDefault: true,
      },
      {
        code: "UNPOPULAR_OPINION",
        name: "Unpopular Opinion Statement",
        description: "Minimalist bold editorial layout with prominent provocative hook, context statement, and jury challenge.",
        canvasWidth: 1080,
        canvasHeight: 1350,
        aspectRatio: "4:5",
        themeJson: JSON.stringify({
          bg: "#0D0E12",
          cardBg: "#171922",
          primaryText: "#F8FAFC",
          secondaryText: "#94A3B8",
          accentCrimson: "#B91C1C",
          tagBg: "#2D1214",
          border: "#232738",
        }),
        isDefault: false,
      },
      {
        code: "AURA_TAX",
        name: "Aura Tax Audit Card",
        description: "High-voltage behavioural penalty or reward badge (+1000 / -1000 Aura) with specific Gen Z scenario breakdown.",
        canvasWidth: 1080,
        canvasHeight: 1350,
        aspectRatio: "4:5",
        themeJson: JSON.stringify({
          bg: "#08090C",
          badgeGainBg: "#064E3B",
          badgeGainText: "#34D399",
          badgeTaxBg: "#450A0A",
          badgeTaxText: "#F87171",
          primaryText: "#FFFFFF",
          border: "#1E2230",
        }),
        isDefault: false,
      },
      {
        code: "TWO_SIDES",
        name: "Two Sides Split Panel",
        description: "Dual-panel comparative courtroom composition contrasting Perspective A vs Perspective B on a heated social dilemma.",
        canvasWidth: 1080,
        canvasHeight: 1350,
        aspectRatio: "4:5",
        themeJson: JSON.stringify({
          bg: "#0A0B0E",
          panelA: "#131620",
          panelB: "#1A141A",
          accentA: "#38BDF8",
          accentB: "#F43F5E",
          divider: "#2A2F42",
        }),
        isDefault: false,
      },
      {
        code: "MULTI_SLIDE_CAROUSEL",
        name: "Multi-Slide Courtroom Carousel",
        description: "5-slide structured carousel: Cover Hook, Context Dilemma, Argument A, Argument B, Verdict Options & Call To Action.",
        canvasWidth: 1080,
        canvasHeight: 1350,
        aspectRatio: "4:5",
        themeJson: JSON.stringify({
          bg: "#0B0C10",
          cardBg: "#141722",
          stepIndicator: "#DC2626",
          primaryText: "#FFFFFF",
        }),
        isDefault: false,
      },
    ],
  });
  console.log("✔ Creative Templates initialized (5 templates)");

  // 5. Publishing Schedule (5 daily slots)
  await prisma.publishingSchedule.deleteMany({});
  await prisma.publishingSchedule.createMany({
    data: [
      {
        slotLabel: "Morning Prime",
        slotTime: "09:30",
        daysOfWeek: "ALL",
        timezone: "Asia/Kolkata",
        isEnabled: true,
      },
      {
        slotLabel: "Mid-Day Discussion",
        slotTime: "12:30",
        daysOfWeek: "ALL",
        timezone: "Asia/Kolkata",
        isEnabled: true,
      },
      {
        slotLabel: "Afternoon Slump",
        slotTime: "15:30",
        daysOfWeek: "ALL",
        timezone: "Asia/Kolkata",
        isEnabled: true,
      },
      {
        slotLabel: "Evening Peak Transit",
        slotTime: "18:30",
        daysOfWeek: "ALL",
        timezone: "Asia/Kolkata",
        isEnabled: true,
      },
      {
        slotLabel: "Late-Night Jury Session",
        slotTime: "21:30",
        daysOfWeek: "ALL",
        timezone: "Asia/Kolkata",
        isEnabled: true,
      },
    ],
  });
  console.log("✔ Publishing Schedule configured (5 slots/day in Asia/Kolkata)");

  // 6. System Settings
  await prisma.systemSetting.deleteMany({});
  await prisma.systemSetting.createMany({
    data: [
      { key: "automation_generation_enabled", value: "true", description: "Enables background idea & content generation" },
      { key: "automation_rendering_enabled", value: "true", description: "Enables automatic creative rendering to PNG" },
      { key: "automation_publishing_enabled", value: "false", description: "Auto-publishes approved posts (human approval active by default)" },
      { key: "require_approval_before_publishing", value: "true", description: "Enforces mandatory human editorial sign-off" },
      { key: "emergency_publish_pause", value: "false", description: "Emergency kill-switch pausing all outbound publishing jobs" },
      { key: "daily_publishing_target", value: "5", description: "Target number of posts scheduled per calendar day" },
      { key: "timezone", value: "Asia/Kolkata", description: "Primary operating timezone" },
      { key: "min_spacing_seconds", value: "300", description: "Minimum spacing in seconds between consecutive posts to protect IG account" },
      { key: "quality_threshold_score", value: "8.0", description: "Minimum quality score out of 10 required to pass auto-validation" },
      { key: "moderation_sensitivity", value: "HIGH", description: "Sensitivity level for hate speech, doxxing and defamation filtering" },
    ],
  });
  console.log("✔ System Settings initialized");

  // 7. Instagram Account (Demo / Mock Connection Setup)
  await prisma.instagramAccount.deleteMany({});
  const igAccount = await prisma.instagramAccount.create({
    data: {
      igUserId: "mock_17841400293849201",
      username: "_unfiltered_lore_",
      accountName: "Unfiltered Lore (@_unfiltered_lore_)",
      profilePictureUrl: "/images/unfiltered-lore-avatar.png",
      connectedPageId: "mock_page_1029384756",
      accountType: "BUSINESS",
      followerCount: 24850,
      mediaCount: 142,
      status: "MOCK_ACTIVE",
      isMockMode: true,
      lastSyncAt: new Date(),
      tokenMetadata: {
        create: {
          tokenType: "PAGE_ACCESS_TOKEN",
          accessTokenEncrypted: "mock_token_configured_for_development",
          scopes: "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement",
          isValid: true,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        },
      },
    },
  });
  console.log("✔ Instagram Account initialized in safe DEMO/MOCK mode:", igAccount.username);

  // 8. Sample Content Ideas & High-Relatability Posts
  await prisma.contentPost.deleteMany({});
  await prisma.contentIdea.deleteMany({});

  const sampleIdea1 = await prisma.contentIdea.create({
    data: {
      title: "Splitting bills when one partner earns 3x more",
      pillar: "RELATIONSHIPS",
      format: "THE_CASE",
      premise: "Your partner makes 18 LPA while you make 6 LPA in Bangalore, but insists on splitting every fine dining date 50-50 down to the rupee.",
      hook: "Is 50/50 equality, or is it financial bullying when there's a 3x salary gap?",
      scoreHook: 9.4,
      scoreRelatability: 9.6,
      scoreDebate: 9.8,
      scoreOriginality: 8.9,
      overallScore: 9.4,
      fingerprint: "idea_salary_split_bangalore_01",
      status: "CONVERTED",
    },
  });

  const post1 = await prisma.contentPost.create({
    data: {
      contentId: "TVR-2026-CASE-001",
      ideaId: sampleIdea1.id,
      title: "Case #104: The 50/50 Salary Trap",
      pillar: "RELATIONSHIPS",
      format: "THE_CASE",
      primaryLanguage: "en-IN",
      targetAudience: "Indian Gen Z",
      hook: "Your partner makes ₹18 LPA in Bangalore. You earn ₹6 LPA. They still demand a strict 50-50 split on ₹4,000 dinners.",
      mainNarrative: "One partner argues that 50/50 split is the only way to maintain equal respect and self-worth in modern dating. The other partner is quietly burning their entire savings just to keep up with an upscale lifestyle they never asked for.",
      caption: "Court is in session. ⚖️ Does true equality mean equal rupees, or equal financial effort?\n\nDrop your verdict in the comments.\n\nA. Fair — 50/50 always protects dignity.\nB. Unfair — Proportional contribution based on salary.\nC. Red flag — If they love you, they wouldn't stress your budget.\nD. Switch to budget dates both can genuinely afford.\n\n#TheVerdictRoom #ModernDating #IndianGenZ #BangaloreLife #MoneyAndLove",
      hashtags: JSON.stringify(["TheVerdictRoom", "ModernDating", "IndianGenZ", "SalaryDating", "RelationshipsIndia"]),
      callToAction: "The internet is the jury. What's your verdict?",
      suggestedTemplate: "THE_COURTROOM",
      optionsJson: JSON.stringify([
        { key: "A", label: "Strict 50/50 is fair to avoid resentment" },
        { key: "B", label: "Split proportionally by income (75/25)" },
        { key: "C", label: "Massive red flag: financial insensitivity" },
        { key: "D", label: "Date spots must match the lower budget" },
      ]),
      status: "APPROVED",
      qualityScore: 9.3,
      moderationStatus: "PASSED",
      isCarousel: false,
      slideCount: 1,
      contentFingerprint: "fp_case_104_salary_trap",
      scheduledPublishAt: new Date(Date.now() + 3600 * 1000 * 4), // 4 hours from now
      renderedAssetUrl: "/api/creative/render/TVR-2026-CASE-001",
      renderedThumbnailUrl: "/api/creative/render/TVR-2026-CASE-001?thumb=true",
    },
  });

  const sampleIdea2 = await prisma.contentIdea.create({
    data: {
      title: "Leaving group chat without explanation vs quiet muting",
      pillar: "SOCIAL_BEHAVIOUR",
      format: "AURA_TAX",
      premise: "Someone abruptly left the college friends WhatsApp group with zero warning just because they weren't the center of conversation.",
      hook: "Did you assert boundaries, or did you just drop your Aura to negative digits?",
      scoreHook: 9.1,
      scoreRelatability: 9.4,
      scoreDebate: 8.8,
      scoreOriginality: 8.7,
      overallScore: 9.0,
      fingerprint: "idea_group_chat_ragequit_02",
      status: "CONVERTED",
    },
  });

  const post2 = await prisma.contentPost.create({
    data: {
      contentId: "TVR-2026-AURA-002",
      ideaId: sampleIdea2.id,
      title: "Aura Tax Audit: The Group Chat Ragequit",
      pillar: "SOCIAL_BEHAVIOUR",
      format: "AURA_TAX",
      primaryLanguage: "en-IN",
      targetAudience: "Indian Gen Z",
      hook: "Leaving the college WhatsApp group with zero explanation because nobody replied to your reel in 10 minutes.",
      mainNarrative: "Dramatic exits from group chats are marketed as 'protecting your peace'. In reality, everyone knows you're staring at the notification bar waiting for someone to DM 'are you okay?'",
      caption: "Aura Audit completed. 📉 Penalty assessed: -1,500 Aura.\n\nQuietly archiving the chat without a performance is peace. Leaving dramatically so people chase you is validation addiction.\n\nAgree or disagree? #TheVerdictRoom #AuraTax #GenZHumor #FriendshipAudit",
      hashtags: JSON.stringify(["TheVerdictRoom", "AuraTax", "GenZIndia", "CollegeLife", "SocialEtiquette"]),
      callToAction: "Is this -1,500 Aura or valid boundary setting?",
      suggestedTemplate: "AURA_TAX",
      auraPoints: -1500,
      status: "SCHEDULED",
      qualityScore: 8.9,
      moderationStatus: "PASSED",
      isCarousel: false,
      slideCount: 1,
      contentFingerprint: "fp_aura_group_chat_ragequit",
      scheduledPublishAt: new Date(Date.now() + 3600 * 1000 * 7),
      renderedAssetUrl: "/api/creative/render/TVR-2026-AURA-002",
    },
  });

  const post3 = await prisma.contentPost.create({
    data: {
      contentId: "TVR-2026-OPIN-003",
      title: "Unpopular Opinion: Situationships are glorified cowardice",
      pillar: "RELATIONSHIPS",
      format: "UNPOPULAR_OPINION",
      primaryLanguage: "en-IN",
      targetAudience: "Indian Gen Z",
      hook: "'We're just going with the flow' is code for 'I want relationship benefits with single-market freedom'.",
      mainNarrative: "The modern situationship isn't chill or progressive. It's a game of chicken where the first person to show genuine human emotion loses and gets labeled 'too intense'.",
      caption: "Unpopular Opinion #49: 'Going with the flow' only works if you both agree on what the river is.\n\nIf one person is paddling toward commitment while the other is drifting in circles, someone's drowning.\n\nJury, speak your truth below. 👇\n\n#TheVerdictRoom #Situationship #DatingTruths #IndianYouth #UnpopularOpinion",
      hashtags: JSON.stringify(["TheVerdictRoom", "Situationships", "DatingTruths", "UnpopularOpinion", "IndianGenZ"]),
      callToAction: "Defend your verdict in the comments.",
      suggestedTemplate: "UNPOPULAR_OPINION",
      status: "PUBLISHED",
      qualityScore: 9.5,
      moderationStatus: "PASSED",
      isCarousel: false,
      slideCount: 1,
      contentFingerprint: "fp_opin_situationships_cowardice",
      publishedAt: new Date(Date.now() - 3600 * 1000 * 18),
      igMediaId: "1799283746592011",
      igPermalink: "https://instagram.com/p/mock_opin_situationship",
      renderedAssetUrl: "/api/creative/render/TVR-2026-OPIN-003",
    },
  });

  // 9. Published Media & Insights Snapshot
  const pubMedia = await prisma.publishedMedia.create({
    data: {
      accountId: igAccount.id,
      postId: post3.id,
      igMediaId: "1799283746592011",
      mediaType: "IMAGE",
      permalink: "https://instagram.com/p/mock_opin_situationship",
      caption: post3.caption,
      publishedAt: new Date(Date.now() - 3600 * 1000 * 18),
      latestReach: 14280,
      latestImpressions: 19450,
      latestLikes: 1840,
      latestComments: 312,
      latestShares: 680,
      latestSaves: 520,
      engagementRate: 23.4,
      snapshots: {
        create: [
          {
            capturedAt: new Date(Date.now() - 3600 * 1000 * 12),
            reach: 6500,
            impressions: 8900,
            likes: 720,
            comments: 110,
            shares: 240,
            saved: 180,
            totalInteractions: 1250,
          },
          {
            capturedAt: new Date(Date.now() - 3600 * 1000 * 2),
            reach: 14280,
            impressions: 19450,
            likes: 1840,
            comments: 312,
            shares: 680,
            saved: 520,
            totalInteractions: 3352,
          },
        ],
      },
    },
  });

  // 10. Sample Carousel Post (5 Slides)
  const carouselPost = await prisma.contentPost.create({
    data: {
      contentId: "TVR-2026-CARO-004",
      title: "Case #105: The Startup Equity vs Family Government Job Dilemma",
      pillar: "MONEY_MODERN_LIFE",
      format: "THE_CASE",
      primaryLanguage: "en-IN",
      targetAudience: "Indian Gen Z",
      hook: "Your parents saved ₹15 Lakhs for your UPSC prep in Delhi. You just got offered ₹12 LPA + ESOPs at an early-stage fintech.",
      mainNarrative: "Stability of a Gazetted Officer versus high-risk equity in Gurgaon's startup ecosystem. Which sacrifice has higher return on sanity?",
      caption: "Swipe through the full case evidence. ➡️ In India, career choices aren't individual decisions; they're family board meetings.\n\nSlide 1: The Hook\nSlide 2: The Context\nSlide 3: Government Job Argument\nSlide 4: Startup Equity Argument\nSlide 5: The Jury Verdict\n\nDrop your vote. ⚖️ #TheVerdictRoom #CareerDebate #IndianFamilies #UPSCVsTech #Gurgaon",
      hashtags: JSON.stringify(["TheVerdictRoom", "CareerDecisions", "IndianParents", "UPSCOrStartup", "TechLife"]),
      callToAction: "Swipe and cast your verdict.",
      suggestedTemplate: "MULTI_SLIDE_CAROUSEL",
      status: "APPROVED",
      qualityScore: 9.6,
      moderationStatus: "PASSED",
      isCarousel: true,
      slideCount: 5,
      contentFingerprint: "fp_caro_upsc_vs_startup",
      scheduledPublishAt: new Date(Date.now() + 3600 * 1000 * 12),
      slides: {
        create: [
          {
            slideIndex: 1,
            slideType: "COVER",
            headline: "Case #105: UPSC Dream vs ₹12 LPA Startup Equity",
            subtext: "The ultimate Indian middle-class crossroads.",
            bodyText: "Your parents saved ₹15 Lakhs for Delhi coaching. You just received an early-stage fintech offer. Do you chase family prestige or modern equity?",
            badgeText: "CASE #105",
          },
          {
            slideIndex: 2,
            slideType: "CONTEXT",
            headline: "The Dilemma",
            subtext: "Risk Tolerance vs Social Security",
            bodyText: "In Tier-1/2 India, a government job is eternal matrimonial and social prestige. A venture-backed startup is high-pressure volatility that could make you a millionaire or unemployed in 18 months.",
            badgeText: "EVIDENCE A",
          },
          {
            slideIndex: 3,
            slideType: "ARGUMENT_A",
            headline: "The Parents' Case: Government Security",
            subtext: "Zero Layoff Risk & Pension Dignity",
            bodyText: "'Startups hire and fire over an email. A government desk means stability, social standing, and peace of mind that market crashes cannot touch.'",
            badgeText: "PRO-STABILITY",
          },
          {
            slideIndex: 4,
            slideType: "ARGUMENT_B",
            headline: "The Gen Z Case: Modern Wealth Creation",
            subtext: "Compounding Skills & Equity",
            bodyText: "'Spending 4 prime years memorizing static syllabi while the AI revolution happens is high-risk stagnation. Build marketable skills where global capital flows.'",
            badgeText: "PRO-GROWTH",
          },
          {
            slideIndex: 5,
            slideType: "PROMPT",
            headline: "The Internet Is The Jury",
            subtext: "Cast your final verdict in comments",
            bodyText: "A. Take the coaching — Family honor & lifelong security.\nB. Take the startup — Modern wealth & real skills.\nC. Hybrid: Join the job, study on weekends.\nD. Let your parents decide.",
            badgeText: "VERDICT TIME",
          },
        ],
      },
    },
  });

  // 11. Audience Poll
  const poll = await prisma.audiencePoll.create({
    data: {
      question: "Is expecting a 50/50 split on dates fair when one partner earns 3x more?",
      totalVotes: 3420,
      status: "ACTIVE",
      options: {
        create: [
          { optionKey: "A", optionLabel: "Fair — Equality means equal contribution", voteCount: 820, votePercentage: 24.0 },
          { optionKey: "B", optionLabel: "Unfair — Proportional to income is true fairness", voteCount: 1980, votePercentage: 57.9 },
          { optionKey: "C", optionLabel: "Red Flag — Generosity matters more than math", voteCount: 410, votePercentage: 12.0 },
          { optionKey: "D", optionLabel: "Depends on who chose the date spot", voteCount: 210, votePercentage: 6.1 },
        ],
      },
    },
  });

  // 12. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        action: "SYSTEM_INITIALIZED",
        category: "CONFIG",
        details: "The Verdict Room Studio database schema seeded successfully.",
        actorEmail: owner.email,
        severity: "INFO",
      },
      {
        action: "BRAND_VOICE_CONFIGURED",
        category: "CONFIG",
        details: "Loaded Indian Gen Z editorial guidelines (Relationships 40%, Social Behaviour 30%, Money 30%).",
        actorEmail: owner.email,
        severity: "INFO",
      },
      {
        action: "AI_PROVIDERS_CONFIGURED",
        category: "AI_GEN",
        details: "Configured Google Gemini 2.5 Flash as Primary with OpenRouter deepseek-chat Fallback.",
        actorEmail: owner.email,
        severity: "INFO",
      },
      {
        action: "POST_PUBLISHED",
        category: "PUBLISH",
        details: "Published Case #49 to Instagram (Mock ID: 1799283746592011).",
        actorEmail: owner.email,
        severity: "INFO",
      },
    ],
  });

  console.log("✔ Seed data successfully created! The Verdict Room Studio is ready.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
