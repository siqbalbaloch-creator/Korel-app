"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import PostCard from "./PostCard";
import { LinkedInIcon, XIcon } from "./platform-icons";
import PostCopyButton from "./post-copy-button";
import InsightGuardWarning from "@/components/InsightGuardWarning";
import PlanLimitNotice from "@/components/PlanLimitNotice";

const VARIANT_LABELS = ["Analytical", "Contrarian", "Tactical"] as const;

// Strip the embedded "LinkedIn - Variant\n\n" prefix the service inserts
const stripVariantPrefix = (content: string): string => {
  const normalized = content.replace(/\\n/g, "\n");
  const match = normalized.match(
    /^LinkedIn\s*[-\u2014\u2013][^\n]+\n\n([\s\S]*)$/,
  );
  return match ? match[1].trimStart() : normalized;
};

type PostPlatformSectionProps = {
  packId: string;
  linkedinPosts: string[];
  twitterThread: string[];
  showInsightGuardLink?: boolean;
  regenLimitReached?: boolean;
  regenNotice?: string;
  upgradeHref?: string;
};

type RegenerateState = "linkedin_0" | "linkedin_1" | "linkedin_2" | "xthread" | null;

export default function PostPlatformSection({
  packId,
  linkedinPosts: initialLinkedinPosts,
  twitterThread: initialTwitterThread,
  showInsightGuardLink = true,
  regenLimitReached = false,
  regenNotice,
  upgradeHref,
}: PostPlatformSectionProps) {
  const cappedLinkedinPosts = initialLinkedinPosts.slice(0, 3);
  const variantCount = Math.min(3, Math.max(2, cappedLinkedinPosts.length || 0));
  while (cappedLinkedinPosts.length < variantCount) {
    cappedLinkedinPosts.push("");
  }
  const variantLabels = VARIANT_LABELS.slice(0, variantCount);
  const [linkedinPosts, setLinkedinPosts] = useState(cappedLinkedinPosts);
  const [twitterThread, setTwitterThread] = useState(initialTwitterThread);
  const [activeVariant, setActiveVariant] = useState(0);
  const [regenerating, setRegenerating] = useState<RegenerateState>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(regenLimitReached);
  const [insightGuardBlocked, setInsightGuardBlocked] = useState({
    linkedin: false,
    xthread: false,
  });
  const threadText = twitterThread
    .map((line, i) => `${i + 1}/ ${line.trim()}`)
    .join("\n");

  useEffect(() => {
    setLimitReached(regenLimitReached);
  }, [regenLimitReached]);

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
      const data = (await res.json()) as {
        post?: string;
        error?: string;
        code?: string;
        message?: string;
      };
      if (data.code === "PLAN_LIMIT_REGEN_EXCEEDED") {
        setLimitReached(true);
        setError(data.message ?? "Regeneration limit reached.");
        return;
      }
      if (data.code === "INSIGHT_GUARD_BLOCKED") {
        setInsightGuardBlocked((prev) => ({ ...prev, linkedin: true }));
        return;
      }
      if (data.post) {
        setLinkedinPosts((prev) => {
          const next = [...prev];
          next[variantIndex] = data.post!;
          return next;
        });
        setInsightGuardBlocked((prev) => ({ ...prev, linkedin: false }));
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
      const data = (await res.json()) as {
        thread?: string[];
        error?: string;
        code?: string;
        message?: string;
      };
      if (data.code === "PLAN_LIMIT_REGEN_EXCEEDED") {
        setLimitReached(true);
        setError(data.message ?? "Regeneration limit reached.");
        return;
      }
      if (data.code === "INSIGHT_GUARD_BLOCKED") {
        setInsightGuardBlocked((prev) => ({ ...prev, xthread: true }));
        return;
      }
      if (data.thread) {
        setTwitterThread(data.thread);
        setInsightGuardBlocked((prev) => ({ ...prev, xthread: false }));
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
  const regenDisabled = isRegenerating || limitReached;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Platform Assets</h2>
        <p className="text-xs text-neutral-500">
          Platform-specific execution variants generated from this authority pack.
        </p>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {limitReached && (
        <PlanLimitNotice
          message={
            regenNotice ??
            "Regeneration limit reached. Upgrade to increase capacity."
          }
          upgradeHref={upgradeHref}
        />
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <LinkedInIcon className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn
            </span>
          </div>
          <div className="px-5 pb-5 pt-4 space-y-3">
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 w-fit">
              {variantLabels.map((label, index) => (
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

            <div className="relative">
              {insightGuardBlocked.linkedin && (
                <div className="mb-3">
                  <InsightGuardWarning showLink={showInsightGuardLink} />
                </div>
              )}
              <PostCard
                platform="linkedin"
                versionLabel={variantLabels[activeVariant]}
                content={activePost}
              />
              <button
                type="button"
                disabled={regenDisabled}
                onClick={() => void regenerateLinkedIn(activeVariant)}
                className="absolute right-11 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
                title={
                  regenerating === `linkedin_${activeVariant}`
                    ? "Refining post..."
                    : `Regenerate ${variantLabels[activeVariant]}`
                }
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    regenerating === `linkedin_${activeVariant}` ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
            {regenerating === `linkedin_${activeVariant}` && (
              <p className="text-xs text-indigo-600 font-medium mt-1">Refining post...</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <XIcon className="h-4 w-4 text-black" />
              X Thread
            </span>
            <div className="flex items-center gap-1">
              {twitterThread.length > 0 && (
                <PostCopyButton
                  value={threadText}
                  className="h-7 w-7"
                />
              )}
              <button
                type="button"
                disabled={regenDisabled}
                onClick={() => {
                  void regenerateXThread();
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
                title={regenerating === "xthread" ? "Sharpening thread..." : "Regenerate X Thread"}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${regenerating === "xthread" ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4 space-y-4">
            {insightGuardBlocked.xthread && (
              <InsightGuardWarning showLink={showInsightGuardLink} />
            )}
            {regenerating === "xthread" && (
              <p className="text-xs text-indigo-600 font-medium">Sharpening thread...</p>
            )}
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
        </div>
      </div>
    </div>
  );
}
