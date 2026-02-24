"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import PlanLimitNotice from "@/components/PlanLimitNotice";

type RepurposeType = "linkedin_short" | "twitter_hooks" | "blog" | "newsletter";

const FORMAT_OPTIONS: { type: RepurposeType; label: string; description: string }[] = [
  { type: "linkedin_short", label: "LinkedIn Post", description: "Single polished LinkedIn post" },
  { type: "twitter_hooks", label: "Twitter / X Hooks", description: "Hook list for X threads" },
  { type: "blog", label: "Blog Draft", description: "Long-form blog post in Markdown" },
  { type: "newsletter", label: "Newsletter Blurb", description: "Ready-to-send newsletter section" },
];

type RepurposeButtonProps = {
  packId: string;
  canRepurpose?: boolean;
  upgradeHref?: string;
};

type RepurposeResult = {
  id: string;
  type: string;
  content: unknown;
};

export default function RepurposeButton({
  packId,
  canRepurpose = true,
  upgradeHref,
}: RepurposeButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<RepurposeType | null>(null);
  const [result, setResult] = useState<RepurposeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRepurpose = async (type: RepurposeType) => {
    setLoading(type);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/packs/${packId}/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = (await res.json()) as RepurposeResult & {
        code?: string;
        message?: string;
      };
      if (data.code === "PLAN_LIMIT_NOT_ALLOWED") {
        setError(data.message ?? "Repurposing is not available on your plan.");
        return;
      }
      if (!res.ok) throw new Error("Failed to repurpose");
      setResult(data);
    } catch {
      setError("Failed to generate a repurposed asset. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const getResultText = (): string => {
    if (!result) return "";
    const c = result.content;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return (c as string[]).join("\n\n");
    return JSON.stringify(c, null, 2);
  };

  const handleCopy = async () => {
    const text = getResultText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // silently fail
    }
  };

  if (!canRepurpose) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 cursor-not-allowed"
        >
          <Layers className="h-4 w-4 text-neutral-300" />
          Repurpose
        </button>
        <PlanLimitNotice
          message="Repurposing is available on Pro plans. Upgrade to unlock."
          upgradeHref={upgradeHref}
        />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setResult(null);
          setError(null);
        }}
        className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-neutral-900 hover:bg-neutral-50"
      >
        <Layers className="h-4 w-4 text-neutral-400" />
        Repurpose
      </button>

      {open && (
        <div className="mt-2 ml-7 space-y-2">
          {!result && (
            <div className="space-y-1">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  disabled={loading !== null}
                  onClick={() => handleRepurpose(opt.type)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:border-[#C7D2FE] hover:bg-[#EEF2FF] text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-neutral-900">
                    {loading === opt.type ? "Generating…" : opt.label}
                  </span>
                  <span className="ml-1.5 text-neutral-500">— {opt.description}</span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 px-1">{error}</p>
          )}

          {result && (
            <div className="space-y-2">
              <textarea
                readOnly
                value={getResultText()}
                rows={8}
                className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#0F172A] resize-none focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-1.5 text-xs font-medium text-[#4F46E5] hover:bg-[#E0E7FF] transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => { setResult(null); setError(null); }}
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
