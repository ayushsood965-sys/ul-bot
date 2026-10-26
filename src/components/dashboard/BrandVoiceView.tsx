"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, RefreshCw, Save, Plus, X } from "lucide-react";

export function BrandVoiceView() {
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const [relationshipsWeight, setRelationshipsWeight] = useState<number>(40);
  const [socialWeight, setSocialWeight] = useState<number>(30);
  const [moneyWeight, setMoneyWeight] = useState<number>(30);

  const [slangList, setSlangList] = useState<string[]>([]);
  const [newSlang, setNewSlang] = useState<string>("");

  const [forbiddenList, setForbiddenList] = useState<string[]>([]);
  const [newForbidden, setNewForbidden] = useState<string>("");

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/brand");
      const data = await res.json();
      if (data.brand) {
        setBrand(data.brand);
        setRelationshipsWeight(data.brand.pillarRelationshipsWeight);
        setSocialWeight(data.brand.pillarSocialBehaviourWeight);
        setMoneyWeight(data.brand.pillarMoneyModernLifeWeight);
        try {
          setSlangList(JSON.parse(data.brand.slangVocabulary));
        } catch {}
        try {
          setForbiddenList(JSON.parse(data.brand.forbiddenPhrases));
        } catch {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      const res = await fetch("/api/settings/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brand.brandName,
          tagline: brand.tagline,
          voiceTone: brand.voiceTone,
          targetAudience: brand.targetAudience,
          languageMode: brand.languageMode,
          pillarRelationshipsWeight: relationshipsWeight,
          pillarSocialBehaviourWeight: socialWeight,
          pillarMoneyModernLifeWeight: moneyWeight,
          slangVocabulary: slangList,
          forbiddenPhrases: forbiddenList,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✔ Brand configuration saved successfully!");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlang = () => {
    if (newSlang.trim() && !slangList.includes(newSlang.trim())) {
      setSlangList([...slangList, newSlang.trim()]);
      setNewSlang("");
    }
  };

  const handleRemoveSlang = (item: string) => {
    setSlangList(slangList.filter((s) => s !== item));
  };

  const handleAddForbidden = () => {
    if (newForbidden.trim() && !forbiddenList.includes(newForbidden.trim())) {
      setForbiddenList([...forbiddenList, newForbidden.trim()]);
      setNewForbidden("");
    }
  };

  const handleRemoveForbidden = (item: string) => {
    setForbiddenList(forbiddenList.filter((f) => f !== item));
  };

  if (loading || !brand) {
    return <div className="p-12 text-center text-slate-400">Loading brand voice rules...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Brand Identity Engine
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Brand Voice &amp; Content Strategy
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rules, tone guidelines, and cultural guardrails injected into every LLM generation.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Brand Rules"}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg font-semibold">
          {message}
        </div>
      )}

      {/* Main Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Identity */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
            Core Identity
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              value={brand.brandName}
              onChange={(e) => setBrand({ ...brand, brandName: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={brand.tagline}
              onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Voice &amp; Personality
            </label>
            <textarea
              rows={3}
              value={brand.voiceTone}
              onChange={(e) => setBrand({ ...brand, voiceTone: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg resize-none"
            />
          </div>
        </div>

        {/* Pillar Weights */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-5 shadow-xs">
          <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
            Content Pillar Allocation Weights
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Relationships &amp; Dating</span>
                <span className="font-editorial-mono">{relationshipsWeight}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                value={relationshipsWeight}
                onChange={(e) => setRelationshipsWeight(parseInt(e.target.value, 10))}
                className="w-full accent-red-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Social Behaviour &amp; Ego</span>
                <span className="font-editorial-mono">{socialWeight}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                value={socialWeight}
                onChange={(e) => setSocialWeight(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Money &amp; Modern Life</span>
                <span className="font-editorial-mono">{moneyWeight}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                value={moneyWeight}
                onChange={(e) => setMoneyWeight(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Total Weight: {relationshipsWeight + socialWeight + moneyWeight}%
            </p>
          </div>
        </div>
      </div>

      {/* Slang Vocabulary & Forbidden Phrases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Slang Tag Dictionary */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white">
            Allowable Indian Gen Z Slang
          </h3>
          <p className="text-xs text-slate-500">
            Natural conversational terms permitted in editorial hooks &amp; captions.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {slangList.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-[#1A1E2C] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#282F45] flex items-center space-x-1"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSlang(item)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add slang term (e.g. delulu, situationship)"
              value={newSlang}
              onChange={(e) => setNewSlang(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSlang()}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddSlang}
              className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Forbidden Phrases */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white">
            Forbidden Phrases &amp; Clichés
          </h3>
          <p className="text-xs text-slate-500">
            Strictly banned expressions automatically rejected during validation.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {forbiddenList.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center space-x-1"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveForbidden(item)}
                  className="hover:text-red-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add banned phrase (e.g. In today's fast-paced world)"
              value={newForbidden}
              onChange={(e) => setNewForbidden(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddForbidden()}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddForbidden}
              className="px-3 py-1.5 bg-red-700 text-white font-semibold text-xs rounded-lg"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
