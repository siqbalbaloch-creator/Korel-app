"use client";

import { useState } from "react";
import { Globe, EyeOff } from "lucide-react";

type PublishStatus = "draft" | "published";

type PublishButtonProps = {
  packId: string;
  initialStatus: PublishStatus;
  initialPublishedAt: string | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function PublishButton({
  packId,
  initialStatus,
  initialPublishedAt,
}: PublishButtonProps) {
  const [status, setStatus] = useState<PublishStatus>(initialStatus);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsLoading(true);
    setConfirmation(null);

    const endpoint =
      status === "draft"
        ? `/api/packs/${packId}/publish`
        : `/api/packs/${packId}/unpublish`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        status: string;
        publishedAt: string | null;
      };
      const newStatus = data.status === "published" ? "published" : "draft";
      setStatus(newStatus);
      setPublishedAt(data.publishedAt ?? null);
      setConfirmation(newStatus === "published" ? "Published!" : "Unpublished");
      setTimeout(() => setConfirmation(null), 2500);
    } catch {
      setConfirmation("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isPublished = status === "published";

  return (
    <div className="space-y-2">
      {/* Quick Action button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={handleToggle}
        className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-neutral-900 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPublished ? (
          <EyeOff className="h-4 w-4 text-neutral-400" />
        ) : (
          <Globe className="h-4 w-4 text-neutral-400" />
        )}
        {isLoading
          ? isPublished
            ? "Unpublishing…"
            : "Publishing…"
          : isPublished
          ? "Unpublish Pack"
          : "Publish Pack"}
      </button>

      {/* Inline status & confirmation */}
      <div className="ml-7 space-y-1">
        {/* Live status badge */}
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isPublished
              ? "bg-green-100 text-green-700"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {isPublished ? "Published" : "Draft"}
        </span>

        {/* Published date */}
        {isPublished && publishedAt && (
          <p className="text-xs text-neutral-400">
            Published on {formatDate(publishedAt)}
          </p>
        )}

        {/* Confirmation message */}
        {confirmation && (
          <p
            className={`text-xs ${
              confirmation.startsWith("Something")
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {confirmation}
          </p>
        )}
      </div>
    </div>
  );
}
