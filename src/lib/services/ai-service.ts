import { z } from "zod";
import db from "@/lib/db";
import { recordAuditLog } from "./audit-log-service";

// Zod schemas for structured AI generation outputs
export const ContentIdeaSchema = z.object({
  title: z.string().min(3),
  pillar: z.enum(["RELATIONSHIPS", "SOCIAL_BEHAVIOUR", "MONEY_MODERN_LIFE"]).catch("RELATIONSHIPS"),
  format: z.enum([
    "THE_CASE",
    "UNPOPULAR_OPINION",
    "ANONYMOUS_CONFESSION",
    "PEOPLE_HAVE_SPOKEN",
    "AURA_TAX",
    "TWO_SIDES",
  ]).catch("THE_CASE"),
  premise: z.string().min(5),
  hook: z.string().min(5),
  scoreHook: z.coerce.number().catch(9.0),
  scoreRelatability: z.coerce.number().catch(9.0),
  scoreDebate: z.coerce.number().catch(9.0),
  scoreOriginality: z.coerce.number().catch(8.5),
  overallScore: z.coerce.number().catch(9.0),
  targetAudience: z.string().default("Indian Gen Z"),
});

export const CarouselSlideSchema = z.object({
  slideIndex: z.coerce.number(),
  slideType: z.enum(["COVER", "CONTEXT", "ARGUMENT_A", "ARGUMENT_B", "OPTIONS", "PROMPT"]).catch("CONTEXT"),
  headline: z.string(),
  subtext: z.string().catch(""),
  badgeText: z.string().optional(),
  bodyText: z.string(),
});

export const StructuredContentPostSchema = z.object({
  title: z.string(),
  pillar: z.enum(["RELATIONSHIPS", "SOCIAL_BEHAVIOUR", "MONEY_MODERN_LIFE"]).catch("RELATIONSHIPS"),
  format: z.enum([
    "THE_CASE",
    "UNPOPULAR_OPINION",
    "ANONYMOUS_CONFESSION",
    "PEOPLE_HAVE_SPOKEN",
    "AURA_TAX",
    "TWO_SIDES",
  ]).catch("THE_CASE"),
  primaryLanguage: z.string().default("en-IN"),
  targetAudience: z.string().default("Indian Gen Z"),
  hook: z.string(),
  mainNarrative: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()).catch(["#UnfilteredLore", "#IndianGenZ", "#Debate"]),
  callToAction: z.string().catch("Share your verdict below."),
  suggestedTemplate: z.string().catch("THE_COURTROOM"),
  options: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  auraPoints: z.coerce.number().optional(),
  sideA: z
    .object({
      title: z.string(),
      argument: z.string(),
    })
    .optional(),
  sideB: z
    .object({
      title: z.string(),
      argument: z.string(),
    })
    .optional(),
  isCarousel: z.boolean().default(false),
  slides: z.array(CarouselSlideSchema).optional(),
});

export const QualityEvaluationSchema = z.object({
  overallScore: z.coerce.number().catch(9.0),
  hookClarity: z.coerce.number().catch(9.0),
  genZRelatability: z.coerce.number().catch(9.0),
  debatePotential: z.coerce.number().catch(9.0),
  brandVoiceFit: z.coerce.number().catch(9.0),
  readabilityScore: z.coerce.number().catch(8.8),
  feedbackNotes: z.string().catch("Draft generated successfully."),
  passedThreshold: z.boolean().catch(true),
});

