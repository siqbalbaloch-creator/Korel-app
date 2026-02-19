"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

type PacksResponse = {
  generated?: number;
  remaining?: number;
  error?: "quota" | "invalid" | "generation_failed";
  detail?: string;
};

const MAX_FREE_PACKS = 3;

type DashboardClientProps = {
  initialRemainingFreePacks: number;
};

export default function DashboardClient({
  initialRemainingFreePacks,
}: DashboardClientProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [remainingFreePacks, setRemainingFreePacks] = useState(
    initialRemainingFreePacks,
  );

  const applyResponse = useCallback((data: PacksResponse) => {
    const nextGenerated = typeof data.generated === "number" ? data.generated : 0;
    const nextRemaining =
      typeof data.remaining === "number"
        ? data.remaining
        : Math.max(0, MAX_FREE_PACKS - nextGenerated);
    setRemainingFreePacks(nextRemaining);
  }, []);

  useEffect(() => {
    setRemainingFreePacks(initialRemainingFreePacks);
  }, [initialRemainingFreePacks]);

  const handleGenerate = async () => {
    const inputValue = input.trim();
    if (isGenerating || !inputValue) {
      return;
    }

    if (remainingFreePacks === 0) {
      return;
    }

    setIsGenerating(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputValue }),
      });
      const data = (await response.json()) as PacksResponse;

      if (data.error === "quota") {
        setErrorMessage("Free plan limit reached.");
      } else if (data.error === "invalid") {
        setErrorMessage("Please add a valid link or transcript.");
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

  const isGenerateDisabled =
    isGenerating || !input.trim() || remainingFreePacks === 0;

  const resizeTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) {
      return;
    }
    const minHeight = 80;
    const maxHeight = 240;

    element.style.height = "auto";
    const nextHeight = Math.min(
      Math.max(element.scrollHeight, minHeight),
      maxHeight,
    );
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
        <h2 className="text-lg font-medium text-[#111]">
          Generate Authority Pack
        </h2>
      </div>
      <p className="text-sm text-[rgba(0,0,0,0.6)]">
        Paste a YouTube link or transcript to extract high-leverage authority
        content.
      </p>
      {remainingFreePacks === 0 && (
        <div className="rounded-[10px] border border-[#F6DADA] bg-[#FDF3F3] text-[#B24A4A] px-3 py-1.5 text-sm space-y-1">
          <h3 className="text-sm font-semibold text-[#A84545]">
            Free Plan Limit Reached
          </h3>
          <p>
            You've used all 3 free Authority Packs. Upgrade to continue
            generating unlimited packs.
          </p>
          <button className="px-4 py-1.5 rounded-[10px] border border-[#E6B3B3] text-sm font-medium text-[#A84545] hover:bg-[#F7E3E3] transition">
            View Plans
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (errorMessage) {
            setErrorMessage("");
          }
          if (successMessage) {
            setSuccessMessage("");
          }
          resizeTextarea(e.currentTarget);
        }}
        placeholder="Paste YouTube link or transcript..."
        disabled={remainingFreePacks === 0 || isGenerating}
        className="w-full rounded-[10px] border border-black/5 p-4 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition disabled:opacity-70 disabled:cursor-not-allowed resize-none -mt-0.5"
        style={{ minHeight: 80, maxHeight: 240 }}
      />

      <div className="flex flex-col gap-1 -mt-0.5">
        <button
          type="button"
          disabled={isGenerateDisabled}
          onClick={handleGenerate}
          aria-disabled={remainingFreePacks === 0}
          className="w-full h-12 rounded-[10px] font-semibold bg-[#3D44C9] text-white shadow-sm transition-all duration-[150ms] ease hover:bg-[#343BB6] hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(0,0,0,0.12)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {isGenerating && remainingFreePacks > 0 && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
          )}
          {remainingFreePacks === 0
            ? "Upgrade to Continue"
            : isGenerating
            ? "Generating Authority Pack…"
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
