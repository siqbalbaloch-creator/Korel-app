"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Youtube, RefreshCw } from "lucide-react";

type HistoryPack = {
  id: string;
  title: string;
  createdAt: string;
  sourceType: "youtube" | "transcript";
  sourcePreview: string;
  wordCount: number;
  planAtGeneration: "Free" | "Pro";
  status: "draft" | "published";
  regenerationCount?: number;
};

type HistoryClientProps = {
  packs: HistoryPack[];
};

type TimeFilter = "all" | "today" | "week" | "month";
type SourceFilter = "all" | "youtube" | "transcript";
type StatusFilter = "all" | "draft" | "published";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart} — ${timePart}`;
};

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const startOfWeek = (date: Date) => {
  const next = startOfDay(date);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  return next;
};

const startOfMonth = (date: Date) => {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
};

const matchesTimeFilter = (value: string, filter: TimeFilter) => {
  if (filter === "all") {
    return true;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const now = new Date();
  if (filter === "today") {
    return date >= startOfDay(now);
  }
  if (filter === "week") {
    return date >= startOfWeek(now);
  }
  if (filter === "month") {
    return date >= startOfMonth(now);
  }
  return true;
};

export default function HistoryClient({ packs }: HistoryClientProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredPacks = useMemo(
    () =>
      packs.filter((pack) => {
        if (sourceFilter !== "all" && pack.sourceType !== sourceFilter) {
          return false;
        }
        if (statusFilter !== "all" && pack.status !== statusFilter) {
          return false;
        }
        return matchesTimeFilter(pack.createdAt, timeFilter);
      }),
    [packs, sourceFilter, statusFilter, timeFilter],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-neutral-600">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="min-w-[120px] rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40"
        >
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          value={timeFilter}
          onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
          className="min-w-[120px] rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40"
        >
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(event) =>
            setSourceFilter(event.target.value as SourceFilter)
          }
          className="min-w-[120px] rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40"
        >
          <option value="all">All sources</option>
          <option value="youtube">YouTube</option>
          <option value="transcript">Transcript</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredPacks.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-sm text-neutral-500 text-center">
            No history matches those filters.
          </div>
        )}

        {filteredPacks.length > 0 && (
          <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_24px] items-center gap-6 px-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
            <span>Pack</span>
            <span className="text-right">Words</span>
            <span>Status</span>
            <span className="sr-only">Open</span>
          </div>
        )}

        {filteredPacks.map((pack) => (
          <Link
            key={pack.id}
            href={`/history/${pack.id}`}
            className="group block bg-white rounded-2xl border border-neutral-200 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_24px] items-center gap-6 px-6 py-5">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[15px] font-semibold text-neutral-900 truncate">
                    {pack.title}
                  </h3>
                  {(pack.regenerationCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                      <RefreshCw className="h-2.5 w-2.5" />
                      {pack.regenerationCount} refinement{pack.regenerationCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">
                    {formatDateTime(pack.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  {pack.sourceType === "youtube" ? (
                    <Youtube className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <FileText className="h-4 w-4 text-neutral-400" />
                  )}
                  <span className="text-xs uppercase tracking-wide text-neutral-400">
                    {pack.sourceType === "youtube" ? "YouTube" : "Transcript"}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="truncate max-w-[520px]">
                    {pack.sourcePreview}
                  </span>
                </div>
              </div>

              <span className="text-sm font-medium text-neutral-900 tabular-nums text-right">
                {pack.wordCount}
              </span>
              <span
                className={`justify-self-start rounded-full px-3 py-1 text-xs font-medium ${
                  pack.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {pack.status === "published" ? "Published" : "Draft"}
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-400 justify-self-end" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
