"use client";

import React, { useEffect, useState } from "react";
import {
  ListOrdered,
  Clock,
  Play,
  RotateCcw,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export function PublishingQueueView() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/publishing/queue");
      const data = await res.json();
      setJobs(data.jobs || []);
      setIsPaused(!!data.isPaused);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (action: string, jobId?: string) => {
    try {
      setActionInProgress(jobId || action);
      const res = await fetch("/api/publishing/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, jobId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQueue();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Automated Publishing Pipeline
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Publishing Queue &amp; Worker Dispatch
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Persistent job claiming, exponential backoff retries, and duplicate protection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleAction("publish_now")}
            disabled={actionInProgress !== null}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Process Ready Jobs Now</span>
          </button>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Emergency Pause Warning Banner */}
      {isPaused && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-700 dark:text-red-300 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 animate-pulse" />
          <div className="text-xs">
            <span className="font-bold">🚨 EMERGENCY PUBLISHING PAUSE IS ACTIVE:</span> No queued
            jobs will be dispatched to Instagram until resumed by the owner via Automation Settings.
          </div>
        </div>
      )}

      {/* Queue List Table */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-[#1E2333] flex items-center justify-between">
          <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white">
            Queued &amp; Recent Publishing Jobs ({jobs.length})
          </h3>
          <span className="text-xs text-slate-500 font-editorial-mono">
            Rate Spacing: 300s between posts
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No publishing jobs currently queued. Head over to AI Studio to schedule your next post!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1E2333]">
            {jobs.map((job) => {
              const isScheduled = job.status === "SCHEDULED";
              const isPublished = job.status === "PUBLISHED";
              const isFailed = job.status === "FAILED";
              const isClaimed = job.status === "CLAIMED" || job.status === "PUBLISHING";

              return (
                <div key={job.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#151724] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-editorial-mono text-xs font-bold text-red-600">
                        {job.jobId}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-editorial-mono text-xs text-slate-500">
                        {job.post?.contentId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPublished
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                            : isScheduled
                            ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                            : isClaimed
                            ? "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 animate-pulse"
                            : isFailed
                            ? "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {job.post?.title || "Untitled Post"}
                    </h4>

                    <div className="flex items-center space-x-4 text-xs text-slate-500 font-editorial-mono pt-1">
                      <span>Scheduled: {new Date(job.scheduledFor).toLocaleString("en-IN")}</span>
                      <span>Attempts: {job.attempts}/{job.maxAttempts}</span>
                    </div>

                    {job.lastError && (
                      <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded mt-2 font-mono">
                        Error: {job.lastError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isScheduled && (
                      <button
                        onClick={() => handleAction("cancel", job.id)}
                        disabled={actionInProgress === job.id}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}

                    {isFailed && (
                      <button
                        onClick={() => handleAction("retry", job.id)}
                        disabled={actionInProgress === job.id}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
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
