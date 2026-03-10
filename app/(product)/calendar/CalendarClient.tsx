"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

type PostRecord = {
  id: string;
  platform: "linkedin" | "x";
  content: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  postUrl: string | null;
  errorMessage: string | null;
  packId: string | null;
  packTitle: string | null;
};

type Props = {
  records: PostRecord[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayHeader(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ─── Platform UI ─────────────────────────────────────────────────────────────

const PLATFORM_COLORS = {
  linkedin: { bg: "bg-[#0A66C2]", border: "border-[#0A66C2]", text: "text-[#0A66C2]", label: "LinkedIn" },
  x: { bg: "bg-neutral-900", border: "border-neutral-900", text: "text-neutral-900", label: "X" },
} as const;

function PlatformDot({ platform }: { platform: "linkedin" | "x" }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${PLATFORM_COLORS[platform].bg} shrink-0`}
      title={PLATFORM_COLORS[platform].label}
    />
  );
}

function PlatformBadge({ platform }: { platform: "linkedin" | "x" }) {
  const c = PLATFORM_COLORS[platform];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${c.border} px-2 py-0.5 text-[10px] font-semibold ${c.text}`}>
      {platform === "linkedin" ? (
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
      )}
      {c.label}
    </span>
  );
}

// ─── Post row / card ──────────────────────────────────────────────────────────

function PostRow({
  record,
  onCancel,
  onReschedule,
}: {
  record: PostRecord;
  onCancel: (id: string) => void;
  onReschedule: (id: string, iso: string) => void;
}) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!confirm("Cancel this scheduled post?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/publish/${record.id}/cancel`, { method: "POST" });
      if (res.ok) onCancel(record.id);
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/publish/${record.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: new Date(newDate).toISOString() }),
      });
      const data = (await res.json()) as { error?: string; scheduledFor?: string };
      if (!res.ok) { setError(data.error ?? "Failed to reschedule."); return; }
      onReschedule(record.id, data.scheduledFor!);
      setShowReschedule(false);
      setNewDate("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const isScheduled = record.status === "scheduled";
  const isPublished = record.status === "published";
  const isFailed = record.status === "failed";
  const dateIso = isScheduled ? record.scheduledFor : record.publishedAt;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {isPublished && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {isScheduled && <Clock className="h-4 w-4 text-amber-500" />}
          {isFailed && <XCircle className="h-4 w-4 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <PlatformBadge platform={record.platform} />
            {dateIso && (
              <span className="text-xs text-neutral-400">{formatShortDate(dateIso)}</span>
            )}
            {isScheduled && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">Scheduled</span>
            )}
            {isPublished && record.postUrl && (
              <a href={record.postUrl} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-[#4F46E5] hover:underline shrink-0">
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="text-sm text-neutral-700 line-clamp-2 leading-snug">
            {record.content}
          </p>
          {record.packTitle && record.packId && (
            <Link href={`/history/${record.packId}`}
              className="mt-1 inline-block text-xs text-neutral-400 hover:text-[#4F46E5] transition-colors truncate max-w-full">
              From: {record.packTitle}
            </Link>
          )}
          {isFailed && record.errorMessage && (
            <p className="mt-1 text-xs text-red-500">{record.errorMessage}</p>
          )}
        </div>
      </div>

      {isScheduled && (
        <div className="flex items-center gap-3 pl-7">
          <button type="button" onClick={() => setShowReschedule((s) => !s)}
            className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
            Reschedule
          </button>
          <button type="button" disabled={cancelling} onClick={handleCancel}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors">
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      )}

      {showReschedule && (
        <div className="pl-7 flex items-center gap-2">
          <input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
          <button type="button" disabled={!newDate || saving} onClick={handleReschedule}
            className="flex items-center gap-1 rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#4338CA] transition-colors">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Save
          </button>
          <button type="button" onClick={() => { setShowReschedule(false); setError(null); }}
            className="text-xs text-neutral-400 hover:text-neutral-600">Cancel</button>
        </div>
      )}
      {error && <p className="pl-7 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  records,
  onCancel,
  onReschedule,
}: {
  records: PostRecord[];
  onCancel: (id: string) => void;
  onReschedule: (id: string, iso: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group records by date key
  const byDate: Record<string, PostRecord[]> = {};
  for (const r of records) {
    const dateStr = r.status === "scheduled" && r.scheduledFor
      ? isoDate(new Date(r.scheduledFor))
      : r.publishedAt
        ? isoDate(new Date(r.publishedAt))
        : null;
    if (!dateStr) continue;
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(r);
  }

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const selectedRecords = selectedDay ? (byDate[selectedDay] ?? []) : [];

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => { setWeekStart(startOfWeek(today)); setSelectedDay(isoDate(today)); };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={prevWeek}
          className="rounded-lg border border-neutral-200 p-1.5 hover:bg-neutral-50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-neutral-600" />
        </button>
        <p className="text-sm font-semibold text-neutral-800 min-w-[180px] text-center">
          {formatMonthYear(weekStart)}
        </p>
        <button type="button" onClick={nextWeek}
          className="rounded-lg border border-neutral-200 p-1.5 hover:bg-neutral-50 transition-colors">
          <ChevronRight className="h-4 w-4 text-neutral-600" />
        </button>
        <button type="button" onClick={goToday}
          className="ml-auto text-xs text-[#4F46E5] hover:underline">
          Today
        </button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const key = isoDate(day);
          const dayRecords = byDate[key] ?? [];
          const isToday = key === isoDate(today);
          const isPast = day < today;
          const isSelected = selectedDay === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className={`rounded-xl border p-2 text-left transition-all min-h-[80px] ${
                isSelected
                  ? "border-[#4F46E5] bg-[#EEF2FF]"
                  : isToday
                    ? "border-[#4F46E5] bg-white"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
              } ${isPast && !isToday ? "opacity-60" : ""}`}
            >
              <p className={`text-xs font-semibold mb-1.5 ${
                isToday ? "text-[#4F46E5]" : "text-neutral-500"
              }`}>
                {formatDayHeader(day)}
              </p>
              <div className="flex flex-wrap gap-1">
                {dayRecords.map((r) => (
                  <PlatformDot key={r.id} platform={r.platform} />
                ))}
                {dayRecords.length > 4 && (
                  <span className="text-[10px] text-neutral-400">+{dayRecords.length - 4}</span>
                )}
              </div>
              {dayRecords.length > 0 && (
                <p className="mt-1 text-[10px] text-neutral-400">
                  {dayRecords.length} post{dayRecords.length !== 1 ? "s" : ""}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-700">
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </p>
          {selectedRecords.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">No posts on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedRecords.map((r) => (
                <PostRow key={r.id} record={r} onCancel={onCancel} onReschedule={onReschedule} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  records,
  onCancel,
  onReschedule,
}: {
  records: PostRecord[];
  onCancel: (id: string) => void;
  onReschedule: (id: string, iso: string) => void;
}) {
  const upcoming = records
    .filter((r) => r.status === "scheduled")
    .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));

  const recent = records
    .filter((r) => r.status === "published" || r.status === "failed")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Upcoming — {upcoming.length} scheduled
        </p>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-5 py-8 text-center">
            <Clock className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-400">No posts scheduled.</p>
            <p className="text-xs text-neutral-400 mt-1">
              Schedule a post from any pack in{" "}
              <Link href="/history" className="text-[#4F46E5] hover:underline">History</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => (
              <PostRow key={r.id} record={r} onCancel={onCancel} onReschedule={onReschedule} />
            ))}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Recent — last 30 days
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <PostRow key={r.id} record={r} onCancel={onCancel} onReschedule={onReschedule} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function CalendarClient({ records: initial }: Props) {
  const [records, setRecords] = useState(initial);
  const [view, setView] = useState<"calendar" | "list">("list");

  const handleCancel = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReschedule = (id: string, iso: string) => {
    setRecords((prev) =>
      prev.map((r) => r.id === id ? { ...r, scheduledFor: iso } : r)
    );
  };

  const scheduled = records.filter((r) => r.status === "scheduled");
  const published = records.filter((r) => r.status === "published");

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Scheduled</p>
          <p className="text-2xl font-bold text-neutral-900">{scheduled.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Published (30d)</p>
          <p className="text-2xl font-bold text-neutral-900">{published.length}</p>
        </div>
        <div className="hidden sm:block rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Platforms active</p>
          <p className="text-2xl font-bold text-neutral-900">
            {new Set(records.map((r) => r.platform)).size}
          </p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-neutral-200 p-1 w-fit">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === "list" ? "bg-[#4F46E5] text-white" : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === "calendar" ? "bg-[#4F46E5] text-white" : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Calendar
        </button>
      </div>

      {view === "list" ? (
        <ListView records={records} onCancel={handleCancel} onReschedule={handleReschedule} />
      ) : (
        <CalendarGrid records={records} onCancel={handleCancel} onReschedule={handleReschedule} />
      )}
    </div>
  );
}
