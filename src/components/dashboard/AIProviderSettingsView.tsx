"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Shield,
  DollarSign,
  Send,
  Zap,
} from "lucide-react";

export function AIProviderSettingsView() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: any }>({});

  const [geminiKeyInput, setGeminiKeyInput] = useState<string>("");
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState<string>("");
  const [geminiModelInput, setGeminiModelInput] = useState<string>("gemini-2.5-flash");
  const [openRouterModelInput, setOpenRouterModelInput] = useState<string>("deepseek/deepseek-chat");

  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/providers");
      const data = await res.json();
      if (data.providers) {
        setProviders(data.providers);
        const gemini = data.providers.find((p: any) => p.providerName === "gemini");
        const openrouter = data.providers.find((p: any) => p.providerName === "openrouter");
        if (gemini) setGeminiModelInput(gemini.primaryModel);
        if (openrouter) setOpenRouterModelInput(openrouter.primaryModel);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleTestConnection = async (provider: "gemini" | "openrouter", key: string, model: string) => {
    try {
      setTesting(provider);
      setTestResult((prev) => ({ ...prev, [provider]: null }));
      const res = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key, model }),
      });
      const data = await res.json();
      setTestResult((prev) => ({ ...prev, [provider]: data }));
    } catch (err: any) {
      setTestResult((prev) => ({ ...prev, [provider]: { success: false, error: err.message } }));
    } finally {
      setTesting(null);
    }
  };

  const handleSaveSettings = async (providerId: string, model: string, key: string) => {
    try {
      setSaving(true);
      setSaveMessage("");
      const res = await fetch("/api/settings/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: providerId,
          primaryModel: model,
          apiKey: key,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage("✔ AI Provider settings saved securely!");
        await fetchProviders();
      } else {
        setSaveMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setSaveMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const geminiProvider = providers.find((p) => p.providerName === "gemini");
  const openRouterProvider = providers.find((p) => p.providerName === "openrouter");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Multi-Provider Architecture
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            AI Provider Settings &amp; Fallback
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Google Gemini as primary engine with automatic OpenRouter cascade fallback. Never hardcoded.
          </p>
        </div>

        <button
          onClick={fetchProviders}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg font-semibold">
          {saveMessage}
        </div>
      )}

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gemini Primary Engine */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2333]">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
                Google Gemini (Primary)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              Primary Engine
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gemini Model Identifier
              </label>
              <input
                type="text"
                value={geminiModelInput}
                onChange={(e) => setGeminiModelInput(e.target.value)}
                placeholder="gemini-2.5-flash"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gemini API Key (Encrypted server-side)
              </label>
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder={geminiProvider?.hasApiKey ? "••••••••••••••••••••••••" : "Paste your Gemini API key"}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {geminiProvider?.hasApiKey
                  ? "✔ Key is securely configured in system environment"
                  : "No key currently detected; you can set GEMINI_API_KEY in .env or enter above"}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleTestConnection("gemini", geminiKeyInput, geminiModelInput)}
                disabled={testing === "gemini"}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#1A1E2C] hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing === "gemini" ? "animate-spin" : ""}`} />
                <span>Test Gemini</span>
              </button>

              {geminiProvider && (
                <button
                  type="button"
                  onClick={() => handleSaveSettings(geminiProvider.id, geminiModelInput, geminiKeyInput)}
                  disabled={saving}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors"
                >
                  Save Config
                </button>
              )}
            </div>

            {testResult.gemini && (
              <div
                className={`p-3 rounded-lg text-xs font-mono ${
                  testResult.gemini.success
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                    : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-300"
                }`}
              >
                {testResult.gemini.success
                  ? `✔ Gemini Connection Verified (${testResult.gemini.result.model})`
                  : `❌ Test Failed: ${testResult.gemini.error}`}
              </div>
            )}
          </div>
        </div>

        {/* OpenRouter Fallback Engine */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2333]">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
                OpenRouter (Cascade Fallback)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
              Active Fallback
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                OpenRouter Model Identifier
              </label>
              <input
                type="text"
                value={openRouterModelInput}
                onChange={(e) => setOpenRouterModelInput(e.target.value)}
                placeholder="deepseek/deepseek-chat"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                OpenRouter API Key (Encrypted server-side)
              </label>
              <input
                type="password"
                value={openRouterKeyInput}
                onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                placeholder={openRouterProvider?.hasApiKey ? "••••••••••••••••••••••••" : "Paste your OpenRouter API key"}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {openRouterProvider?.hasApiKey
                  ? "✔ Key is securely configured in system environment"
                  : "No key currently detected; you can set OPENROUTER_API_KEY in .env or enter above"}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleTestConnection("openrouter", openRouterKeyInput, openRouterModelInput)}
                disabled={testing === "openrouter"}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#1A1E2C] hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing === "openrouter" ? "animate-spin" : ""}`} />
                <span>Test OpenRouter</span>
              </button>

              {openRouterProvider && (
                <button
                  type="button"
                  onClick={() => handleSaveSettings(openRouterProvider.id, openRouterModelInput, openRouterKeyInput)}
                  disabled={saving}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors"
                >
                  Save Config
                </button>
              )}
            </div>

            {testResult.openrouter && (
              <div
                className={`p-3 rounded-lg text-xs font-mono ${
                  testResult.openrouter.success
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                    : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-300"
                }`}
              >
                {testResult.openrouter.success
                  ? `✔ OpenRouter Connection Verified (${testResult.openrouter.result.model})`
                  : `❌ Test Failed: ${testResult.openrouter.error}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