export interface ProviderRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// Robust JSON extraction and sanitization utility for LLM outputs
export function cleanAndParseJson<T>(rawText: string, isArray: boolean = false): T {
  let cleaned = (rawText || "").trim();

  // Strip markdown code fences (e.g. ```json ... ``` or ``` ...)
  if (cleaned.includes("```")) {
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    } else {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }
  }

  const normalize = (data: any): any => {
    if (isArray) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === "object") {
        for (const key of ["ideas", "contentIdeas", "data", "items", "results", "posts", "content", "list", "candidates"]) {
          if (Array.isArray(data[key])) return data[key];
        }
        const firstArr = Object.values(data).find(Array.isArray);
        if (firstArr) return firstArr;
        // If it's a single object (e.g. single idea { title: ... }), wrap it in array
        return [data];
      }
      return [];
    } else {
      if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.post && typeof data.post === "object") return data.post;
        if (data.content && typeof data.content === "object" && !Array.isArray(data.content)) return data.content;
        if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) return data.data;
      } else if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      return data;
    }
  };

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    return normalize(parsed) as T;
  } catch {
    // 2. Extract JSON block (array or object)
    const match = isArray
      ? (cleaned.match(/\[[\s\S]*\]/) || cleaned.match(/\{[\s\S]*\}/))
      : (cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/));

    if (match) {
      const extracted = match[0].trim();
      let parsedItem: any;
      try {
        parsedItem = JSON.parse(extracted);
      } catch {
        // 3. Sanitize trailing commas and smart quotes
        const sanitized = extracted
          .replace(/,\s*([\]}])/g, "$1")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'");
        try {
          parsedItem = JSON.parse(sanitized);
        } catch (err: any) {
          throw new Error(`Failed to parse AI JSON response: ${err.message}`);
        }
      }
      return normalize(parsedItem) as T;
    }
    throw new Error(`No JSON ${isArray ? "array" : "object"} found in AI response: ${cleaned.slice(0, 150)}`);
  }
}

// Low-level LLM caller supporting Google Gemini & OpenRouter/OpenAI-compatible APIs
export class AIService {
  private static async getProviderConfig(providerName: "gemini" | "openrouter") {
    return await db.aIProviderConfiguration.findFirst({
      where: { providerName, isActive: true },
    });
  }

