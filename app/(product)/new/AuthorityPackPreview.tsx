"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Linkedin, Twitter, Mail, Zap } from "lucide-react";
import PostPlatformSection from "../history/[id]/PostPlatformSection";
import HooksSectionClient from "../history/[id]/HooksSectionClient";
import SourcePanel from "../history/[id]/SourcePanel";
import NewsletterSection from "../history/[id]/NewsletterSection";

const GENERATION_STEPS = [
  "Analyzing transcript...",
  "Extracting thesis...",
  "Generating hooks...",
  "Creating LinkedIn post...",
  "Building newsletter outline...",
] as const;

type PackResponse = {
  id: string;
  title: string;
  originalInput: string;
  createdAt: string;
  coreThesis: unknown;
  strategicHooks: unknown;
  highLeveragePosts: unknown;
  insightBreakdown: unknown;
  executiveSummary: unknown;
  strategicMap?: unknown;
  regenerationCount?: number;
};

type AuthorityPackPreviewProps = {
  packId: string | null;
  isGenerating: boolean;
  limitReached?: boolean;
  regenLimit?: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toString = (value: unknown) => (typeof value === "string" ? value : "");

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

type ParsedPack = {
  id: string;
  title: string;
  createdAt: Date;
  originalInput: string;
  regenerationCount: number;
  coreThesis: {
    primaryThesis: string;
    supportingThemes: string[];
    targetPersona: string;
  };
  strategicHooks: {
    linkedin: string[];
    twitter: string[];
    contrarian: string[];
  };
  highLeveragePosts: {
    linkedinPosts: string[];
    twitterThread: string[];
    newsletterSummary: string;
  };
  insightBreakdown: {
    strongClaims: string[];
    dataBackedAngles: string[];
    frameworks: string[];
  };
  executiveSummary: {
    headline: string;
    positioningSentence: string;
    keyInsights: string[];
  };
};

const parsePack = (raw: PackResponse): ParsedPack => {
  const coreThesisRecord = isRecord(raw.coreThesis) ? raw.coreThesis : {};
  const strategicHooksRecord = isRecord(raw.strategicHooks)
    ? raw.strategicHooks
    : {};
  const highLeveragePostsRecord = isRecord(raw.highLeveragePosts)
    ? raw.highLeveragePosts
    : {};
  const insightBreakdownRecord = isRecord(raw.insightBreakdown)
    ? raw.insightBreakdown
    : {};
  const executiveSummaryRecord = isRecord(raw.executiveSummary)
    ? raw.executiveSummary
    : {};

  return {
    id: raw.id,
    title: raw.title,
    originalInput: raw.originalInput,
    createdAt: new Date(raw.createdAt),
    regenerationCount: typeof raw.regenerationCount === "number" ? raw.regenerationCount : 0,
    coreThesis: {
      primaryThesis: toString(coreThesisRecord.primaryThesis),
      supportingThemes: toStringArray(coreThesisRecord.supportingThemes),
      targetPersona: toString(coreThesisRecord.targetPersona),
    },
    strategicHooks: {
      linkedin: toStringArray(strategicHooksRecord.linkedin),
      twitter: toStringArray(strategicHooksRecord.twitter),
      contrarian: toStringArray(strategicHooksRecord.contrarian),
    },
    highLeveragePosts: {
      linkedinPosts: toStringArray(highLeveragePostsRecord.linkedinPosts),
      twitterThread: toStringArray(highLeveragePostsRecord.twitterThread),
      newsletterSummary: toString(highLeveragePostsRecord.newsletterSummary),
    },
    insightBreakdown: {
      strongClaims: toStringArray(insightBreakdownRecord.strongClaims),
      dataBackedAngles: toStringArray(
        insightBreakdownRecord.dataBackedAngles,
      ),
      frameworks: toStringArray(insightBreakdownRecord.frameworks),
    },
    executiveSummary: {
      headline: toString(executiveSummaryRecord.headline),
      positioningSentence: toString(
        executiveSummaryRecord.positioningSentence,
      ),
      keyInsights: toStringArray(executiveSummaryRecord.keyInsights),
    },
  };
};

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getSourceType = (value: string): "youtube" | "transcript" => {
  const lower = value.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }
  return "transcript";
};

const extractUrl = (value: string) => {
  const match = value.match(/https?:\/\/\S+/i);
  if (!match) {
    return "";
  }
  return match[0].replace(/[),.]+$/, "");
};

