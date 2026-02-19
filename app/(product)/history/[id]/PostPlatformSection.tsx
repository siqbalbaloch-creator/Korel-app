"use client";

import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import PostCard from "./PostCard";
import { LinkedInIcon, XIcon } from "./platform-icons";

const VARIANT_LABELS = ["Analytical", "Contrarian", "Tactical"] as const;

// Strip the embedded "LinkedIn — Variant\n\n" prefix the service inserts
const stripVariantPrefix = (content: string): string => {
  const normalized = content.replace(/\\n/g, "\n");
  const match = normalized.match(/^LinkedIn\s*[—–-][^\n]+\n\n([\s\S]*)$/);
  return match ? match[1].trimStart() : normalized;
};

type PostPlatformSectionProps = {
  packId: string;
  linkedinPosts: string[];
  twitterThread: string[];
};

type RegenerateState = "linkedin_0" | "linkedin_1" | "linkedin_2" | "xthread" | null;

export default function PostPlatformSection({
  packId,
  linkedinPosts: initialLinkedinPosts,
  twitterThread: initialTwitterThread,
}: PostPlatformSectionProps) {
  const [linkedinPosts, setLinkedinPosts] = useState(initialLinkedinPosts);
  const [twitterThread, setTwitterThread] = useState(initialTwitterThread);
  const [activeVariant, setActiveVariant] = useState(0);
  const [regenerating, setRegenerating] = useState<RegenerateState>(null);
  const [error, setError] = useState<string | null>(null);

  const regenerateLinkedIn = async (variantIndex: number) => {
    const key = `linkedin_${variantIndex}` as RegenerateState;
    setRegenerating(key);
    setError(null);
    try {
      const res = await fetch(`/api/packs/${packId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "linkedin_variant", variantIndex }),
      });
      const data = (await res.json()) as { post?: string; error?: string };
      if (data.post) {
        setLinkedinPosts((prev) => {
          const next = [...prev];
          next[variantIndex] = data.post!;
          return next;
        });
      } else {
        setError("Regeneration failed. Please try again.");
      }
    } catch {
      setError("Regeneration failed. Please try again.");
    } finally {
      setRegenerating(null);
    }
  };

  const regenerateXThread = async () => {
    setRegenerating("xthread");
    setError(null);
    try {
      const res = await fetch(`/api/packs/${packId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "xthread" }),
      });
      const data = (await res.json()) as { thread?: string[]; error?: string };
      if (data.thread) {
        setTwitterThread(data.thread);
      } else {
        setError("Regeneration failed. Please try again.");
      }
    } catch {
      setError("Regeneration failed. Please try again.");
    } finally {
      setRegenerating(null);
    }
  };

  const activePost = stripVariantPrefix(linkedinPosts[activeVariant] ?? "");
  const isRegenerating = regenerating !== null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Posts</h2>
        <p className="text-sm text-neutral-500">
          Platform-specific execution variants generated from this authority pack.
        </p>
      </div>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}

      <div className="space-y-4">
        {/* LinkedIn with variant tabs */}
        <details
          open
          className="group rounded-2xl border border-neutral-200 bg-white shadow-sm"
        >
          <summary className="flex h-12 items-center justify-between px-5 text-sm font-semibold text-neutral-900 cursor-pointer list-none">
            <span className="flex items-center gap-2">
              <LinkedInIcon className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn
            </span>
            <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="px-5 pb-5 pt-4 space-y-3">
            {/* Variant tab switcher */}
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 w-fit">
              {VARIANT_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveVariant(index)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    activeVariant === index
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Active variant post + regenerate */}
            <div className="relative">
              <PostCard
                platform="linkedin"
                versionLabel={VARIANT_LABELS[activeVariant]}
                content={activePost}
              />
              <button
                type="button"
                disabled={isRegenerating}
                onClick={() => void regenerateLinkedIn(activeVariant)}
                className="absolute right-11 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
                title={`Regenerate ${VARIANT_LABELS[activeVariant]}`}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    regenerating === `linkedin_${activeVariant}` ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </details>

        {/* X Threads */}
        <details className="group rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <summary className="flex h-12 items-center justify-between px-5 text-sm font-semibold text-neutral-900 cursor-pointer list-none">
            <span className="flex items-center gap-2">
              <XIcon className="h-4 w-4 text-black" />
              X Threads
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isRegenerating}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void regenerateXThread();
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
                title="Regenerate X Thread"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${regenerating === "xthread" ? "animate-spin" : ""}`}
                />
              </button>
              <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
            </div>
          </summary>

          <div className="px-5 pb-5 pt-5 space-y-4">
            {twitterThread.length === 0 ? (
              <p className="text-sm text-neutral-500">No X threads available yet.</p>
            ) : (
              <PostCard
                platform="x"
                content={twitterThread.join("\n")}
                lines={twitterThread}
              />
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
