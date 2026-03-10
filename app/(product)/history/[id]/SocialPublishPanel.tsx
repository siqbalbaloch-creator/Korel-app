"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ExternalLink, Clock } from "lucide-react";

type PlatformPublishRecord = {
  id: string;
  status: string;
  postUrl: string | null;
  postId: string | null;
  publishedAt: string | null;
  scheduledFor: string | null;
};

type Props = {
  packId: string;
  linkedInConnected: boolean;
  xConnected: boolean;
  linkedinRecord: PlatformPublishRecord | null;
  xRecord: PlatformPublishRecord | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PlatformPublishRow({
  name,
  icon,
  connected,
  record: initialRecord,
  packId,
  platform,
}: {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  record: PlatformPublishRecord | null;
  packId: string;
  platform: "linkedin" | "x";
}) {
  const [record, setRecord] = useState(initialRecord);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const [showScheduler, setShowScheduler] = useState(false);

  const publish = async (scheduled?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          platform,
          scheduledFor: scheduled || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        record?: PlatformPublishRecord;
      };
      if (!res.ok) {
        setError(data.error ?? "Publish failed. Try again.");
        return;
      }
      if (data.record) setRecord(data.record);
      setShowScheduler(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const cancelScheduled = async () => {
    if (!record) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/publish/${record.id}/cancel`, {
        method: "POST",
      });
      if (res.ok) setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Already published
  if (record?.status === "published") {
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">{name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span className="text-xs text-green-600">
                Published {record.publishedAt ? formatDate(record.publishedAt) : ""}
              </span>
            </div>
          </div>
        </div>
        {record.postUrl && (
          <a
            href={record.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 text-xs text-[#4F46E5] hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  // Scheduled
  if (record?.status === "scheduled") {
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">{name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-600">
                Scheduled for {record.scheduledFor ? formatDate(record.scheduledFor) : ""}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={cancelScheduled}
          className="shrink-0 text-xs text-neutral-500 hover:text-red-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Not connected
  if (!connected) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 opacity-40">{icon}</span>
          <p className="text-sm text-neutral-500">{name}</p>
        </div>
        <a
          href="/settings/connections"
          className="shrink-0 text-xs text-[#4F46E5] hover:underline"
        >
          Connect first
        </a>
      </div>
    );
  }

  // Ready to publish
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0">{icon}</span>
          <p className="text-sm font-medium text-neutral-900">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowScheduler((s) => !s)}
            className="shrink-0 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Schedule
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => publish()}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Publish now
          </button>
        </div>
      </div>

      {showScheduler && (
        <div className="flex items-center gap-2 pl-7">
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
          <button
            type="button"
            disabled={!scheduledFor || loading}
            onClick={() => publish(new Date(scheduledFor).toISOString())}
            className="shrink-0 rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
          >
            Schedule
          </button>
        </div>
      )}

      {error && (
        <p className="pl-7 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

const LinkedInIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#0A66C2]">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-neutral-900">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function SocialPublishPanel({
  packId,
  linkedInConnected,
  xConnected,
  linkedinRecord,
  xRecord,
}: Props) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-semibold text-neutral-900">Publish to Social</h2>
      <div className="space-y-4">
        <PlatformPublishRow
          name="LinkedIn"
          icon={LinkedInIcon}
          connected={linkedInConnected}
          record={linkedinRecord}
          packId={packId}
          platform="linkedin"
        />
        <div className="border-t border-neutral-100" />
        <PlatformPublishRow
          name="X (Twitter)"
          icon={XIcon}
          connected={xConnected}
          record={xRecord}
          packId={packId}
          platform="x"
        />
      </div>
    </section>
  );
}
