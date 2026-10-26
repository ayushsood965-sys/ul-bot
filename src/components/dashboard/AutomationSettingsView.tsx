"use client";

import React, { useEffect, useState } from "react";
import { Sliders, AlertTriangle, Save, RefreshCw, Power } from "lucide-react";

export function AutomationSettingsView() {
  const [settings, setSettings] = useState<any>({
    automation_generation_enabled: "true",
    automation_rendering_enabled: "true",
    automation_publishing_enabled: "false",
    require_approval_before_publishing: "true",
    emergency_publish_pause: "false",
    daily_publishing_target: "5",
    timezone: "Asia/Kolkata",
    min_spacing_seconds: "300",
    quality_threshold_score: "8.0",
    moderation_sensitivity: "HIGH",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/automation");
      const data = await res.json();
      if (data.settings) {
        setSettings((prev: any) => ({ ...prev, ...data.settings }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (updated?: any) => {
    try {
      setSaving(true);
      setMessage("");
      const toSave = updated || settings;
      const res = await fetch("/api/settings/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✔ Automation settings updated and active!");
        await fetchSettings();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmergencyStop = () => {
    const isPaused = settings.emergency_publish_pause === "true";
    const next = isPaused ? "false" : "true";
    const updated = { ...settings, emergency_publish_pause: next };
    setSettings(updated);
    handleSave(updated);
  };

  const isEmergencyPaused = settings.emergency_publish_pause === "true";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Operational Governance
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Automation Control Panel
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publishing toggles, rate limits, human-in-the-loop gates, and emergency kill-switch.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg font-semibold">
          {message}
        </div>
      )}

      {/* Emergency Kill Switch Banner */}
      <div
        className={`p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          isEmergencyPaused
            ? "bg-red-600 text-white border-red-700 shadow-lg animate-pulse"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-slate-900 dark:text-white"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`p-3 rounded-full ${
              isEmergencyPaused ? "bg-white text-red-600" : "bg-red-600 text-white"
            }`}
          >
            <AlertTriangle className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h3 className="font-editorial-serif font-bold text-lg">
              {isEmergencyPaused
                ? "EMERGENCY STOP ENGAGED: ALL PUBLISHING PAUSED"
                : "Master Emergency Publishing Stop"}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isEmergencyPaused ? "text-red-100" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Instantly halts all outbound Instagram container publishing while keeping drafts and queue intact.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleEmergencyStop}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            isEmergencyPaused
              ? "bg-white text-red-700 hover:bg-red-50 shadow-md"
              : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
          }`}
        >
          {isEmergencyPaused ? "RESUME PUBLISHING PIPELINE" : "ENGAGE EMERGENCY STOP"}
        </button>
      </div>

      {/* Toggles and Knobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Switches */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-5 shadow-xs">
          <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
            Pipeline Stage Switches
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Enable AI Generation
                </p>
                <p className="text-xs text-slate-500">Allow background idea &amp; draft synthesis</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automation_generation_enabled === "true"}
                onChange={(e) =>
                  setSettings({ ...settings, automation_generation_enabled: String(e.target.checked) })
                }
                className="w-5 h-5 accent-red-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Enable Automatic Creative Rendering
                </p>
                <p className="text-xs text-slate-500">Auto-render 1080x1350 SVG/PNG cards</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automation_rendering_enabled === "true"}
                onChange={(e) =>
                  setSettings({ ...settings, automation_rendering_enabled: String(e.target.checked) })
                }
                className="w-5 h-5 accent-red-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Mandatory Human Editorial Approval
                </p>
                <p className="text-xs text-slate-500">Require human sign-off before scheduling</p>
              </div>
              <input
                type="checkbox"
                checked={settings.require_approval_before_publishing === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    require_approval_before_publishing: String(e.target.checked),
                  })
                }
                className="w-5 h-5 accent-red-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Enable Autonomous Publishing
                </p>
                <p className="text-xs text-slate-500">
                  Allow worker to publish scheduled approved posts
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.automation_publishing_enabled === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    automation_publishing_enabled: String(e.target.checked),
                  })
                }
                className="w-5 h-5 accent-red-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Operating Controls */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
            Operational Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Daily Publishing Target
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.daily_publishing_target}
              onChange={(e) => setSettings({ ...settings, daily_publishing_target: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg font-editorial-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Configured for 5 feed posts / day</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Operating Timezone
            </label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg font-editorial-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Minimum Rate Limit Spacing (Seconds)
            </label>
            <input
              type="number"
              value={settings.min_spacing_seconds}
              onChange={(e) => setSettings({ ...settings, min_spacing_seconds: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#262C3E] rounded-lg font-editorial-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Default 300s (5 minutes) protects account against Instagram spam flags
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
