"use client";

import React, { useEffect, useState } from "react";
import { Sidebar, TabKey } from "@/components/layout/Sidebar";
import { OverviewView } from "@/components/dashboard/OverviewView";
import { AIStudioView } from "@/components/dashboard/AIStudioView";
import { ContentCalendarView } from "@/components/dashboard/ContentCalendarView";
import { CreativeTemplatesView } from "@/components/dashboard/CreativeTemplatesView";
import { PublishingQueueView } from "@/components/dashboard/PublishingQueueView";
import { PublishedPostsView } from "@/components/dashboard/PublishedPostsView";
import { AnalyticsView } from "@/components/dashboard/AnalyticsView";
import { AIProviderSettingsView } from "@/components/dashboard/AIProviderSettingsView";
import { InstagramConnectionView } from "@/components/dashboard/InstagramConnectionView";
import { BrandVoiceView } from "@/components/dashboard/BrandVoiceView";
import { ModerationRulesView } from "@/components/dashboard/ModerationRulesView";
import { AutomationSettingsView } from "@/components/dashboard/AutomationSettingsView";
import { ActivityLogsView } from "@/components/dashboard/ActivityLogsView";
import { SystemHealthView } from "@/components/dashboard/SystemHealthView";
import { Moon, Sun, Gavel, Lock, LogIn, AlertCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isEmergencyPaused, setIsEmergencyPaused] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>("owner@unfilteredlore.com");
  const [loginPassword, setLoginPassword] = useState<string>("Ayush1994*");
  const [loginError, setLoginError] = useState<string>("");
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Check auth on load
  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // Check emergency pause status
  const checkEmergencyStatus = async () => {
    try {
      const res = await fetch("/api/settings/automation");
      const data = await res.json();
      if (data.settings) {
        setIsEmergencyPaused(data.settings.emergency_publish_pause === "true");
      }
    } catch {}
  };

  useEffect(() => {
    checkAuth();
    checkEmergencyStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoggingIn(true);
      setLoginError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setLoginError(data.error || "Login failed. Please verify credentials.");
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const handleToggleEmergencyPause = async () => {
    const next = !isEmergencyPaused;
    setIsEmergencyPaused(next);
    await fetch("/api/settings/automation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emergency_publish_pause: String(next) }),
    });
  };

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-900 flex items-center justify-center text-white animate-pulse">
          <Gavel className="w-6 h-6 text-red-200" />
        </div>
        <p className="font-editorial-serif text-slate-400 text-sm">
          Initializing Unfiltered Lore Studio...
        </p>
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#090A0D] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#11131C] border border-[#22273A] rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-red-900 mx-auto flex items-center justify-center text-white shadow-lg shadow-red-950/40">
              <Gavel className="w-6 h-6 text-red-200" />
            </div>
            <h1 className="font-editorial-serif text-2xl font-bold text-white tracking-tight">
              Unfiltered Lore Studio
            </h1>
            <p className="text-xs text-red-400 font-editorial-mono font-semibold uppercase tracking-wider">
              @_unfiltered_lore_ Automation Platform
            </p>
          </div>

          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-300">
            <span className="font-bold">Dashboard Credentials (Pre-filled):</span>
            <div className="font-mono text-[11px] text-slate-300 mt-1">
              Username: owner@unfilteredlore.com
              <br />
              Password: Ayush1994*
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500 text-red-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Username / Email
              </label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#171924] border border-[#262B3E] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#171924] border border-[#262B3E] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loggingIn ? "Verifying..." : "Access Studio"}</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center font-editorial-mono">
            &quot;The Internet Is The Jury.&quot;
          </p>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#090A0D]">
      {/* Sidebar Navigation (All 14 Sections) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isEmergencyPaused={isEmergencyPaused}
        onToggleEmergencyPause={handleToggleEmergencyPause}
        onLogout={handleLogout}
        userEmail={user.email}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-[#0D0E14] border-b border-slate-200 dark:border-[#1E2333] px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-editorial-serif font-bold text-lg text-slate-900 dark:text-white capitalize">
              {activeTab.replace(/_/g, " ")}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-editorial-mono">
              Asia/Kolkata
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {isEmergencyPaused && (
              <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold font-editorial-mono animate-pulse">
                EMERGENCY STOP ENGAGED
              </span>
            )}

            {/* Dark Mode Switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#23283B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E2230] transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === "overview" && <OverviewView onNavigate={setActiveTab} />}
          {activeTab === "ai_studio" && <AIStudioView />}
          {activeTab === "calendar" && <ContentCalendarView />}
          {activeTab === "creative_templates" && <CreativeTemplatesView />}
          {activeTab === "publishing_queue" && <PublishingQueueView />}
          {activeTab === "published_posts" && <PublishedPostsView />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "ai_providers" && <AIProviderSettingsView />}
          {activeTab === "instagram_connection" && <InstagramConnectionView />}
          {activeTab === "brand_voice" && <BrandVoiceView />}
          {activeTab === "moderation_rules" && <ModerationRulesView />}
          {activeTab === "automation" && <AutomationSettingsView />}
          {activeTab === "activity_logs" && <ActivityLogsView />}
          {activeTab === "system_health" && <SystemHealthView />}
        </main>
      </div>
    </div>
  );
}
