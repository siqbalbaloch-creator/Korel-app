"use client";

import { useState } from "react";
import { Loader2, Rss, Trash2, Pause, Play, Plus, Youtube, Mic } from "lucide-react";

type Feed = {
  id: string;
  feedUrl: string;
  feedName: string | null;
  feedType: string;
  isActive: boolean;
  lastCheckedAt: string | null;
  lastEpisodeTitle: string | null;
  checkCount: number;
  episodeCount: number;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function FeedIcon({ type }: { type: string }) {
  if (type === "youtube") return <Youtube className="h-4 w-4 text-red-500" />;
  if (type === "podcast") return <Mic className="h-4 w-4 text-[#4F46E5]" />;
  return <Rss className="h-4 w-4 text-neutral-400" />;
}

function FeedCard({
  feed,
  onRemove,
  onToggle,
}: {
  feed: Feed;
  onRemove: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove "${feed.feedName ?? feed.feedUrl}"?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/feeds/${feed.id}`, { method: "DELETE" });
      onRemove(feed.id);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feeds/${feed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !feed.isActive }),
      });
      if (res.ok) onToggle(feed.id, !feed.isActive);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FeedIcon type={feed.feedType} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {feed.feedName ?? "Unnamed feed"}
            </p>
            <p className="text-xs text-neutral-400 truncate">{feed.feedUrl}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            feed.isActive
              ? "bg-green-100 text-green-700"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {feed.isActive ? "Active" : "Paused"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <p className="text-lg font-bold text-neutral-900">{feed.checkCount}</p>
          <p className="text-xs text-neutral-400">Packs</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <p className="text-lg font-bold text-neutral-900">{feed.episodeCount}</p>
          <p className="text-xs text-neutral-400">Episodes</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <p className="text-sm font-semibold text-neutral-900">
            {feed.lastCheckedAt ? timeAgo(feed.lastCheckedAt) : "—"}
          </p>
          <p className="text-xs text-neutral-400">Last check</p>
        </div>
      </div>

      {feed.lastEpisodeTitle && (
        <p className="text-xs text-neutral-500 truncate">
          Last: &ldquo;{feed.lastEpisodeTitle}&rdquo;
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={loading}
          onClick={handleToggle}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : feed.isActive ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {feed.isActive ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleRemove}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      </div>
    </div>
  );
}

function AddFeedModal({ onAdded }: { onAdded: (feed: Feed) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ feedName: string; itemCount: number } | null>(null);

  const handleAdd = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl: url, feedName: name || undefined }),
      });
      const data = (await res.json()) as {
        error?: string;
        feed?: Feed;
        feedName?: string;
        itemCount?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to add feed");
        return;
      }
      setPreview({ feedName: data.feedName!, itemCount: data.itemCount! });
      if (data.feed) {
        onAdded({
          ...data.feed,
          episodeCount: 0,
        });
        setOpen(false);
        setUrl("");
        setName("");
        setPreview(null);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add RSS Feed
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-neutral-900">Add a feed</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Feed URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://feeds.simplecast.com/... or youtube.com/@channel"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
          <p className="mt-1 text-xs text-neutral-400">
            Supports podcast RSS feeds and YouTube channel URLs
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Feed Name <span className="font-normal text-neutral-400">(optional — auto-detected)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My First Million"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>
      </div>

      {preview && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Found: <strong>{preview.feedName}</strong> — {preview.itemCount} episodes
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!url.trim() || loading}
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Validating…" : "Validate & Add"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setUrl(""); setName(""); setError(null); }}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function FeedsClient({ initialFeeds }: { initialFeeds: Feed[] }) {
  const [feeds, setFeeds] = useState(initialFeeds);

  const handleRemove = (id: string) => setFeeds((f) => f.filter((x) => x.id !== id));
  const handleToggle = (id: string, isActive: boolean) =>
    setFeeds((f) => f.map((x) => (x.id === id ? { ...x, isActive } : x)));
  const handleAdded = (feed: Feed) => setFeeds((f) => [feed, ...f]);

  return (
    <div className="space-y-5">
      <AddFeedModal onAdded={handleAdded} />

      {feeds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center">
          <Rss className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-500">No feeds added yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            Add a podcast or YouTube channel to start auto-generating packs
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              onRemove={handleRemove}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
        <p className="text-xs font-medium text-neutral-600">How it works</p>
        <ul className="mt-2 space-y-1 text-xs text-neutral-500 list-disc pl-4">
          <li>Korel checks your feeds daily for new episodes</li>
          <li>When a new episode is detected, a content pack is generated automatically</li>
          <li>You&apos;ll receive an email with a link to review and publish</li>
          <li>YouTube transcripts are fetched automatically; podcast show notes are used for podcasts</li>
        </ul>
      </div>
    </div>
  );
}
