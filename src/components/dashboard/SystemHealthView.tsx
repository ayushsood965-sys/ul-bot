"use client";

import React, { useEffect, useState } from "react";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, Server, Database, Cpu } from "lucide-react";

export function SystemHealthView() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/system/health");
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Infrastructure Diagnostics
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            System Health &amp; Runtime Status
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time liveness probes for database, persistent background daemon, and API quotas.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {health && (
        <div className="space-y-6">
          {/* Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database Health */}
            <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-editorial-serif font-bold text-slate-900 dark:text-white">
                    Database
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-editorial-mono">
                  {health.database?.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-editorial-mono">
                Query Latency: {health.database?.latencyMs}ms
              </p>
            </div>

            {/* Background Worker */}
            <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <h3 className="font-editorial-serif font-bold text-slate-900 dark:text-white">
                    Publishing Worker
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-editorial-mono ${
                    health.worker?.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {health.worker?.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {health.worker?.note}
              </p>
            </div>

            {/* Meta API Mode */}
            <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-purple-600" />
                  <h3 className="font-editorial-serif font-bold text-slate-900 dark:text-white">
                    Meta Graph API
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 font-editorial-mono">
                  {health.metaApi?.mode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {health.metaApi?.isConfigured
                  ? "Live Meta Graph API Publishing Enabled"
                  : "Safe Mock Simulation Active"}
              </p>
            </div>
          </div>

          {/* Detailed Environment Specs */}
          <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-editorial-serif text-lg font-bold text-slate-900 dark:text-white">
              Environment Telemetry
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-editorial-mono">
              <div className="p-3 bg-slate-50 dark:bg-[#171924] rounded-lg">
                <span className="text-slate-400 block text-[10px]">Node Version</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.environment?.nodeVersion}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#171924] rounded-lg">
                <span className="text-slate-400 block text-[10px]">OS Platform</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.environment?.platform}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#171924] rounded-lg">
                <span className="text-slate-400 block text-[10px]">Server Uptime</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.environment?.uptimeSeconds}s</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#171924] rounded-lg">
                <span className="text-slate-400 block text-[10px]">Scheduled Jobs</span>
                <span className="font-bold text-red-600">{health.queue?.scheduled}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
