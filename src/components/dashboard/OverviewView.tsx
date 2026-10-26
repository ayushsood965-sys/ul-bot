"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Share2,
  Bookmark,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Gavel,
  RefreshCw,
} from "lucide-react";

interface OverviewViewProps {
  onNavigate: (tab: any) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const overview = data?.overview || {
    postsPublishedToday: 0,
    postsScheduled: 0,
    draftsAwaitingApproval: 0,
    generationFailures: 0,
    publishingFailures: 0,
    totalReach: 0,
    totalShares: 0,
    totalSaves: 0,
    followerCount: 0,
    bestPerformingCategory: "None yet",
    isMockAccount: false,
    accountUsername: "_unfiltered_lore_",
  };

  const statCards = [
    {
      label: "Published Today",
      value: overview.postsPublishedToday,
      sub: "Target: 5 / day",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      label: "Scheduled Ahead",
      value: overview.postsScheduled,
      sub: "In automated queue",
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Awaiting Review",
      value: overview.draftsAwaitingApproval,
      sub: "Human approval gate",
      icon: AlertCircle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      label: "Instagram Followers",
      value: overview.followerCount.toLocaleString(),
      sub: `@${overview.accountUsername}`,
      icon: Users,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/20",
    },
    {
      label: "Total Reach",
      value: overview.totalReach.toLocaleString(),
      sub: "Unique accounts reached",
      icon: TrendingUp,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      label: "Total Shares",
      value: overview.totalShares.toLocaleString(),
      sub: "Story & DM virality",
      icon: Share2,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      label: "Total Saves",
      value: overview.totalSaves.toLocaleString(),
      sub: "High intent bookmarking",
      icon: Bookmark,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/20",
    },
    {
      label: "Top Pillar",
      value: overview.bestPerformingCategory.replace(/_/g, " "),
      sub: "Highest debate velocity",
      icon: Gavel,
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/20",
    },
  ];

  const upcomingSlots = [
    { slot: "Morning Slot", time: "09:30 AM IST", status: "Published", caseName: "Case #49: Situationship Cowardice" },
    { slot: "Mid-Day Slot", time: "12:30 PM IST", status: "Scheduled", caseName: "Case #104: The 50/50 Salary Trap" },
    { slot: "Afternoon Slot", time: "03:30 PM IST", status: "Open Slot", caseName: "Queue candidate available" },
    { slot: "Evening Slot", time: "06:30 PM IST", status: "Scheduled", caseName: "Aura Tax: Group Chat Ragequit" },
    { slot: "Late-Night Jury", time: "09:30 PM IST", status: "Pending", caseName: "Case #105: UPSC vs Startup Equity" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#222738] pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
              Autonomous Editorial Room
            </span>
            {overview.isMockAccount && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Safe Mock Mode
              </span>
            )}
          </div>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Studio Command Center
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline monitoring, content allocation, and automated publishing health.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A1D2A] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => onNavigate("ai_studio")}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Content</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-[#2C334A] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3 font-editorial-mono">
                {card.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Two-Column Midsection: Daily Slots & Strategic Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5 Daily Publishing Slots */}
        <div className="lg:col-span-2 bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2333]">
            <div>
              <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
                Today&apos;s 5 Publishing Slots
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asia/Kolkata (IST) schedule with automated rate-limit spacing
              </p>
            </div>
            <button
              onClick={() => onNavigate("calendar")}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1"
            >
              <span>View Full Calendar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#1A1D2B] mt-3">
            {upcomingSlots.map((slot, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1A1E2C] flex items-center justify-center font-editorial-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {slot.slot} ({slot.time})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                      {slot.caseName}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    slot.status === "Published"
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                      : slot.status === "Scheduled"
                      ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                      : "bg-slate-100 dark:bg-[#1A1E2C] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {slot.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Strategy Overview Card */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
              Brand Voice Allocation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Indian Gen Z editorial mix targets
            </p>

            <div className="space-y-4 mt-6">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Relationships &amp; Dating</span>
                  <span>40%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-[#1E2333] rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full w-[40%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Social Behaviour &amp; Ego</span>
                  <span>30%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-[#1E2333] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full w-[30%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Money &amp; Modern Life</span>
                  <span>30%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-[#1E2333] rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full w-[30%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-[#1E2333] mt-6">
            <button
              onClick={() => onNavigate("brand_voice")}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1A1E2C] hover:bg-slate-200 dark:hover:bg-[#23283B] rounded-lg transition-colors text-center"
            >
              Adjust Voice &amp; Slang Rules ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
