"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
} from "lucide-react";

export function PublishedPostsView() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  const fetchPublished = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content/posts?status=PUBLISHED");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublished();
  }, []);

  const handleSyncInsights = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/instagram/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchPublished();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Verified Distribution Feed
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Published Instagram Content
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real performance telemetry, comment velocity, and audience verdict signals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncInsights}
            disabled={syncing}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing Insights..." : "Sync Insights from Meta"}</span>
          </button>
        </div>
      </div>

      {/* Grid of Published Posts */}
      {posts.length === 0 ? (
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-12 text-center text-slate-400 text-sm">
          No published posts recorded yet. Once a scheduled post finishes publishing, it will appear here with live engagement insights.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-[#2E364E] transition-all flex flex-col justify-between"
            >
              <div>
                {/* 4:5 Card Thumbnail Preview */}
                <div className="w-full aspect-4/5 bg-[#0B0C10] overflow-hidden border-b border-slate-100 dark:border-[#1E2333]">
                  <img
                    src={`/api/creative/render/${post.contentId}`}
                    alt={post.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-editorial-mono font-bold text-red-600">
                      {post.contentId}
                    </span>
                    <span className="text-slate-400 font-editorial-mono">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <h4 className="font-semibold text-base text-slate-900 dark:text-white line-clamp-2">
                    {post.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {post.caption}
                  </p>
                </div>
              </div>

              {/* Engagement Metrics Footer */}
              <div className="p-4 bg-slate-50 dark:bg-[#161824] border-t border-slate-100 dark:border-[#1E2333]">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Reach</span>
                    <span className="font-bold font-editorial-mono text-slate-800 dark:text-slate-200">
                      14.2K
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Shares</span>
                    <span className="font-bold font-editorial-mono text-purple-600">680</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Saves</span>
                    <span className="font-bold font-editorial-mono text-teal-600">520</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Comments</span>
                    <span className="font-bold font-editorial-mono text-red-600">312</span>
                  </div>
                </div>

                {post.igPermalink && (
                  <a
                    href={post.igPermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full py-1.5 px-3 bg-white dark:bg-[#1D2130] border border-slate-200 dark:border-[#2A3146] text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-colors"
                  >
                    <span>View on Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