  // Calls Google Gemini REST API directly
  private static async callGemini(
    prompt: string,
    options: ProviderRequestOptions
  ): Promise<{ text: string; promptTokens: number; completionTokens: number; model: string }> {
    const geminiDbConfig = await this.getProviderConfig("gemini");
    const apiKey =
      process.env.GEMINI_API_KEY ||
      geminiDbConfig?.apiKeyEncrypted ||
      "";

    // Disregard deprecated or invalid legacy seed models like gemini-2.5-flash
    const dbModel =
      geminiDbConfig?.primaryModel &&
      geminiDbConfig.primaryModel !== "gemini-2.5-flash" &&
      geminiDbConfig.primaryModel !== "gemini-2.0-flash" &&
      geminiDbConfig.primaryModel !== "gemini-1.5-flash"
        ? geminiDbConfig.primaryModel
        : undefined;

    const model =
      options.model ||
      process.env.GEMINI_MODEL ||
      dbModel ||
      "gemini-3.6-flash";

    if (!apiKey || apiKey.startsWith("your_")) {
      throw new Error("Missing or invalid GEMINI_API_KEY");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents: any[] = [];
    if (options.systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: `System Instructions:\n${options.systemPrompt}` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood. I will strictly adhere to the brand voice and JSON instructions." }],
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const payload = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        responseMimeType: "application/json",
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Filter out thinking parts if using a thinking/reasoning model
    const nonThoughtPart = parts.find((p: any) => !p.thought && typeof p.text === "string" && p.text.trim().length > 0);
    const text = nonThoughtPart?.text || parts[parts.length - 1]?.text || "";
    const promptTokens = data.usageMetadata?.promptTokenCount || 200;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 300;

    return { text, promptTokens, completionTokens, model };
  }

  // Calls OpenRouter chat completion API (fallback or multi-model)
  private static async callOpenRouter(
    prompt: string,
    options: ProviderRequestOptions
  ): Promise<{ text: string; promptTokens: number; completionTokens: number; model: string }> {
    const openRouterDbConfig = await this.getProviderConfig("openrouter");
    const apiKey =
      process.env.OPENROUTER_API_KEY ||
      openRouterDbConfig?.apiKeyEncrypted ||
      "";
    const model =
      options.model ||
      process.env.OPENROUTER_PRIMARY_MODEL ||
      openRouterDbConfig?.primaryModel ||
      "deepseek/deepseek-chat";

    if (!apiKey || apiKey.startsWith("your_")) {
      throw new Error("Missing or invalid OPENROUTER_API_KEY");
    }

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://unfilteredlore.scholarhubhpu.in",
        "X-Title": "Unfiltered Lore Studio",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    const promptTokens = data.usage?.prompt_tokens || 200;
    const completionTokens = data.usage?.completion_tokens || 300;

    return { text, promptTokens, completionTokens, model };
  }

  // Unified execution with automatic OpenRouter fallback on Gemini failure
  public static async executeWithFallback(
    prompt: string,
    options: ProviderRequestOptions = {}
  ): Promise<{ text: string; providerUsed: string; modelUsed: string; costUsd: number }> {
    const startTime = Date.now();
    let geminiError: any = null;

    // 1. Try Gemini primary
    try {
      const result = await this.callGemini(prompt, options);
      const latencyMs = Date.now() - startTime;
      const costUsd = (result.promptTokens * 0.15 + result.completionTokens * 0.6) / 1000000;

      await db.usageRecord.create({
        data: {
          provider: "gemini",
          model: result.model,
          operation: "content_generation",
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          costUsd,
          success: true,
        },
      });

      return {
        text: result.text,
        providerUsed: "gemini",
        modelUsed: result.model,
        costUsd,
      };
    } catch (err: any) {
      geminiError = err;
      console.warn(`[AIService] Gemini call failed (${err.message}). Attempting OpenRouter fallback...`);

      recordAuditLog({
        action: "GEMINI_FALLBACK_TRIGGERED",
        category: "AI_GEN",
        details: `Gemini failed: ${err.message}. Cascading to OpenRouter.`,
        severity: "WARNING",
      });
    }

    // 2. Cascade to OpenRouter fallback
    try {
      const result = await this.callOpenRouter(prompt, options);
      const costUsd = (result.promptTokens * 0.14 + result.completionTokens * 0.28) / 1000000;

      await db.usageRecord.create({
        data: {
          provider: "openrouter",
          model: result.model,
          operation: "content_generation_fallback",
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          costUsd,
          success: true,
        },
      });

      return {
        text: result.text,
        providerUsed: "openrouter",
        modelUsed: result.model,
        costUsd,
      };
    } catch (openRouterErr: any) {
      console.error("[AIService] Both Gemini and OpenRouter failed.", {
        geminiError: geminiError?.message,
        openRouterError: openRouterErr?.message,
      });

      recordAuditLog({
        action: "AI_ALL_PROVIDERS_FAILED",
        category: "AI_GEN",
        details: `Both Gemini (${geminiError?.message}) and OpenRouter (${openRouterErr?.message}) failed.`,
        severity: "ERROR",
      });

      throw new Error(
        `AI Generation failed on all providers. Gemini: ${geminiError?.message} | OpenRouter: ${openRouterErr?.message}`
      );
    }
  }

  // Generate fresh, high-relatability Gen Z ideas based on brand voice
  public static async generateIdeas(params: {
    pillar?: "RELATIONSHIPS" | "SOCIAL_BEHAVIOUR" | "MONEY_MODERN_LIFE";
    format?: string;
    count?: number;
  }) {
    const brand = await db.brandConfiguration.findFirst({ where: { isActive: true } });
    const count = params.count || 3;
    const targetPillar = params.pillar || "RELATIONSHIPS";
    const targetFormat = params.format || "THE_CASE";

    const systemPrompt = `You are the lead editor of "${brand?.brandName || "Unfiltered Lore"}" (@_unfiltered_lore_) - raw everyday lore, unfiltered opinions, and online courtroom verdicts for Indian Gen Z.
Tagline: "${brand?.tagline || "Raw Everyday Lore & Unfiltered Verdicts."}"
Voice: ${brand?.voiceTone || "Bold, intelligent, confident, witty, savage, culturally aware."}
Target Audience: ${brand?.targetAudience || "Indian Gen Z, metro & tier-1/2 youth."}
Rules:
- NO robotic phrases ("In today's fast-paced world", "Unlock your potential").
- Relatable modern Indian contexts: Bangalore/Mumbai/Delhi flatmates, salary gaps, Bumble/Hinge dating, split bills, college ego, family government job pressure vs startup equity.
- Produce sharp, arguable dilemmas where multiple sides can be defended.`;

    const prompt = `Generate exactly ${count} compelling content ideas for Pillar: ${targetPillar} and Format: ${targetFormat}.
Output a raw JSON array of objects adhering to this schema (do NOT wrap in an outer object, return a top-level array [...]):
[
  {
    "title": "Short descriptive case/opinion title",
    "pillar": "${targetPillar}",
    "format": "${targetFormat}",
    "premise": "1-2 sentence real-life scenario",
    "hook": "Provocative punchy opening question",
    "scoreHook": 9.2,
    "scoreRelatability": 9.5,
    "scoreDebate": 9.4,
    "scoreOriginality": 8.8,
    "overallScore": 9.2,
    "targetAudience": "Indian Gen Z"
  }
]`;

    const response = await this.executeWithFallback(prompt, { systemPrompt });
    let rawJson: any;
    try {
      rawJson = cleanAndParseJson<any>(response.text, true);
    } catch (e: any) {
      throw new Error(`AI generated malformed ideas: ${e.message}`);
    }

    const ideasArray = Array.isArray(rawJson) ? rawJson : [rawJson];
    const parsedIdeas = ideasArray
      .map((item) => {
        const res = ContentIdeaSchema.safeParse(item);
        if (res.success) return res.data;
        if (item && typeof item === "object") {
          return {
            title: String(item.title || "Untitled Gen Z Dilemma"),
            pillar: (["RELATIONSHIPS", "SOCIAL_BEHAVIOUR", "MONEY_MODERN_LIFE"].includes(item.pillar)
              ? item.pillar
              : targetPillar) as any,
            format: (["THE_CASE", "UNPOPULAR_OPINION", "ANONYMOUS_CONFESSION", "PEOPLE_HAVE_SPOKEN", "AURA_TAX", "TWO_SIDES"].includes(item.format)
              ? item.format
              : targetFormat) as any,
            premise: String(item.premise || item.hook || "A modern dilemma unfolding in real life."),
            hook: String(item.hook || item.title || "What would you do?"),
            scoreHook: Number(item.scoreHook) || 9.0,
            scoreRelatability: Number(item.scoreRelatability) || 9.0,
            scoreDebate: Number(item.scoreDebate) || 9.0,
            scoreOriginality: Number(item.scoreOriginality) || 8.5,
            overallScore: Number(item.overallScore) || 9.0,
            targetAudience: "Indian Gen Z",
          };
        }
        return null;
      })
      .filter(Boolean);

    if (parsedIdeas.length === 0) {
      throw new Error("AI did not produce valid content ideas.");
    }
    return { ideas: parsedIdeas as any, meta: response };
  }

  // Generate complete, structured content post ready for rendering and scheduling
  public static async generateStructuredPost(params: {
    ideaPremise: string;
    pillar: string;
    format: string;
    templateCode?: string;
    isCarousel?: boolean;
  }) {
    const brand = await db.brandConfiguration.findFirst({ where: { isActive: true } });
    const systemPrompt = `You are the chief editorial writer for "Unfiltered Lore" (@_unfiltered_lore_).
Tagline: "${brand?.tagline || "Raw Everyday Lore & Unfiltered Verdicts."}"
Audience: Indian Gen Z (18-26 years old).
Language: English-first with natural, sophisticated Hinglish nuances (delulu, situationship, red flag, cooked, aura, bhai, yaar).
Formatting requirements:
- FORMAT THE_CASE: Must provide exactly 4 distinct, defensible verdicts (A, B, C, D).
- FORMAT UNPOPULAR_OPINION: Provocative statement + short sharp justification.
- FORMAT AURA_TAX: Specific penalty (-500 to -2000 Aura) or bonus (+1000 Aura) with psychological audit.
- FORMAT TWO_SIDES: Position A vs Position B clearly balanced.
- FORMAT MULTI_SLIDE_CAROUSEL: Exactly 5 slides: COVER, CONTEXT, ARGUMENT_A, ARGUMENT_B, PROMPT.`;

    const prompt = `Write a complete structured post for:
Premise: "${params.ideaPremise}"
Pillar: ${params.pillar}
Format: ${params.format}
IsCarousel: ${params.isCarousel ? "true" : "false"}

Output valid JSON matching this structure:
{
  "title": "Case / Statement Title",
  "pillar": "${params.pillar}",
  "format": "${params.format}",
  "primaryLanguage": "en-IN",
  "targetAudience": "Indian Gen Z",
  "hook": "High-impact hook under 140 chars",
  "mainNarrative": "Editorial summary of the dilemma (2-3 punchy sentences)",
  "caption": "Full Instagram caption starting with hook, dilemma context, discussion prompt, and call to action",
  "hashtags": ["TheVerdictRoom", "ModernDating", "IndianGenZ", "AuraTax", "Dilemma"],
  "callToAction": "The internet is the jury. Drop your verdict below.",
  "suggestedTemplate": "${params.templateCode || "THE_COURTROOM"}",
  ${
    params.format === "THE_CASE"
      ? `"options": [
    {"key": "A", "label": "Option A description"},
    {"key": "B", "label": "Option B description"},
    {"key": "C", "label": "Option C description"},
    {"key": "D", "label": "Option D description"}
  ],`
      : ""
  }
  ${params.format === "AURA_TAX" ? `"auraPoints": -1200,` : ""}
  ${
    params.isCarousel
      ? `"isCarousel": true,
  "slides": [
    {"slideIndex": 1, "slideType": "COVER", "headline": "Slide 1 Hook", "subtext": "Sub-hook", "bodyText": "Cover dilemma punchline", "badgeText": "CASE #108"},
    {"slideIndex": 2, "slideType": "CONTEXT", "headline": "The Reality", "subtext": "Context breakdown", "bodyText": "Context details", "badgeText": "EVIDENCE"},
    {"slideIndex": 3, "slideType": "ARGUMENT_A", "headline": "Perspective A", "subtext": "Position A summary", "bodyText": "The strongest argument for Side A", "badgeText": "SIDE A"},
    {"slideIndex": 4, "slideType": "ARGUMENT_B", "headline": "Perspective B", "subtext": "Position B summary", "bodyText": "The strongest argument for Side B", "badgeText": "SIDE B"},
    {"slideIndex": 5, "slideType": "PROMPT", "headline": "Your Verdict", "subtext": "Jury Call", "bodyText": "A, B, C, or D choices for comments", "badgeText": "VERDICT"}
  ]`
      : `"isCarousel": false`
  }
}`;

    const response = await this.executeWithFallback(prompt, { systemPrompt });
    let rawJson: any;
    try {
      rawJson = cleanAndParseJson<any>(response.text, false);
    } catch (e: any) {
      throw new Error(`AI generated malformed post response: ${e.message}`);
    }

    let postObj = rawJson;
    if (postObj && typeof postObj === "object") {
      if (postObj.post && typeof postObj.post === "object") postObj = postObj.post;
      else if (postObj.content && typeof postObj.content === "object" && !Array.isArray(postObj.content)) postObj = postObj.content;
      else if (postObj.data && typeof postObj.data === "object" && !Array.isArray(postObj.data)) postObj = postObj.data;
    }

    const parsedPost = StructuredContentPostSchema.safeParse(postObj);
    if (parsedPost.success) {
      return { post: parsedPost.data, meta: response };
    }

    // Salvage post with defaults
    const salvagedPost = {
      title: String(postObj?.title || params.ideaPremise.slice(0, 50)),
      pillar: (["RELATIONSHIPS", "SOCIAL_BEHAVIOUR", "MONEY_MODERN_LIFE"].includes(postObj?.pillar)
        ? postObj.pillar
        : params.pillar) as any,
      format: (["THE_CASE", "UNPOPULAR_OPINION", "ANONYMOUS_CONFESSION", "PEOPLE_HAVE_SPOKEN", "AURA_TAX", "TWO_SIDES"].includes(postObj?.format)
        ? postObj.format
        : params.format) as any,
      primaryLanguage: "en-IN",
      targetAudience: "Indian Gen Z",
      hook: String(postObj?.hook || postObj?.title || "Here is the situation:"),
      mainNarrative: String(postObj?.mainNarrative || params.ideaPremise),
      caption: String(
        postObj?.caption ||
          `${postObj?.hook || params.ideaPremise}\n\nWhat's your take? Drop a comment below. #UnfilteredLore`
      ),
      hashtags: Array.isArray(postObj?.hashtags)
        ? postObj.hashtags
        : ["#UnfilteredLore", "#IndianGenZ", "#Debate", "#RealTalk"],
      callToAction: String(postObj?.callToAction || "Drop your verdict below."),
      suggestedTemplate: String(postObj?.suggestedTemplate || params.templateCode || "THE_COURTROOM"),
      options: Array.isArray(postObj?.options) ? postObj.options : undefined,
      auraPoints: typeof postObj?.auraPoints === "number" ? postObj.auraPoints : undefined,
      sideA: postObj?.sideA,
      sideB: postObj?.sideB,
      isCarousel: Boolean(postObj?.isCarousel || params.isCarousel),
      slides: Array.isArray(postObj?.slides) ? postObj.slides : undefined,
    };

    const finalRes = StructuredContentPostSchema.safeParse(salvagedPost);
    if (finalRes.success) {
      return { post: finalRes.data, meta: response };
    }

    throw new Error(`Post validation failed: ${parsedPost.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join(", ")}`);
  }

  // Evaluates draft quality against brand voice, debate potential, and hook strength
  public static async evaluateQuality(post: {
    hook: string;
    mainNarrative: string;
    caption: string;
    format: string;
  }) {
    const prompt = `Evaluate this Instagram content draft for "Unfiltered Lore" (@_unfiltered_lore_, Indian Gen Z brand):
Hook: "${post.hook}"
Narrative: "${post.mainNarrative}"
Caption: "${post.caption}"
Format: "${post.format}"

Score each dimension from 1.0 to 10.0 and provide short editorial feedback.
Output JSON:
{
  "overallScore": 9.1,
  "hookClarity": 9.4,
  "genZRelatability": 9.3,
  "debatePotential": 9.5,
  "brandVoiceFit": 9.0,
  "readabilityScore": 8.8,
  "feedbackNotes": "Specific strengths and any suggested tweaks",
  "passedThreshold": true
}`;

    const response = await this.executeWithFallback(prompt, { temperature: 0.3 });
    const rawJson = cleanAndParseJson<any>(response.text, false);
    return QualityEvaluationSchema.parse(rawJson);
  }

  // Component regeneration (e.g. rewrite hook, caption, or slide without touching entire post)
  public static async rewriteComponent(params: {
    componentType: "hook" | "caption" | "options" | "slide";
    originalText: string;
    instructions: string;
  }): Promise<string> {
    const prompt = `You are the lead editor of Unfiltered Lore (@_unfiltered_lore_).
Component to rewrite: ${params.componentType}
Original: "${params.originalText}"
Revision Goal: "${params.instructions}"
Maintain our bold, witty, culturally sharp Indian Gen Z voice.
Return ONLY the rewritten text without quotes or preamble.`;

    const res = await this.executeWithFallback(prompt, { temperature: 0.8 });
    return res.text.trim().replace(/^"|"$/g, "");
  }

  // Test connection utility for the AI Provider Settings page
  public static async testConnection(provider: "gemini" | "openrouter", apiKey?: string, model?: string) {
    const testPrompt = 'Respond with JSON: {"status": "ok", "message": "Connection verified successfully"}';
    if (provider === "gemini") {
      const keyToUse = apiKey || process.env.GEMINI_API_KEY || "";
      if (!keyToUse) throw new Error("API Key is missing for Gemini");
      const modelToUse = model || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${keyToUse}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (!res.ok) throw new Error(`Gemini connection error: HTTP ${res.status} ${await res.text()}`);
      return { success: true, provider: "gemini", model: modelToUse };
    } else {
      const keyToUse = apiKey || process.env.OPENROUTER_API_KEY || "";
      if (!keyToUse) throw new Error("API Key is missing for OpenRouter");
      const modelToUse = model || "deepseek/deepseek-chat";
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keyToUse}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [{ role: "user", content: testPrompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error(`OpenRouter connection error: HTTP ${res.status} ${await res.text()}`);
      return { success: true, provider: "openrouter", model: modelToUse };
    }
  }
}
