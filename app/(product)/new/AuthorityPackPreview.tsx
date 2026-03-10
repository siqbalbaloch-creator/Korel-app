"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, ClipboardCopy, Loader2, Linkedin, Mail, Sparkles, Twitter, X, Zap } from "lucide-react";
import PostPlatformSection from "../history/[id]/PostPlatformSection";
import HooksSectionClient from "../history/[id]/HooksSectionClient";
import SourcePanel from "../history/[id]/SourcePanel";
import NewsletterSection from "../history/[id]/NewsletterSection";

const GENERATION_STEPS = [
  "Analyzing transcript",
  "Extracting core thesis",
  "Generating hooks",
  "Creating LinkedIn post",
  "Building newsletter outline",
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
  onCancel?: () => void;
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
  const strategicHooksRecord = isRecord(raw.strategicHooks) ? raw.strategicHooks : {};
  const highLeveragePostsRecord = isRecord(raw.highLeveragePosts) ? raw.highLeveragePosts : {};
  const insightBreakdownRecord = isRecord(raw.insightBreakdown) ? raw.insightBreakdown : {};
  const executiveSummaryRecord = isRecord(raw.executiveSummary) ? raw.executiveSummary : {};

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
      dataBackedAngles: toStringArray(insightBreakdownRecord.dataBackedAngles),
      frameworks: toStringArray(insightBreakdownRecord.frameworks),
    },
    executiveSummary: {
      headline: toString(executiveSummaryRecord.headline),
      positioningSentence: toString(executiveSummaryRecord.positioningSentence),
      keyInsights: toStringArray(executiveSummaryRecord.keyInsights),
    },
  };
};

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const getSourceType = (value: string): "youtube" | "transcript" => {
  const lower = value.toLowerCase();
  return lower.includes("youtube.com") || lower.includes("youtu.be") ? "youtube" : "transcript";
};

const extractUrl = (value: string) => {
  const match = value.match(/https?:\/\/\S+/i);
  return match ? match[0].replace(/[),.]+$/, "") : "";
};

