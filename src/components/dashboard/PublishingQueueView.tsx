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
  Sparkles,
  Send,
  PlusCircle,
} from "lucide-react";

export function PublishingQueueView() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoGenerating, setAutoGenerating] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [filterTab, setFilterTab] = useState<"ALL" | "SCHEDULED" | "PUBLISHED" | "FAILED">("ALL");

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/publishing/queue");
      const data = await res.json();
      setJobs(data.jobs || []);
      setIsPaused(!!data.isPaused);

      // Also fetch drafts and approved posts that can be queued
      const postsRes = await fetch("/api/content/posts");
      const postsData = await postsRes.json();
      if (postsData.posts) {
        // Filter out posts that already have an active SCHEDULED or CLAIMED job
        const activePostIds = new Set(
          (data.jobs || [])
            .filter((j: any) => j.status === "SCHEDULED" || j.status === "CLAIMED")
            .map((j: any) => j.postId)
        );
        const unqueued = postsData.posts.filter(
          (p: any) =>
            !activePostIds.has(p.id) &&
            p.status !== "PUBLISHED"
        );
        setPendingPosts(unqueued);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const formatErrorMessage = (err: any): string => {
    if (!err) return "Action failed";
    if (typeof err === "string") {
      if (err.startsWith("[") || err.startsWith("{")) {
        try {
          const parsed = JSON.parse(err);
          if (Array.isArray(parsed)) {
            return parsed.map((p: any) => p.message || p.code || JSON.stringify(p)).join(", ");
          }
          if (parsed.message) return parsed.message;
          if (parsed.error) return typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
        } catch {}
      }
      return err;
    }
    if (err.message) return err.message;
    return JSON.stringify(err);
  };

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
        setStatusMessage(
          action === "publish_now"
            ? `✔ Published due jobs to Instagram (${data.result?.published || 0} published)!`
            : "✔ Action processed."
        );
        await fetchQueue();
      } else {
        alert(formatErrorMessage(data.error || "Action failed"));
      }
    } catch (e: any) {
      alert(formatErrorMessage(e.message));
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick Queue a pending post for publication in the next available 4-5 hour slot
  const handleQueuePost = async (postId: string) => {
    try {
      setActionInProgress(postId);
      const res = await fetch("/api/publishing/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data.success) {
        const slotTime = data.job?.scheduledFor
          ? new Date(data.job.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "next publishing slot";
        setStatusMessage(`✔ Post added to publishing queue for ${slotTime}!`);
        await fetchQueue();
      } else {
        alert(formatErrorMessage(data.error || "Failed to schedule post"));
      }
    } catch (e: any) {
      alert(formatErrorMessage(e.message));
    } finally {
      setActionInProgress(null);
    }
  };

  // Publish pending post immediately
  const handlePublishPostDirectly = async (postId: string) => {
    if (!confirm("Publish this post live to Instagram right now?")) return;
    try {
      setActionInProgress(postId);
      setStatusMessage("Publishing to Instagram...");
      // 1. Schedule for now
      await fetch("/api/publishing/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          scheduledFor: new Date().toISOString(),
        }),
      });

      // 2. Trigger worker publish_now
      const res = await fetch("/api/publishing/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("🚀 Post successfully published live to Instagram!");
        await fetchQueue();
      } else {
        alert(formatErrorMessage(data.error || "Publish failed"));
      }
    } catch (e: any) {
      alert(formatErrorMessage(e.message));
    } finally {
      setActionInProgress(null);
    }
  };

  // Autonomous content generation & queue trigger
  const handleAutoGenerate = async () => {
    try {
      setAutoGenerating(true);
      setStatusMessage("🤖 AI generating new post and queuing...");
      const res = await fetch("/api/automation/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✔ AI successfully created & queued: "${data.post?.title}"`);
        await fetchQueue();
      } else {
        alert(formatErrorMessage(data.error || data.message || "Auto-generation failed"));
      }
    } catch (e: any) {
      alert(formatErrorMessage(e.message));
    } finally {
      setAutoGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAutoGenerate}
            disabled={autoGenerating}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-semibold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 ${autoGenerating ? "animate-spin" : "text-amber-400"}`} />
            <span>{autoGenerating ? "AI Creating Post..." : "🤖 Auto-Generate & Queue Next Post"}</span>
          </button>

          <button
            onClick={() => handleAction("publish_now")}
            disabled={actionInProgress !== null}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Process Ready Jobs Now</span>
          </button>

          <button
            onClick={fetchQueue}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A1D2A]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Message Notification */}
      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage("")} className="text-emerald-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}

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

      {/* Available Drafts Ready to Queue Section */}
      {pendingPosts.length > 0 && (
        <div className="bg-slate-50 dark:bg-[#11131C] border border-blue-200 dark:border-blue-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                <span>Posts Ready to Queue ({pendingPosts.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These generated posts are in your library and ready to be scheduled or published.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingPosts.slice(0, 6).map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-[#161824] border border-slate-200 dark:border-[#23283B] rounded-lg p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-editorial-mono font-bold text-red-600 dark:text-red-400">
                      {post.contentId}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {post.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {post.hook}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#23283B] flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleQueuePost(post.id)}
                    disabled={actionInProgress === post.id}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded flex items-center space-x-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>⚡ Add to Queue</span>
                  </button>
                  <button
                    onClick={() => handlePublishPostDirectly(post.id)}
                    disabled={actionInProgress === post.id}
                    className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>🚀 Publish</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Queue List Table */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-[#1E2333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white">
              Publishing Jobs ({jobs.length})
            </h3>
            <span className="text-xs text-slate-500 font-editorial-mono">
              • Rate Spacing: 300s
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#161824] p-1 rounded-lg text-xs font-semibold">
            {(["ALL", "SCHEDULED", "PUBLISHED", "FAILED"] as const).map((tab) => {
              const count =
                tab === "ALL"
                  ? jobs.length
                  : jobs.filter((j) => (tab === "SCHEDULED" ? j.status === "SCHEDULED" || j.status === "CLAIMED" : j.status === tab)).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    filterTab === tab
                      ? "bg-white dark:bg-[#202434] text-red-600 dark:text-red-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {(() => {
          const filteredJobs = jobs.filter((j) => {
            if (filterTab === "ALL") return true;
            if (filterTab === "SCHEDULED") return j.status === "SCHEDULED" || j.status === "CLAIMED" || j.status === "PUBLISHING";
            return j.status === filterTab;
          });

          if (filteredJobs.length === 0) {
            return (
              <div className="p-12 text-center text-slate-400 text-sm space-y-3">
                <p>No jobs found in this tab.</p>
                {pendingPosts.length > 0 ? (
                  <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                    Tip: Click &quot;⚡ Add to Queue&quot; on any post above to schedule it immediately!
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Click &quot;🤖 Auto-Generate &amp; Queue Next Post&quot; above or head to AI Studio to brainstorm new content!
                  </p>
                )}
              </div>
            );
          }

          return (
            <div className="divide-y divide-slate-100 dark:divide-[#1E2333]">
              {filteredJobs.map((job) => {
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
                        <>
                          <button
                            onClick={() => handlePublishPostDirectly(job.postId)}
                            disabled={actionInProgress === job.postId}
                            className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1 shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Publish Now</span>
                          </button>
                          <button
                            onClick={() => handleAction("cancel", job.id)}
                            disabled={actionInProgress === job.id}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {isPublished && (
                        <a
                          href={job.post?.igPermalink || `https://instagram.com/p/${job.post?.igMediaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View on Instagram</span>
                        </a>
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
          );
        })()}
      </div>
    </div>
  );
}
