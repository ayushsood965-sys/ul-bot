"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Share2,
  Bookmark,
  MessageCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      setData(json);
      setRecommendations(json.strategicInsights || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRecommendationAction = (id: string, action: "ACCEPTED" | "REJECTED") => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
  };

  const trendData = data?.trendData?.length ? data.trendData : [];
  const pillarData = data?.pillarBreakdown?.length ? data.pillarBreakdown : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Audience Intelligence &amp; Telemetry
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Analytics &amp; Learning Loop
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical evidence from Meta Graph API. No fabricated virality claims.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Reach & Engagement Growth */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 shadow-xs">
          <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white mb-1">
            Reach &amp; Shares Trajectory
          </h3>
          <p className="text-xs text-slate-500 mb-6">Daily account reach and story share virality</p>

          <div className="h-64 w-full flex items-center justify-center">
            {trendData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs px-6">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-40" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Telemetry Recorded Yet</p>
                <p className="mt-1 text-slate-500">Live reach and shares will plot automatically as your published posts accumulate impressions on Instagram.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23283B" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#11131C",
                      borderColor: "#23283B",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reach"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#DC2626" }}
                    name="Reach"
                  />
                  <Line
                    type="monotone"
                    dataKey="shares"
                    stroke="#A855F7"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#A855F7" }}
                    name="Shares"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Pillar Shares vs Saves Comparison */}
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 shadow-xs">
          <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white mb-1">
            Content Pillar Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-6">Story shares vs bookmark saves per category</p>

          <div className="h-64 w-full flex items-center justify-center">
            {pillarData.every((p: any) => (p.shares || 0) === 0 && (p.saves || 0) === 0) ? (
              <div className="text-center text-slate-400 text-xs px-6">
                <Share2 className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-40" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Engagement Recorded Yet</p>
                <p className="mt-1 text-slate-500">Story shares and bookmark saves will be categorized across content pillars here.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23283B" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#11131C",
                      borderColor: "#23283B",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="shares" fill="#DC2626" radius={[4, 4, 0, 0]} name="Shares" />
                  <Bar dataKey="saves" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Saves" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Strategic Learning Loop Engine (AI Recommendations) */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
            Editorial Learning Loop &amp; Strategy Adaptations
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hypotheses generated from observed account metrics. Owner approval required before updating the brand allocation engine.
        </p>

        <div className="space-y-3 mt-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-[#242A3D] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold font-editorial-mono text-red-600 uppercase">
                  {rec.pillar}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {rec.insight}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Action:</span>{" "}
                  {rec.recommendation}
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {rec.status === "PENDING_REVIEW" ? (
                  <>
                    <button
                      onClick={() => handleRecommendationAction(rec.id, "ACCEPTED")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Adopt</span>
                    </button>
                    <button
                      onClick={() => handleRecommendationAction(rec.id, "REJECTED")}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-[#202536] hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                      rec.status === "ACCEPTED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {rec.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