const truncateText = (value: string, maxLength = 96) => {
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength)}...`;
};

// ── Small inline CopyButton ──────────────────────────────────────────────────
function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-500 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
    >
      {copied ? <Check size={11} strokeWidth={2.5} /> : <ClipboardCopy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-white px-4 py-2 text-sm font-medium text-[#3730A3] shadow-lg"
      style={{ animation: "fadeInUp 0.2s ease" }}
    >
      <Check size={14} strokeWidth={2.5} className="text-[#4F46E5]" />
      {message}
    </div>
  );
}

export function AuthorityPackPreview({
  packId,
  isGenerating,
  limitReached = false,
  regenLimit = null,
  onCancel,
}: AuthorityPackPreviewProps) {
  const [state, setState] = useState<{
    status: "idle" | "loading" | "loaded" | "error";
    pack: ParsedPack | null;
  }>({ status: "idle", pack: null });

  const [stepIndex, setStepIndex] = useState(0);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Step ticker ─────────────────────────────────────────────────────────────
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

  // ── Load pack data ───────────────────────────────────────────────────────────
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
        if (!response.ok) throw new Error(`Failed to load pack: ${response.status}`);
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
    return () => { isMounted = false; };
  }, [packId]);

  // ── Auto-scroll to results when loaded ──────────────────────────────────────
  useEffect(() => {
    if (state.status === "loaded" && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [state.status]);

  // ── Loading / generating state ───────────────────────────────────────────────
  if ((!packId && isGenerating) || (packId && state.status === "loading")) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900">Authority Pack Preview</h2>
          <p className="text-xs text-neutral-500">Generating your content assets...</p>
        </div>

        {/* Progress steps */}
        <div className="rounded-xl border border-[#E0E7FF] bg-[#F5F3FF] p-4 space-y-0">
          {GENERATION_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3 py-2">
              <div
                className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center"
                style={{
                  background: i <= stepIndex ? "#4F46E5" : "#E2E8F0",
                  transition: "background 0.3s ease",
                }}
              >
                {i < stepIndex ? (
                  <Check size={10} color="white" strokeWidth={2.5} />
                ) : i === stepIndex ? (
                  <Loader2 size={10} className="animate-spin text-white" />
                ) : null}
              </div>
              <span
                className="text-sm"
                style={{
                  color: i < stepIndex ? "#6D7A8D" : i === stepIndex ? "#3730A3" : "#94A3B8",
                  fontWeight: i === stepIndex ? 500 : 400,
                  transition: "color 0.3s ease",
                  textDecoration: i < stepIndex ? "line-through" : "none",
                }}
              >
                {step}
              </span>
              {i < stepIndex && (
                <Check size={12} className="ml-auto text-[#4F46E5] flex-shrink-0" strokeWidth={2.5} />
              )}
            </div>
          ))}

          {/* Cancel button */}
          {onCancel && (
            <div className="pt-3 mt-2 border-t border-[#E0E7FF]">
              <button
                type="button"
                onClick={onCancel}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-medium text-[#64748B] hover:border-[#94A3B8] hover:text-[#334155] transition-colors"
              >
                <X size={13} />
                Cancel Generation
              </button>
            </div>
          )}
        </div>

        {/* Dimmed placeholder cards */}
        <div className="space-y-3 opacity-35 pointer-events-none">
          {[
            { icon: Linkedin, label: "LinkedIn Post", lines: [70, 55, 40] },
            { icon: Twitter, label: "X Thread", lines: [65, 50] },
            { icon: Mail, label: "Newsletter Outline", lines: [75, 60, 45] },
            { icon: Zap, label: "Strategic Hooks", lines: [60, 50, 55] },
          ].map(({ icon: Icon, label, lines }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF]">
                  <Icon size={13} className="text-[#4F46E5]" />
                </div>
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

  // ── Limit reached ────────────────────────────────────────────────────────────
  if (limitReached && (!packId || state.status === "idle")) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold text-neutral-900">Monthly limit reached.</h2>
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

  // ── Idle (placeholder) ───────────────────────────────────────────────────────
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

  // ── Error ────────────────────────────────────────────────────────────────────
  if (state.status === "error") {
    return (
      <div className="max-w-md space-y-2 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <p className="text-sm font-semibold text-red-700">We couldn&apos;t load this Authority Pack.</p>
        <p className="text-xs text-red-600">Try regenerating or refreshing the page.</p>
      </div>
    );
  }

  // ── Loaded ───────────────────────────────────────────────────────────────────
  const pack = state.pack;
  if (!pack) return null;

  const regenLimitReached = typeof regenLimit === "number" ? pack.regenerationCount >= regenLimit : false;
  const regenNotice =
    regenLimitReached && typeof regenLimit === "number"
      ? `You've reached your regeneration limit (${pack.regenerationCount}/${regenLimit}). Upgrade to increase capacity.`
      : null;
  const sourceType = getSourceType(pack.originalInput);
  const rawYoutubeUrl = extractUrl(pack.originalInput);
  const displayYoutubeUrl = truncateText(rawYoutubeUrl, 60);
  const hasNewsletter = pack.highLeveragePosts.newsletterSummary.trim().length > 0;

  const allHooks = [
    ...pack.strategicHooks.linkedin,
    ...pack.strategicHooks.twitter,
    ...pack.strategicHooks.contrarian,
  ];

  const handleCopyAll = () => {
    const sections: string[] = [
      "---------------------",
      "LINKEDIN POST",
      pack.highLeveragePosts.linkedinPosts.join("\n\n"),
      "",
      "---------------------",
      "X THREAD",
      pack.highLeveragePosts.twitterThread.join("\n\n"),
    ];
    if (hasNewsletter) {
      sections.push("", "---------------------", "NEWSLETTER OUTLINE", pack.highLeveragePosts.newsletterSummary);
    }
    if (allHooks.length) {
      sections.push("", "---------------------", "STRATEGIC HOOKS", allHooks.join("\n"));
    }
    sections.push("---------------------");

    void navigator.clipboard.writeText(sections.join("\n")).then(() => {
      setToast("Full authority pack copied");
    });
  };

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div ref={resultsRef} className="max-w-[1100px] w-full mx-auto space-y-6">
        {/* ── Success banner ── */}
        <div className="flex items-center gap-2 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
          <CheckCircle2 size={16} className="text-[#16A34A] flex-shrink-0" />
          <span className="text-sm font-medium text-[#15803D]">Authority Pack Ready</span>
          <span className="text-xs text-[#4ADE80] ml-auto">{formatDate(pack.createdAt)}</span>
        </div>

        {/* ── Header ── */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-semibold text-neutral-900">{pack.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy All */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-1.5 text-xs font-semibold text-[#4F46E5] hover:bg-[#E0E7FF] transition-colors"
            >
              <ClipboardCopy size={12} />
              Copy Full Authority Pack
            </button>
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
            {/* Strategic Hooks */}
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF]">
                    <Zap size={13} className="text-[#4F46E5]" />
                  </div>
                  <h2 className="text-sm font-semibold text-neutral-900">Strategic Hooks</h2>
                </div>
                <CopyButton
                  label="Strategic Hooks"
                  getText={() => allHooks.join("\n")}
                />
              </div>
              <div className="px-5 pb-5">
                <HooksSectionClient
                  packId={pack.id}
                  initialHooks={pack.strategicHooks}
                  defaultOpen
                  regenLimitReached={regenLimitReached}
                  regenNotice={regenNotice ?? undefined}
                />
              </div>
            </section>

            {/* Core Thesis */}
            <section className="border-t border-neutral-200 pt-8">
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-5 pt-4">
                  <h2 className="text-sm font-semibold text-neutral-900">Core Thesis</h2>
                  <CopyButton
                    label="Core Thesis"
                    getText={() =>
                      [
                        pack.coreThesis.primaryThesis,
                        "",
                        pack.coreThesis.supportingThemes.join("\n"),
                        "",
                        `Target Persona: ${pack.coreThesis.targetPersona}`,
                      ].join("\n")
                    }
                  />
                </div>
                <div className="px-5 pb-5 pt-3 space-y-4">
                  <p className="text-base text-neutral-800">{pack.coreThesis.primaryThesis}</p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                    {pack.coreThesis.supportingThemes.map((theme, index) => (
                      <li key={`theme-${index}`}>{theme}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-neutral-500">
                    Target Persona{" "}
                    <span className="text-neutral-800">{pack.coreThesis.targetPersona}</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Insight Breakdown */}
            <section className="border-t border-neutral-200 pt-8">
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-5 pt-4">
                  <h2 className="text-sm font-semibold text-neutral-900">Insight Breakdown</h2>
                  <CopyButton
                    label="Insight Breakdown"
                    getText={() =>
                      [
                        "STRONG CLAIMS",
                        pack.insightBreakdown.strongClaims.join("\n"),
                        "",
                        "DATA-BACKED ANGLES",
                        pack.insightBreakdown.dataBackedAngles.join("\n"),
                        "",
                        "FRAMEWORKS",
                        pack.insightBreakdown.frameworks.join("\n"),
                      ].join("\n")
                    }
                  />
                </div>
                <div className="px-5 pb-5 pt-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-neutral-400">Strong Claims</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                      {pack.insightBreakdown.strongClaims.map((claim, index) => (
                        <li key={`claim-${index}`}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-neutral-400">Data-Backed Angles</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                      {pack.insightBreakdown.dataBackedAngles.map((angle, index) => (
                        <li key={`angle-${index}`}>{angle}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-neutral-400">Frameworks</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-neutral-600">
                      {pack.insightBreakdown.frameworks.map((framework, index) => (
                        <li key={`framework-${index}`}>{framework}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* LinkedIn + X posts */}
            <section className="border-t border-neutral-200 pt-8">
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF]">
                      <Linkedin size={13} className="text-[#4F46E5]" />
                    </div>
                    <h2 className="text-sm font-semibold text-neutral-900">LinkedIn &amp; X Posts</h2>
                  </div>
                  <CopyButton
                    label="LinkedIn & X Posts"
                    getText={() =>
                      [
                        "LINKEDIN POST",
                        pack.highLeveragePosts.linkedinPosts.join("\n\n"),
                        "",
                        "X THREAD",
                        pack.highLeveragePosts.twitterThread.join("\n\n"),
                      ].join("\n")
                    }
                  />
                </div>
                <div className="px-5 pb-5">
                  <PostPlatformSection
                    packId={pack.id}
                    linkedinPosts={pack.highLeveragePosts.linkedinPosts}
                    twitterThread={pack.highLeveragePosts.twitterThread}
                    showInsightGuardLink={false}
                    regenLimitReached={regenLimitReached}
                    regenNotice={regenNotice ?? undefined}
                  />
                </div>
              </div>
            </section>

            {/* Newsletter */}
            {hasNewsletter && (
              <section className="border-t border-neutral-200 pt-8">
                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-4 pb-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF]">
                        <Mail size={13} className="text-[#4F46E5]" />
                      </div>
                      <h2 className="text-sm font-semibold text-neutral-900">Newsletter Outline</h2>
                    </div>
                    <CopyButton
                      label="Newsletter Outline"
                      getText={() => pack.highLeveragePosts.newsletterSummary}
                    />
                  </div>
                  <div className="px-5 pb-5">
                    <NewsletterSection content={pack.highLeveragePosts.newsletterSummary} packId="" packTitle="" beehiivConnected={false} />
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 lg:sticky lg:top-8">
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-neutral-900">Summary</h2>
              <div className="space-y-2 text-sm text-neutral-700">
                {pack.executiveSummary.headline ? (
                  <p className="font-medium">{pack.executiveSummary.headline}</p>
                ) : null}
                {pack.executiveSummary.positioningSentence ? (
                  <p className="text-neutral-600">{pack.executiveSummary.positioningSentence}</p>
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
              <h2 className="text-sm font-semibold text-neutral-900">Source</h2>
              <SourcePanel
                sourceType={sourceType}
                youtubeHref={rawYoutubeUrl}
                displayYoutubeUrl={displayYoutubeUrl}
                originalInput={pack.originalInput}
              />
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
