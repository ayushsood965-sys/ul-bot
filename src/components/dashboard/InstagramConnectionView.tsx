"use client";

import React, { useEffect, useState } from "react";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Key,
  HelpCircle,
  Zap,
} from "lucide-react";

export function InstagramConnectionView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [accountIdInput, setAccountIdInput] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/instagram/connection");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  const handleToggleMockMode = async (enableMock: boolean) => {
    try {
      setSaving(true);
      const res = await fetch("/api/instagram/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMockMode: enableMock }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setMessage(`Switched mode to: ${enableMock ? "Safe Demo/Mock Mode" : "Live API"}`);
        await fetchConnection();
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!tokenInput || !accountIdInput) {
      alert("Please enter both Permanent Access Token and Instagram Account ID");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/instagram/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: tokenInput,
          accountId: accountIdInput,
          isMockMode: false,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setMessage("✔ Credentials saved! Testing live connection...");
        await fetchConnection();
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const isMock = data?.health?.isMock ?? true;
  const isConnected = data?.health?.connected ?? false;

  const wizardSteps = [
    {
      step: 1,
      title: "Create Meta Developer App",
      desc: "Go to developers.facebook.com and create a 'Business' type app named 'Unfiltered Lore Publishing'.",
    },
    {
      step: 2,
      title: "Add Instagram Graph API & Webhooks",
      desc: "Under your App Dashboard, add the 'Instagram Graph API' product.",
    },
    {
      step: 3,
      title: "Convert to Instagram Professional",
      desc: "Ensure @_unfiltered_lore_ is converted to an Instagram Business or Creator account in the mobile app.",
    },
    {
      step: 4,
      title: "Link Facebook Page",
      desc: "Connect your Instagram Business account to a Facebook Page where you have full admin management permissions.",
    },
    {
      step: 5,
      title: "Grant Required Graph Permissions",
      desc: "Required scopes: instagram_basic, instagram_content_publish, instagram_manage_insights, pages_show_list, pages_read_engagement.",
    },
    {
      step: 6,
      title: "Generate Permanent Page Access Token",
      desc: "Use Meta Graph API Explorer or System User Token Generator to generate a non-expiring Page Token.",
    },
    {
      step: 7,
      title: "Find Your Instagram Account ID",
      desc: "Query GET /v21.0/me/accounts?fields=instagram_business_account to obtain the exact 17-digit numeric ID.",
    },
    {
      step: 8,
      title: "Save & Test Publishing Pipeline",
      desc: "Enter token and ID below or set INSTAGRAM_ACCESS_TOKEN & INSTAGRAM_ACCOUNT_ID in .env.",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Official Meta Graph API v21.0
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Instagram &amp; Meta Connection
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official content publishing containers, carousel assembly, and insights synchronization.
          </p>
        </div>

        <button
          onClick={fetchConnection}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {message && (
        <div className="p-3 bg-slate-100 dark:bg-[#1A1E2C] border border-slate-200 dark:border-[#262C3E] text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200">
          {message}
        </div>
      )}

      {/* Connection Status Banner */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? isMock
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />
            <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
              {isConnected
                ? isMock
                  ? "Connected in Safe Demo / Mock Mode"
                  : "Connected to Live Instagram Account"
                : "Not Connected"}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-editorial-mono">
            Handle: @{data?.health?.username || "_unfiltered_lore_"} | Account ID: {data?.health?.accountId || "mock_17841400293849201"}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleToggleMockMode(!isMock)}
            disabled={saving}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isMock
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}
          >
            {isMock ? "Mock Mode Active (Click for Live)" : "Live Mode Active (Click for Mock)"}
          </button>
        </div>
      </div>

      {/* Onboarding Wizard (8 Steps) */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-[#1E2333] pb-3">
          <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-red-600" />
            <span>Official Meta Developer Setup Guide (8 Steps)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow these steps to connect your Instagram Professional account via the official Graph API.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wizardSteps.map((step) => (
            <div
              key={step.step}
              className="p-4 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#222738] rounded-xl flex flex-col justify-between"
            >
              <div>
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-xs flex items-center justify-center font-editorial-mono mb-2">
                  {step.step}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Manual Key Entry */}
        <div className="p-4 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#222738] rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white font-editorial-serif">
            Enter Live Meta Credentials (or edit in .env)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Permanent Page Access Token
              </label>
              <input
                type="password"
                placeholder="EAA..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#12141F] border border-slate-200 dark:border-[#2B3248] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instagram Business Account ID
              </label>
              <input
                type="text"
                placeholder="178414..."
                value={accountIdInput}
                onChange={(e) => setAccountIdInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#12141F] border border-slate-200 dark:border-[#2B3248] rounded-lg font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSaveCredentials}
            disabled={saving}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save & Verify Meta Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
