"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";

export function ModerationRulesView() {
  const [flaggedPosts, setFlaggedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string>("");

  const fetchFlagged = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content/posts?status=NEEDS_REVIEW");
      const data = await res.json();
      setFlaggedPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlagged();
  }, []);

  const handleAction = async (postId: string, newStatus: "APPROVED" | "CANCELLED") => {
    try {
      const res = await fetch(`/api/content/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✔ Post marked as ${newStatus}`);
        await fetchFlagged();
      }
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Safety &amp; Editorial Ethics
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Moderation &amp; Safety Rules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated Indian PII redaction, defamation filters, and human editorial review queue.
          </p>
        </div>

        <button
          onClick={fetchFlagged}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg font-semibold">
          {actionMessage}
        </div>
      )}

      {/* Safety Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-editorial-serif">
              PII &amp; Doxxing Guard
            </h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automatically scrubs Indian mobile numbers (+91), Aadhaar IDs, personal emails, and social handles from confessions.
          </p>
        </div>

        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-editorial-serif">
              Defamation Prevention
            </h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Blocks unverified accusations against identifiable people. Savage opinions on behavior, never targeted harassment.
          </p>
        </div>

        <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-blue-500">
            <FileText className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-editorial-serif">
              Fake Statistics Filter
            </h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bans fake urgency and fabricated claims like &quot;99% of people agree&quot; or invented Harvard research citations.
          </p>
        </div>
      </div>

      {/* Moderation Review Queue */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-[#1E2333] flex items-center justify-between">
          <h3 className="font-editorial-serif text-base font-bold text-slate-900 dark:text-white">
            Drafts Requiring Editorial Review ({flaggedPosts.length})
          </h3>
          <span className="text-xs text-slate-500 font-editorial-mono">
            Mandatory Human Review Gate
          </span>
        </div>

        {flaggedPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No flagged drafts in queue. All recent content passed automated safety checks!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1E2333]">
            {flaggedPosts.map((post) => (
              <div key={post.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-editorial-mono text-xs font-bold text-red-600">
                    {post.contentId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    Flagged for Review
                  </span>
                </div>

                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {post.title}
                </h4>

                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#161824] p-3 rounded-lg border border-slate-200 dark:border-[#262C3E]">
                  &quot;{post.hook}&quot;
                </p>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleAction(post.id, "CANCELLED")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleAction(post.id, "APPROVED")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Draft</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
