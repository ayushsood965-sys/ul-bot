"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Gavel,
  ArrowRight,
} from "lucide-react";

export function ContentCalendarView() {
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const slots = [
    { label: "Morning Prime", time: "09:30 AM", defaultPillar: "MONEY_MODERN_LIFE" },
    { label: "Mid-Day Discussion", time: "12:30 PM", defaultPillar: "RELATIONSHIPS" },
    { label: "Afternoon Slump", time: "03:30 PM", defaultPillar: "SOCIAL_BEHAVIOUR" },
    { label: "Evening Transit Peak", time: "06:30 PM", defaultPillar: "RELATIONSHIPS" },
    { label: "Late-Night Jury Room", time: "09:30 PM", defaultPillar: "SOCIAL_BEHAVIOUR" },
  ];

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content/posts?status=SCHEDULED");
      const data = await res.json();
      setScheduledPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#222738] pb-6 flex items-start justify-between">
        <div>
          <span className="font-editorial-mono text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
            Timezone: Asia/Kolkata (IST)
          </span>
          <h2 className="font-editorial-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Content Calendar &amp; Schedule
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            5 automated daily publication slots with rate-limit protection and duplicate guards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCalendar}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-[#23283B] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A1D2A]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Date Switcher Bar */}
      <div className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="w-5 h-5 text-red-600" />
          <span className="font-editorial-serif font-bold text-lg text-slate-900 dark:text-white">
            {selectedDate.toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222738] text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#181B26] text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d);
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222738] text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Daily Slots Detailed Grid */}
      <div className="space-y-4">
        <h3 className="font-editorial-serif text-xl font-bold text-slate-900 dark:text-white">
          5 Configured Daily Slots
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {slots.map((slot, idx) => {
            const scheduledForThisSlot = scheduledPosts[idx];

            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#11131C] border border-slate-200 dark:border-[#1E2333] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-[#2E364E] transition-all min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-[#1E2333]">
                    <span className="font-editorial-mono font-bold text-red-600">
                      Slot {idx + 1}
                    </span>
                    <span className="text-slate-500 font-semibold">{slot.time}</span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-3">
                    {slot.label}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {slot.defaultPillar.replace(/_/g, " ")}
                  </span>

                  {scheduledForThisSlot ? (
                    <div className="mt-3 p-2 bg-slate-50 dark:bg-[#171924] rounded-lg border border-slate-200 dark:border-[#232838]">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-editorial-mono">
                        {scheduledForThisSlot.contentId}
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2 mt-0.5">
                        {scheduledForThisSlot.title}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 py-6 border-2 border-dashed border-slate-200 dark:border-[#232838] rounded-lg flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-slate-400">Slot Available</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#1E2333] flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      scheduledForThisSlot ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {scheduledForThisSlot ? "● Armed & Ready" : "○ Unfilled"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
