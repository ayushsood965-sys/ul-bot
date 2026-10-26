"useclient";

import React from "react";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Palette,
  ListOrdered,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Share2,
  BookOpen,
  ShieldAlert,
  Sliders,
  History,
  Activity,
  AlertTriangle,
  LogOut,
  Gavel,
} from "lucide-react";

export type TabKey =
  | "overview"
  | "ai_studio"
  | "calendar"
  | "creative_templates"
  | "publishing_queue"
  | "published_posts"
  | "analytics"
  | "ai_providers"
  | "instagram_connection"
  | "brand_voice"
  | "moderation_rules"
  | "automation"
  | "activity_logs"
  | "system_health";

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isEmergencyPaused: boolean;
  onToggleEmergencyPause: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isEmergencyPaused,
  onToggleEmergencyPause,
  onLogout,
  userEmail = "owner@theverdictroom.internal",
}: SidebarProps) {
  const navSections = [
    {
      title: "CONTENT & CREATIVE",
      items: [
        { key: "overview", label: "Overview", icon: LayoutDashboard },
        { key: "ai_studio", label: "AI Content Studio", icon: Sparkles },
        { key: "calendar", label: "Content Calendar", icon: Calendar },
        { key: "creative_templates", label: "Creative Templates", icon: Palette },
        { key: "publishing_queue", label: "Publishing Queue", icon: ListOrdered },
        { key: "published_posts", label: "Published Posts", icon: CheckCircle2 },
        { key: "analytics", label: "Analytics & Insights", icon: TrendingUp },
      ],
    },
    {
      title: "STRATEGY & PLATFORM",
      items: [
        { key: "ai_providers", label: "AI Provider Settings", icon: Cpu },
        { key: "instagram_connection", label: "Instagram / Meta API", icon: Share2 },
        { key: "brand_voice", label: "Brand Voice & Strategy", icon: BookOpen },
        { key: "moderation_rules", label: "Moderation & Safety", icon: ShieldAlert },
        { key: "automation", label: "Automation Controls", icon: Sliders },
      ],
    },
    {
      title: "OBSERVABILITY",
      items: [
        { key: "activity_logs", label: "Activity Logs", icon: History },
        { key: "system_health", label: "System Health", icon: Activity },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-[#0D0E14] border-r border-slate-200 dark:border-[#1E2333] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-[#1E2333] bg-slate-50/50 dark:bg-[#11131C]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-red-900 flex items-center justify-center text-white shadow-md shadow-red-950/20">
            <Gavel className="w-5 h-5 text-red-100" />
          </div>
          <div>
            <h1 className="font-editorial-serif text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Unfiltered Lore
            </h1>
            <p className="font-editorial-mono text-[11px] text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">
              Studio &amp; Automation
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Kill-Switch Bar */}
      <div className="p-3 bg-slate-100 dark:bg-[#151722] border-b border-slate-200 dark:border-[#1E2333]">
        <button
          onClick={onToggleEmergencyPause}
          className={`w-full py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
            isEmergencyPaused
              ? "bg-red-600 text-white shadow-sm hover:bg-red-700 animate-pulse"
              : "bg-slate-200 dark:bg-[#1E2230] text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {isEmergencyPaused ? "🚨 PUBLISHING PAUSED" : "Emergency Stop: Active"}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-editorial-mono">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectTab(item.key as TabKey)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold border-l-4 border-red-700 dark:border-red-500"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#161824] hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-red-700 dark:text-red-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-[#1E2333] bg-slate-50/50 dark:bg-[#11131C] flex items-center justify-between">
        <div className="truncate pr-2">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            Chief Editor
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {userEmail}
          </p>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-slate-100 dark:hover:bg-[#1E2230] transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
