"use client";

import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Flame,
  Gavel,
  ShieldCheck,
  Send,
  Eye,
  Calendar,
  Layers,
  Play,
  Clock,
} from "lucide-react";

export function AIStudioView() {
  const [pillar, setPillar] = useState<string>("RELATIONSHIPS");
  const [format, setFormat] = useState<string>("THE_CASE");
  const [isCarousel, setIsCarousel] = useState<boolean>(false);
  const [customPremise, setCustomPremise] = useState<string>("");

  const [loadingIdeas, setLoadingIdeas] = useState<boolean>(false);
  const [ideas, setIdeas] = useState<any[]>([]);

  const [generatingPost, setGeneratingPost] = useState<boolean>(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [moderationInfo, setModerationInfo] = useState<any>(null);

  const [rewritingComponent, setRewritingComponent] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string>("");

  // Step 1: Generate fresh ideas
  const handleGenerateIdeas = async () => {
    try {
      setLoadingIdeas(true);
      const res = await fetch("/api/content/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pillar, format, count: 3 }),
      });
      const data = await res.json();
      if (data.ideas) {
        setIdeas(data.ideas);
      } else {
        alert(data.error || "Failed to generate ideas");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingIdeas(false);
    }
  };

  // Step 2: Generate full post from premise or selected idea
  const handleGenerateFullPost = async (premiseText: string, ideaId?: string) => {
    try {
      setGeneratingPost(true);
      setSavingStatus("");
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId,
          premise: premiseText,
          pillar,
          format,
          isCarousel,
        }),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setGeneratedPost(data.post);
        setModerationInfo(data.moderation);
      } else {
        alert(data.error || "Failed to generate structured post");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingPost(false);
    }
  };

  // Step 3: Rewrite a single component (e.g. hook or caption)
  const handleRewriteComponent = async (componentType: "hook" | "caption" | "options") => {
    if (!generatedPost) return;
    try {
      setRewritingComponent(componentType);
      const originalText =
        componentType === "hook"
          ? generatedPost.hook
          : componentType === "caption"
          ? generatedPost.caption
          : generatedPost.optionsJson || "";

      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "rewrite",
          componentType,
          originalText,
          instructions: "Make it more provocative, sharper, and deeply relatable to Indian Gen Z debates.",
        }),
      });
      const data = await res.json();
      if (data.success && data.rewritten) {
        const updated = { ...generatedPost };
        if (componentType === "hook") updated.hook = data.rewritten;
        if (componentType === "caption") updated.caption = data.rewritten;
        setGeneratedPost(updated);

        // Update in backend
        await fetch(`/api/content/posts/${generatedPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [componentType]: data.rewritten }),
        });
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRewritingComponent(null);
    }
  };

  // Step 4: Approve draft
  const handleApproveDraft = async () => {
    if (!generatedPost) return;
    try {
      setSavingStatus("Approving...");
      const res = await fetch(`/api/content/posts/${generatedPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedPost(data.post);
        setSavingStatus("✔ Approved! Ready for scheduling.");
      }
    } catch (e: any) {
      setSavingStatus(`Error: ${e.message}`);
    }
  };

  // Step 5: Add post directly to publishing queue
  const handleSchedulePost = async (minutesFromNow: number = 5) => {
    if (!generatedPost) return;
    try {
      setSavingStatus("Adding to Queue...");
      const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
      const res = await fetch("/api/publishing/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: generatedPost.id,
          scheduledFor: scheduledTime.toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedPost((prev: any) => ({ ...prev, status: "SCHEDULED" }));
        setSavingStatus(`✔ Added to Publishing Queue! Scheduled for ${scheduledTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      } else {
        setSavingStatus(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setSavingStatus(`Error: ${e.message}`);
    }
  };

  // Step 6: Publish immediately to Instagram Feed
  const handlePublishNow = async () => {
    if (!generatedPost) return;
    if (!confirm("Are you sure you want to publish this post live to Instagram right now?")) return;
    try {
      setSavingStatus("Publishing live to Instagram...");
      // 1. Ensure scheduled
      await fetch("/api/publishing/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: generatedPost.id,
          scheduledFor: new Date().toISOString(),
        }),
      });

      // 2. Trigger immediate worker execution
      const res = await fetch("/api/publishing/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now" }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedPost((prev: any) => ({ ...prev, status: "PUBLISHED" }));
        setSavingStatus("🚀 Successfully Published live to Instagram Feed!");
      } else {
        setSavingStatus(`Publish Error: ${data.error}`);
      }
    } catch (e: any) {
      setSavingStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6">
        <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
          AI Generation &amp; Editorial Pipeline
        </span>
        <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
          Unfiltered Lore Studio
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Dual-engine intelligence: Google Gemini Primary with automatic OpenRouter fallback.
        </p>
      </div>

      {/* Control Panel: Pillar, Format, Carousel Toggle */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 shadow-xs space-y-5">
        <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
          Content Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Content Pillar
            </label>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="RELATIONSHIPS">Relationships &amp; Dating (40%)</option>
              <option value="SOCIAL_BEHAVIOUR">Social Behaviour &amp; Ego (30%)</option>
              <option value="MONEY_MODERN_LIFE">Money &amp; Modern Life (30%)</option>
            </select>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Recurring Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="THE_CASE">Format A: The Case (Dilemma + 4 Verdicts)</option>
              <option value="UNPOPULAR_OPINION">Format B: Unpopular Opinion</option>
              <option value="ANONYMOUS_CONFESSION">Format C: Anonymous Confession</option>
              <option value="PEOPLE_HAVE_SPOKEN">Format D: The People Have Spoken</option>
              <option value="AURA_TAX">Format E: Aura Tax (-1000 / +1000 Aura)</option>
              <option value="TWO_SIDES">Format F: Two Sides (Contrasting Views)</option>
            </select>
          </div>

          {/* Carousel Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Creative Type
            </label>
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => setIsCarousel(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  !isCarousel
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-400"
                    : "bg-slate-50 dark:bg-[#161824] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#262C3E]"
                }`}
              >
                Single Card (4:5)
              </button>
              <button
                type="button"
                onClick={() => setIsCarousel(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  isCarousel
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-400"
                    : "bg-slate-50 dark:bg-[#161824] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#262C3E]"
                }`}
              >
                5-Slide Carousel
              </button>
            </div>
          </div>
        </div>

        {/* Custom Premise Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Optional Custom Premise / Seed Story (Leave blank to generate fresh ideas)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g., Your flatmate brings their situationship over 6 nights a week without splitting utility bills."
              value={customPremise}
              onChange={(e) => setCustomPremise(e.target.value)}
              className="flex-1 px-4 py-2 text-sm bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            {customPremise ? (
              <button
                onClick={() => handleGenerateFullPost(customPremise)}
                disabled={generatingPost}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded-lg flex items-center space-x-2 transition-all shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generatingPost ? "Generating..." : "Generate Post"}</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateIdeas}
                disabled={loadingIdeas}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm rounded-lg flex items-center space-x-2 hover:opacity-90 transition-all shrink-0"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{loadingIdeas ? "Brainstorming..." : "Brainstorm Ideas"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generated Ideas Suggestions */}
      {ideas.length > 0 && !generatedPost && (
        <div className="space-y-4">
          <h3 className="font-editorial-serif text-xl font-bold text-slate-900 dark:text-white">
            AI Brainstormed Ideas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 flex flex-col justify-between hover:border-red-400 dark:hover:border-red-800 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-editorial-mono font-bold text-red-600 dark:text-red-400">
                      Score: {idea.overallScore}/10
                    </span>
                    <span className="text-slate-400 text-[11px] font-medium">
                      Debate: {idea.scoreDebate}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">
                    {idea.premise}
                  </p>
                </div>

                <button
                  onClick={() => handleGenerateFullPost(idea.premise, idea.id)}
                  disabled={generatingPost}
                  className="mt-4 w-full py-2 px-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-700 dark:text-red-300 font-semibold text-xs rounded-lg flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>{generatingPost ? "Building..." : "Build Complete Post"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Full Post Preview & Editor */}
      {generatedPost && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Post Copy & Component Rewriter */}
          <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2333] pb-4">
              <div>
                <span className="font-editorial-mono text-xs text-red-600 font-bold">
                  {generatedPost.contentId}
                </span>
                <h3 className="font-editorial-serif text-xl font-bold text-slate-900 dark:text-white">
                  {generatedPost.title}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded font-semibold ${
                    generatedPost.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {generatedPost.status}
                </span>
              </div>
            </div>

            {/* Hook Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-editorial-mono">
                  Provocative Hook
                </label>
                <button
                  onClick={() => handleRewriteComponent("hook")}
                  disabled={rewritingComponent === "hook"}
                  className="text-xs font-semibold text-red-600 hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${rewritingComponent === "hook" ? "animate-spin" : ""}`} />
                  <span>Regenerate Hook</span>
                </button>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#171924] border border-slate-200 dark:border-[#232738] rounded-lg text-sm text-slate-900 dark:text-white font-medium">
                {generatedPost.hook}
              </div>
            </div>

            {/* Narrative / Context */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-editorial-mono">
                Editorial Dilemma
              </label>
              <div className="p-3 bg-slate-50 dark:bg-[#171924] border border-slate-200 dark:border-[#232738] rounded-lg text-sm text-slate-700 dark:text-slate-300">
                {generatedPost.mainNarrative}
              </div>
            </div>

            {/* 4 Verdict Choices (if THE_CASE) */}
            {generatedPost.optionsJson && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-editorial-mono">
                  Verdict Choices (A, B, C, D)
                </label>
                <div className="space-y-1.5">
                  {JSON.parse(generatedPost.optionsJson).map((opt: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 dark:bg-[#171924] border border-slate-200 dark:border-[#232738] rounded-lg text-xs flex items-center space-x-2"
                    >
                      <span className="w-5 h-5 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold flex items-center justify-center font-editorial-mono">
                        {opt.key}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {opt.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption & Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-editorial-mono">
                  Instagram Caption
                </label>
                <button
                  onClick={() => handleRewriteComponent("caption")}
                  disabled={rewritingComponent === "caption"}
                  className="text-xs font-semibold text-red-600 hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${rewritingComponent === "caption" ? "animate-spin" : ""}`} />
                  <span>Rewrite Caption</span>
                </button>
              </div>
              <textarea
                rows={5}
                readOnly
                value={generatedPost.caption}
                className="w-full p-3 bg-slate-50 dark:bg-[#171924] border border-slate-200 dark:border-[#232738] rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono resize-none focus:outline-none"
              />
            </div>

            {/* Safety & Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#1E2333] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
                <span>Quality Score: {generatedPost.qualityScore}/10 (Passed)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {savingStatus && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mr-2">
                    {savingStatus}
                  </span>
                )}

                {generatedPost.status !== "APPROVED" && generatedPost.status !== "SCHEDULED" && generatedPost.status !== "PUBLISHED" && (
                  <button
                    onClick={handleApproveDraft}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Draft</span>
                  </button>
                )}

                {generatedPost.status !== "SCHEDULED" && generatedPost.status !== "PUBLISHED" && (
                  <button
                    onClick={() => handleSchedulePost(5)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>⚡ Add to Queue</span>
                  </button>
                )}

                {generatedPost.status !== "PUBLISHED" && (
                  <button
                    onClick={handlePublishNow}
                    className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>🚀 Publish Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Instagram Feed Asset Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
                Rendered Creative Card (1080 × 1350)
              </h3>
              <a
                href={`/api/creative/render/${generatedPost.contentId}?download=true`}
                download
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
              >
                Download SVG/PNG
              </a>
            </div>

            {/* 4:5 Instagram Feed Ratio Container */}
            <div className="bg-[#0B0C10] rounded-xl overflow-hidden border border-slate-800 shadow-xl max-w-sm mx-auto aspect-4/5 flex items-center justify-center">
              <img
                src={`/api/creative/render/${generatedPost.contentId}`}
                alt={generatedPost.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
