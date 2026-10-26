"use client";

import React, { useEffect, useState } from "react";
import { History, RefreshCw, Filter, AlertCircle, Info, AlertTriangle } from "lucide-react";

export function ActivityLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url =
        categoryFilter === "ALL"
          ? "/api/system/logs"
          : `/api/system/logs?category=${categoryFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [categoryFilter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Operational Audit Trail
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            System &amp; Activity Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable chronicle of all AI generations, editorial approvals, and Instagram publications.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          "ALL",
          "AI_GEN",
          "EDITORIAL",
          "SCHEDULE",
          "PUBLISH",
          "CONFIG",
          "AUTH",
          "MODERATION",
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              categoryFilter === cat
                ? "bg-red-700 text-white border-red-700"
                : "bg-white dark:bg-[#12141F] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#222738] hover:bg-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-[#1E2333] flex items-center justify-between">
          <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white">
            Audit Records ({logs.length})
          </h3>
          <span className="text-xs text-slate-500 font-editorial-mono">
            Showing latest 100 entries
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No audit logs found for the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1E2333]">
            {logs.map((log) => {
              const isError = log.severity === "ERROR" || log.severity === "CRITICAL";
              const isWarn = log.severity === "WARNING";

              return (
                <div key={log.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-[#151724]">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-editorial-mono ${
                          isError
                            ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                            : isWarn
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-[#1E2230] dark:text-slate-300"
                        }`}
                      >
                        {log.severity}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white font-editorial-mono">
                        {log.action}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-semibold">{log.category}</span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {log.details}
                    </p>
                  </div>

                  <div className="text-right text-slate-400 font-editorial-mono shrink-0">
                    <p>{new Date(log.createdAt).toLocaleTimeString("en-IN")}</p>
                    <p className="text-[10px]">{new Date(log.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