const truncateText = (value: string, maxLength = 96) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
};

export function AuthorityPackPreview({
  packId,
  isGenerating,
  limitReached = false,
  regenLimit = null,
}: AuthorityPackPreviewProps) {
  const [state, setState] = useState<{
    status: "idle" | "loading" | "loaded" | "error";
    pack: ParsedPack | null;
  }>({
    status: "idle",
    pack: null,
  });
  const [stepIndex, setStepIndex] = useState(0);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setStepIndex(0);
      stepIntervalRef.current = setInterval(() => {
        setStepIndex((prev) => Math.min(prev + 1, GENERATION_STEPS.length - 1));
      }, 1800);
    } else {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
    }
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [isGenerating]);

  useEffect(() => {
    if (!packId) {
      setState({ status: "idle", pack: null });
      return;
    }

    let isMounted = true;
    setState((prev) => ({ ...prev, status: "loading" }));

    const run = async () => {
      try {
        const response = await fetch(`/api/packs/${packId}`);
        if (!response.ok) {
          throw new Error(`Failed to load pack: ${response.status}`);
        }
        const data = (await response.json()) as PackResponse;
        if (!isMounted) return;
        setState({ status: "loaded", pack: parsePack(data) });
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setState({ status: "error", pack: null });
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [packId]);

  if ((!packId && isGenerating) || (packId && state.status === "loading")) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900">Authority Pack Preview</h2>
          <p className="text-xs text-neutral-500">Generating your content assets...</p>
        </div>

        {/* Progress steps */}
        <div className="rounded-xl border border-[#E0E7FF] bg-[#F5F3FF] p-4 space-y-2.5">
          {GENERATION_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center"
                style={{
                  background: i < stepIndex ? "#4F46E5" : i === stepIndex ? "#4F46E5" : "#E2E8F0",
                  transition: "background 0.3s ease",
                }}
              >
                {i < stepIndex ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i === stepIndex ? (
                  <Loader2 size={10} className="animate-spin text-white" />
                ) : null}
              </div>
              <span
                className="text-sm"
                style={{
                  color: i <= stepIndex ? "#3730A3" : "#94A3B8",
                  fontWeight: i === stepIndex ? 500 : 400,
                  transition: "color 0.3s ease",
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Placeholder cards (dimmed while loading) */}
        <div className="space-y-3 opacity-40">
          {[
            { icon: Linkedin, label: "LinkedIn Post", lines: [70, 55, 40] },
            { icon: Twitter, label: "X Thread", lines: [65, 50] },
            { icon: Mail, label: "Newsletter Outline", lines: [75, 60, 45] },
            { icon: Zap, label: "Strategic Hooks", lines: [60, 50, 55] },
          ].map(({ icon: Icon, label, lines }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-[#4F46E5]" />
                <span className="text-xs font-semibold text-neutral-700">{label}</span>
              </div>
              <div className="space-y-2">
                {lines.map((w, i) => (
                  <div key={i} className="h-2.5 rounded-full bg-neutral-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (limitReached && (!packId || state.status === "idle")) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold text-neutral-900">
            Monthly limit reached.
          </h2>
          <p className="text-sm text-neutral-500">
            You&apos;ve reached your monthly Authority Pack limit. Upgrade to continue turning
            your source material into structured authority assets.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
          >
            View Upgrade Plans
          </Link>
        </div>
      </div>
    );
  }

  if (!packId || state.status === "idle") {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900">Authority Pack Preview</h2>
          <p className="text-xs text-neutral-500">Your generated content will appear here.</p>
        </div>
        <div className="space-y-3">
          {[
            { icon: Linkedin, label: "LinkedIn Post", desc: "Long-form thought leadership post", lines: [70, 55, 40] },
            { icon: Twitter, label: "X Thread", desc: "Hook + thread optimised for X", lines: [65, 50] },
            { icon: Mail, label: "Newsletter Outline", desc: "Structured outline for your list", lines: [75, 60, 45] },
            { icon: Zap, label: "Strategic Hooks", desc: "High-leverage opening lines", lines: [60, 50, 55] },
          ].map(({ icon: Icon, label, desc, lines }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF]">
                    <Icon size={13} className="text-[#4F46E5]" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-700">{label}</span>
                </div>
                <span className="text-[10px] text-neutral-400">{desc}</span>
              </div>
              <div className="space-y-2">
                {lines.map((w, i) => (
                  <div key={i} className="h-2.5 rounded-full bg-neutral-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="max-w-md space-y-2 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <p className="text-sm font-semibold text-red-700">
          We couldn&apos;t load this Authority Pack.
        </p>
        <p className="text-xs text-red-600">
          Try regenerating or refreshing the page.
        </p>
      </div>
    );
  }

  const pack = state.pack;
  if (!pack) {
    return null;
  }
  const regenLimitReached =
    typeof regenLimit === "number" ? pack.regenerationCount >= regenLimit : false;
  const regenNotice =
    regenLimitReached && typeof regenLimit === "number"
      ? `You've reached your regeneration limit (${pack.regenerationCount}/${regenLimit}). Upgrade to increase capacity.`
      : null;
  const sourceType = getSourceType(pack.originalInput);
  const rawYoutubeUrl = extractUrl(pack.originalInput);
  const youtubeHref = rawYoutubeUrl;
  const displayYoutubeUrl = truncateText(rawYoutubeUrl, 60);
  const hasNewsletter = pack.highLeveragePosts.newsletterSummary.trim().length > 0;

  return (
    <div className="max-w-[1100px] w-full mx-auto space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {pack.title}
          </h1>
          <p className="text-xs text-neutral-500">
            Created {formatDate(pack.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/history/${pack.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#4F46E5]" />
            <span>Open full pack view</span>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        <div className="space-y-8">
          <section>
            <HooksSectionClient
              packId={pack.id}
              initialHooks={pack.strategicHooks}
              defaultOpen
              regenLimitReached={regenLimitReached}
              regenNotice={regenNotice ?? undefined}
            />
          </section>

          <section className="border-t border-neutral-200 pt-8">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="px-5 pt-4">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Core Thesis
                </h2>
              </div>
              <div className="px-5 pb-5 pt-4 space-y-4">
                <p className="text-base text-neutral-800">
                  {pack.coreThesis.primaryThesis}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                  {pack.coreThesis.supportingThemes.map((theme, index) => (
                    <li key={`theme-${index}`}>{theme}</li>
                  ))}
                </ul>
                <p className="text-sm text-neutral-500">
                  Target Persona{" "}
                  <span className="text-neutral-800">
                    {pack.coreThesis.targetPersona}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-8">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="px-5 pt-4">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Insight Breakdown
                </h2>
              </div>
              <div className="px-5 pb-5 pt-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    Strong Claims
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                    {pack.insightBreakdown.strongClaims.map((claim, index) => (
                      <li key={`claim-${index}`}>{claim}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    Data-Backed Angles
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                    {pack.insightBreakdown.dataBackedAngles.map(
                      (angle, index) => (
                        <li key={`angle-${index}`}>{angle}</li>
                      ),
                    )}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    Frameworks
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                    {pack.insightBreakdown.frameworks.map(
                      (framework, index) => (
                        <li key={`framework-${index}`}>{framework}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-8">
            <PostPlatformSection
              packId={pack.id}
              linkedinPosts={pack.highLeveragePosts.linkedinPosts}
              twitterThread={pack.highLeveragePosts.twitterThread}
              showInsightGuardLink={false}
              regenLimitReached={regenLimitReached}
              regenNotice={regenNotice ?? undefined}
            />
          </section>

          {hasNewsletter && (
            <section className="border-t border-neutral-200 pt-8">
              <NewsletterSection content={pack.highLeveragePosts.newsletterSummary} />
            </section>
          )}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-8">
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              Summary
            </h2>
            <div className="space-y-2 text-sm text-neutral-700">
              {pack.executiveSummary.headline ? (
                <p className="font-medium">{pack.executiveSummary.headline}</p>
              ) : null}
              {pack.executiveSummary.positioningSentence ? (
                <p className="text-neutral-600">
                  {pack.executiveSummary.positioningSentence}
                </p>
              ) : null}
              {pack.executiveSummary.keyInsights.length ? (
                <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-neutral-500">
                  {pack.executiveSummary.keyInsights.map((insight, index) => (
                    <li key={`insight-${index}`}>{insight}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900">
              Source
            </h2>
            <SourcePanel
              sourceType={sourceType}
              youtubeHref={youtubeHref}
              displayYoutubeUrl={displayYoutubeUrl}
              originalInput={pack.originalInput}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}






