"use client";

import React, { useState } from "react";
import {
  Palette,
  Download,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gavel,
  Sliders,
  Type,
  Share2,
} from "lucide-react";
import { CreativeRendererService } from "@/lib/services/creative-renderer-service";

export function CreativeTemplatesView() {
  const [selectedTemplate, setSelectedTemplate] = useState<
    "THE_COURTROOM" | "UNPOPULAR_OPINION" | "AURA_TAX" | "TWO_SIDES" | "MULTI_SLIDE_CAROUSEL"
  >("THE_COURTROOM");

  // Editable parameters
  const [caseNumber, setCaseNumber] = useState<string>("CASE #104");
  const [pillar, setPillar] = useState<string>("RELATIONSHIPS");
  const [headline, setHeadline] = useState<string>(
    "Your partner makes ₹18 LPA in Bangalore. You earn ₹6 LPA. They still demand a strict 50-50 split on ₹4,000 dinners."
  );
  const [narrative, setNarrative] = useState<string>(
    "One argues 50/50 preserves dignity and independence. The other is quietly burning their entire savings just to keep up with dates they never chose."
  );
  const [verdictStamp, setVerdictStamp] = useState<string>("VERDICT PENDING");
  const [auraPoints, setAuraPoints] = useState<number>(-1200);

  // Two sides parameters
  const [sideATitle, setSideATitle] = useState<string>("Strict 50-50 Equality");
  const [sideAArg, setSideAArg] = useState<string>(
    "Preserves self-respect and eliminates hidden entitlement or transactional dynamics."
  );
  const [sideBTitle, setSideBTitle] = useState<string>("Income Proportional");
  const [sideBArg, setSideBArg] = useState<string>(
    "Equal financial effort (percentage of income) prevents quiet resentment and lifestyle burnout."
  );

  // Carousel composer slides state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(1);
  const [carouselSlides, setCarouselSlides] = useState([
    {
      index: 1,
      badge: "CASE #105",
      headline: "UPSC Dream vs ₹12 LPA Startup Equity",
      body: "Your parents saved ₹15 Lakhs for Delhi coaching. You just received an early-stage fintech offer with ESOPs. Which sacrifice has higher return on sanity?",
    },
    {
      index: 2,
      badge: "EVIDENCE A",
      headline: "The Parental Security Thesis",
      body: "In Tier-1/2 India, a government desk is lifelong security and social honor that recession, tech layoffs, and algorithmic changes cannot touch.",
    },
    {
      index: 3,
      badge: "EVIDENCE B",
      headline: "The Modern Equity Compounding",
      body: "Spending your 4 prime creative years memorizing static syllabi while the global AI wave accelerates is peak risk. Build scalable skills.",
    },
    {
      index: 4,
      badge: "THE COMPROMISE",
      headline: "The Hybrid Fallacy",
      body: "People say 'take the job and study on weekends'. In reality, 12-hour Gurgaon tech sprints leave zero cognitive bandwidth for Civil Services.",
    },
    {
      index: 5,
      badge: "VERDICT TIME",
      headline: "The Internet Is The Jury",
      body: "A. Take the coaching — Family honor & lifelong security.\nB. Take the startup — Modern wealth & real skills.\nC. Refuse both and forge your own path.",
    },
  ]);

  // Generate SVG string live
  const activeSlide = carouselSlides[currentSlideIndex - 1];

  const svgString = CreativeRendererService.generateSVG({
    templateCode: selectedTemplate,
    caseNumber,
    pillar,
    headline: selectedTemplate === "MULTI_SLIDE_CAROUSEL" ? activeSlide.headline : headline,
    narrative: selectedTemplate === "MULTI_SLIDE_CAROUSEL" ? activeSlide.body : narrative,
    auraPoints,
    stampText: verdictStamp,
    slideIndex: currentSlideIndex,
    slideTotal: carouselSlides.length,
    slideType: selectedTemplate === "MULTI_SLIDE_CAROUSEL" ? activeSlide.badge : undefined,
    sideA: { title: sideATitle, argument: sideAArg },
    sideB: { title: sideBTitle, argument: sideBArg },
  });

  const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

  const handleDownload = () => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unfiltered-lore-${selectedTemplate.toLowerCase()}-${caseNumber.replace(/\s+/g, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Deterministic Creative Studio
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Visual Asset &amp; Template Studio
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standard 1080 × 1350 px (4:5 Feed Ratio). Clean vector typography, dark luxury framing.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download 1080×1350 Asset</span>
        </button>
      </div>

      {/* Template Selectors */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-[#1E2333] pb-4">
        {[
          { code: "THE_COURTROOM", label: "1. The Courtroom Flagship" },
          { code: "UNPOPULAR_OPINION", label: "2. Unpopular Opinion" },
          { code: "AURA_TAX", label: "3. Aura Tax Audit" },
          { code: "TWO_SIDES", label: "4. Two Sides Split Panel" },
          { code: "MULTI_SLIDE_CAROUSEL", label: "5. Multi-Slide Carousel" },
        ].map((t) => (
          <button
            key={t.code}
            onClick={() => setSelectedTemplate(t.code as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              selectedTemplate === t.code
                ? "bg-red-700 text-white border-red-700 shadow-sm"
                : "bg-white dark:bg-[#12141F] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#222738] hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Studio Workspace: Left Controls + Right Live Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-5">
          <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-red-600" />
            <span>Card Controls</span>
          </h3>

          {/* Template-Specific Controls */}
          {selectedTemplate === "MULTI_SLIDE_CAROUSEL" ? (
            /* Carousel Slide Navigator & Editor */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2333]">
                <span className="text-xs font-bold text-slate-500 font-editorial-mono">
                  Slide {currentSlideIndex} of {carouselSlides.length}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    disabled={currentSlideIndex <= 1}
                    onClick={() => setCurrentSlideIndex((prev) => Math.max(1, prev - 1))}
                    className="p-1 rounded bg-slate-100 dark:bg-[#1C2030] disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentSlideIndex >= carouselSlides.length}
                    onClick={() => setCurrentSlideIndex((prev) => Math.min(carouselSlides.length, prev + 1))}
                    className="p-1 rounded bg-slate-100 dark:bg-[#1C2030] disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Slide Badge Tag
                </label>
                <input
                  type="text"
                  value={activeSlide.badge}
                  onChange={(e) => {
                    const updated = [...carouselSlides];
                    updated[currentSlideIndex - 1].badge = e.target.value;
                    setCarouselSlides(updated);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Slide Headline
                </label>
                <input
                  type="text"
                  value={activeSlide.headline}
                  onChange={(e) => {
                    const updated = [...carouselSlides];
                    updated[currentSlideIndex - 1].headline = e.target.value;
                    setCarouselSlides(updated);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Slide Body / Evidence Text
                </label>
                <textarea
                  rows={4}
                  value={activeSlide.body}
                  onChange={(e) => {
                    const updated = [...carouselSlides];
                    updated[currentSlideIndex - 1].body = e.target.value;
                    setCarouselSlides(updated);
                  }}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg resize-none"
                />
              </div>
            </div>
          ) : (
            /* Single Card Controls */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Case Identifier
                  </label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg font-editorial-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pillar Tag
                  </label>
                  <input
                    type="text"
                    value={pillar}
                    onChange={(e) => setPillar(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Provocative Headline
                </label>
                <textarea
                  rows={3}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dilemma Narrative / Scenario
                </label>
                <textarea
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg resize-none"
                />
              </div>

              {selectedTemplate === "AURA_TAX" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aura Points (+1000 / -1000)
                  </label>
                  <input
                    type="number"
                    step={100}
                    value={auraPoints}
                    onChange={(e) => setAuraPoints(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg font-editorial-mono"
                  />
                </div>
              )}

              {selectedTemplate === "TWO_SIDES" && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1E2333]">
                  <div>
                    <label className="block text-xs font-semibold text-sky-600 mb-1">
                      Side A Title &amp; Argument
                    </label>
                    <input
                      type="text"
                      value={sideATitle}
                      onChange={(e) => setSideATitle(e.target.value)}
                      className="w-full px-3 py-1 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg mb-1"
                    />
                    <textarea
                      rows={2}
                      value={sideAArg}
                      onChange={(e) => setSideAArg(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-rose-600 mb-1">
                      Side B Title &amp; Argument
                    </label>
                    <input
                      type="text"
                      value={sideBTitle}
                      onChange={(e) => setSideBTitle(e.target.value)}
                      className="w-full px-3 py-1 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg mb-1"
                    />
                    <textarea
                      rows={2}
                      value={sideBArg}
                      onChange={(e) => setSideBArg(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg resize-none"
                    />
                  </div>
                </div>
              )}

              {selectedTemplate === "THE_COURTROOM" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Verdict Stamp Text
                  </label>
                  <input
                    type="text"
                    value={verdictStamp}
                    onChange={(e) => setVerdictStamp(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg font-editorial-mono"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live 4:5 Instagram Feed Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-[#07080B] rounded-xl border border-slate-200 dark:border-[#1E2333]">
          <div className="w-full max-w-[420px] aspect-4/5 rounded-lg overflow-hidden shadow-2xl border border-slate-700/60 bg-[#0B0C10]">
            <img
              src={svgDataUri}
              alt="Live Creative Preview"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="font-editorial-mono text-[11px] text-slate-500 mt-4">
            Canvas: 1080 × 1350 px | 4:5 Portrait Ratio | The Verdict Room Official Template
          </p>
        </div>
      </div>
    </div>
  );
}
