"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type PacksResponse = {
  generated?: number;
  remaining?: number | null;
  monthlyLimit?: number | null;
  code?: string;
  error?: "plan_limit_reached" | "limit_reached" | "quota" | "INVALID_INPUT" | "invalid" | "generation_failed";
  detail?: string;
  message?: string;
};

type DashboardClientProps = {
  initialRemainingFreePacks: number;
  totalPacks?: number;
  plan?: string;
  monthlyLimit?: number | null;
  usedThisMonth?: number;
};

export default function DashboardClient({
  initialRemainingFreePacks,
  totalPacks = 0,
  plan = "FREE",
  monthlyLimit = null,
  usedThisMonth = 0,
}: DashboardClientProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [remainingFreePacks, setRemainingFreePacks] = useState(initialRemainingFreePacks);
  const [monthlyLimitState, setMonthlyLimitState] = useState<number | null>(
    typeof monthlyLimit === "number" ? monthlyLimit : null,
  );
  const [usedThisMonthState, setUsedThisMonthState] = useState<number>(usedThisMonth);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const applyResponse = useCallback((data: PacksResponse) => {
    setRemainingFreePacks((previous) => {
      if (data.remaining === null) return 999;
      if (typeof data.remaining === "number") return Math.max(0, data.remaining);
      return previous;
    });
    if (typeof data.generated === "number") {
      setUsedThisMonthState(data.generated);
    }
    if (data.monthlyLimit === null) {
      setMonthlyLimitState(null);
    } else if (typeof data.monthlyLimit === "number") {
      setMonthlyLimitState(data.monthlyLimit);
    }
  }, []);

  useEffect(() => {
    setRemainingFreePacks(initialRemainingFreePacks);
    setMonthlyLimitState(typeof monthlyLimit === "number" ? monthlyLimit : null);
    setUsedThisMonthState(usedThisMonth);
  }, [initialRemainingFreePacks, monthlyLimit, usedThisMonth]);

  const handleGenerate = async () => {
    const inputValue = input.trim();
    if (isGenerating || !inputValue || remainingFreePacks === 0) return;

    setIsGenerating(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputValue }),
      });
      let data: PacksResponse = {};
      try {
        data = (await response.json()) as PacksResponse;
      } catch {
        data = {};
      }

      const isPlanLimit =
        data.code === "PLAN_LIMIT_PACKS_EXCEEDED" ||
        data.error === "plan_limit_reached" ||
        data.error === "limit_reached" ||
        response.status === 403;
      if (isPlanLimit) {
        setRemainingFreePacks(0);
        const limitValue =
          typeof data.monthlyLimit === "number"
            ? data.monthlyLimit
            : monthlyLimitState;
        const usedValue =
          typeof data.generated === "number" ? data.generated : usedThisMonthState;
        const limitLabel =
          typeof limitValue === "number" ? ` (${usedValue}/${limitValue})` : "";
        setErrorMessage(`You&apos;ve reached your monthly Authority Pack limit${limitLabel}.`);
      } else if (data.error === "INVALID_INPUT" || data.error === "invalid") {
        setErrorMessage("Please add a valid link or transcript (min 200 characters).");
      } else if (data.error === "generation_failed") {
        setErrorMessage(`Generation failed: ${data.detail ?? "unknown error"}`);
      } else if (response.ok) {
        setInput("");
        setSuccessMessage("Pack generated.");
        router.refresh();
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }

      applyResponse(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isGenerateDisabled = isGenerating || !input.trim() || remainingFreePacks === 0;
  const showUpgradeNudge = plan === "FREE" && totalPacks >= 3 && remainingFreePacks > 0;
  const limitLabel =
    typeof monthlyLimitState === "number"
      ? ` (${usedThisMonthState}/${monthlyLimitState})`
      : "";

  const resizeTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;
    const minHeight = 80;
    const maxHeight = 240;
    element.style.height = "auto";
    const nextHeight = Math.min(Math.max(element.scrollHeight, minHeight), maxHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [input, resizeTextarea]);

  return (
    <div className="bg-white rounded-[12px] shadow-sm border border-black/5 p-6 transition-all duration-[160ms] ease hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#4F46E5]" />
        <h2 className="text-lg font-medium text-[#111]">Generate Authority Pack</h2>
      </div>
      <p className="text-sm text-[rgba(0,0,0,0.6)]">
        Paste a YouTube link or transcript to generate a structured Authority Pack.
      </p>

      {remainingFreePacks === 0 ? (
        <div className="rounded-[10px] border border-[#F6DADA] bg-[#FDF3F3] text-[#B24A4A] px-3 py-1.5 text-sm space-y-1">
          <h3 className="text-sm font-semibold text-[#A84545]">
            You&apos;ve reached your monthly Authority Pack limit{limitLabel}.
          </h3>
          <p>Upgrade to continue turning your source material into structured authority assets.</p>
          <Link
            href="/upgrade"
            className="inline-block px-4 py-1.5 rounded-[10px] border border-[#E6B3B3] text-sm font-medium text-[#A84545] hover:bg-[#F7E3E3] transition"
          >
            View Upgrade Plans
          </Link>
        </div>
      ) : showUpgradeNudge ? (
        <div className="rounded-[10px] border border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5] px-3 py-1.5 text-sm flex items-center justify-between gap-3">
          <span>
            Upgrade to continue turning your source material into structured authority assets.{" "}
            <Link href="/upgrade" className="underline font-medium">
              View Upgrade Plans
            </Link>
          </span>
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (errorMessage) setErrorMessage("");
          if (successMessage) setSuccessMessage("");
          resizeTextarea(e.currentTarget);
        }}
        placeholder="Paste a YouTube link or transcript..."
        disabled={remainingFreePacks === 0 || isGenerating}
        className="w-full rounded-[10px] border border-black/5 p-4 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition disabled:opacity-70 disabled:cursor-not-allowed resize-none -mt-0.5"
        style={{ minHeight: 80, maxHeight: 240 }}
      />

      <div className="flex flex-col gap-1 -mt-0.5">
        <button
          type="button"
          disabled={isGenerateDisabled}
          onClick={handleGenerate}
          className="w-full h-12 rounded-[10px] font-semibold bg-[#3D44C9] text-white shadow-sm transition-all duration-[150ms] ease hover:bg-[#343BB6] hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(0,0,0,0.12)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {isGenerating && remainingFreePacks > 0 && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
          )}
          {remainingFreePacks === 0
            ? "View Upgrade Plans"
            : isGenerating
            ? "Generating Authority Packâ€¦"
            : "Generate Authority Pack"}
        </button>
        {successMessage ? (
          <span className="text-xs text-[#3E7A47]">{successMessage}</span>
        ) : null}
        {errorMessage ? (
          <span className="text-xs text-[#A84545]">{errorMessage}</span>
        ) : null}
      </div>
    </div>
  );
}


