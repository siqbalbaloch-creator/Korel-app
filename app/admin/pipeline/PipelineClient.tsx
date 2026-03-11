"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { buildEmailBody } from "@/components/admin/gmailSender";

type RevenueStage = "pre-revenue" | "early" | "growing" | "scaled";

type AttemptLogEntry = {
  source: string;
  result: "found" | "skipped" | "failed";
  detail: string;
};

type Lead = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  emailConfidence: number | null;
  emailSource: string | null;
  emailAttemptLog: AttemptLogEntry[] | null;
  linkedinUrl: string | null;
  company: string;
  interviewSource: string;
  interviewTopic: string;
  specificMoment: string;
  linkedinPost: string;
  twitterPost: string;
  newsletter: string;
  monthlyRevenue: number | null;
  revenueStage: string | null;
  llmUsed?: string | null;
  status: string;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  pipelineVideo: {
    title: string;
    youtubeUrl: string;
  };
};

type PipelineLog = {
  id: string;
  youtubeVideoId: string;
  title: string;
  status: string;
  createdAt: string;
  errorMessage: string | null;
};

type LastRun = {
  at: string;
  count: number;
} | null;

type LlmStats = {
  gpt4o: number;
  claude: number;
  total: number;
};

type Props = {
  leads: Lead[];
  pipelineLog: PipelineLog[];
  lastRun: LastRun;
  llmStats: LlmStats;
};

type ReadyFilter = "all" | "growing_plus" | "has_email";

type Tab = "READY" | "APPROVED" | "SENT" | "SKIPPED" | "FAILED";

function RevenueBadge({ stage, revenue }: { stage: string | null; revenue: number | null }) {
  if (!stage) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-400">
        Unknown revenue
      </span>
    );
  }
  if (stage === "pre-revenue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
        Pre-revenue
      </span>
    );
  }
  if (stage === "early") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
        Early stage
      </span>
    );
  }
  const label =
    revenue !== null
      ? `$${revenue >= 1000 ? `${Math.round(revenue / 1000)}k` : revenue}/mo`
      : stage === "growing"
        ? "Growing"
        : "Scaled";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      {label}
    </span>
  );
}

const STATUS_LABELS: Record<Tab, string> = {
  READY: "Ready",
  APPROVED: "Approved",
  SENT: "Sent",
  SKIPPED: "Skipped",
  FAILED: "Failed",
};

const READY_STATUSES = ["PENDING_EMAIL", "EMAIL_FOUND", "NO_EMAIL"];

function LeadCard({
  lead,
  onApproveAndSend,
  onSkip,
  onEmailEdit,
  onLeadUpdate,
  expanded,
  onToggleExpand,
  sending,
  skipping,
}: {
  lead: Lead;
  onApproveAndSend: (id: string) => void;
  onSkip: (id: string) => void;
  onEmailEdit: (id: string, email: string) => void;
  onLeadUpdate: (id: string, patch: Partial<Lead>) => void;
  expanded: string | null;
  onToggleExpand: (section: string) => void;
  sending: boolean;
  skipping: boolean;
}) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(lead.email ?? "");
  const [showFindPanel, setShowFindPanel] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Poll every 5s while PENDING_EMAIL — waterfall runs async after lead creation
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (lead.status !== "PENDING_EMAIL") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/leads/${lead.id}`);
        if (!res.ok) return;
        const data = await res.json() as {
          status: string;
          email: string | null;
          emailConfidence: number | null;
          emailSource: string | null;
          emailAttemptLog: AttemptLogEntry[] | null;
        };
        if (data.status !== "PENDING_EMAIL") {
          if (pollRef.current) clearInterval(pollRef.current);
          onLeadUpdate(lead.id, {
            status: data.status,
            email: data.email,
            emailConfidence: data.emailConfidence,
            emailSource: data.emailSource,
            emailAttemptLog: data.emailAttemptLog,
          });
        }
      } catch {
        // silent — will retry next interval
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, lead.status]);


  const confidenceColor =
    (lead.emailConfidence ?? 0) >= 70
      ? "text-green-700"
      : (lead.emailConfidence ?? 0) >= 40
        ? "text-amber-600"
        : "text-red-500";

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-all ${
        lead.status === "APPROVED"
          ? "border-green-300 bg-green-50"
          : lead.status === "SENT"
            ? "border-emerald-300 bg-emerald-50"
            : "border-neutral-200"
      }`}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">
              {lead.firstName} {lead.lastName ?? ""}{" "}
              <span className="font-normal text-neutral-500">— {lead.company}</span>
            </p>
            <a
              href={lead.pipelineVideo.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline truncate block max-w-xs"
            >
              {lead.interviewSource === "Starter Story"
                ? "📖"
                : lead.interviewSource === "Indie Hackers"
                  ? "🚀"
                  : lead.interviewSource === "Failory"
                    ? "⚡"
                    : lead.interviewSource === "Manual"
                      ? "✋"
                      : "📺"}{" "}
              {lead.pipelineVideo.title}
            </a>
            <p className="text-xs text-neutral-400 mt-0.5">
              Found{" "}
              {new Date(lead.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          {lead.status === "APPROVED" && (
            <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              ✅ Approved
            </span>
          )}
          {lead.status === "SENT" && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              📨 Sent
            </span>
          )}
          {lead.status === "SKIPPED" && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500">
              ⏭ Skipped
            </span>
          )}
        </div>

        <div className="space-y-1 text-xs text-neutral-600">
          <p>
            <span className="font-medium text-neutral-500">Topic:</span>{" "}
            {lead.interviewTopic}
          </p>
          <p>
            <span className="font-medium text-neutral-500">Hook:</span>{" "}
            {lead.specificMoment}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <RevenueBadge stage={lead.revenueStage} revenue={lead.monthlyRevenue} />
          {lead.llmUsed && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                lead.llmUsed === "anthropic-claude"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-sky-50 text-sky-600"
              }`}
            >
              {lead.llmUsed === "anthropic-claude" ? "🧠 Claude" : "🤖 GPT-4o"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {editingEmail ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  onEmailEdit(lead.id, emailInput);
                  setEditingEmail(false);
                }}
                className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingEmail(false)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          ) : lead.email ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-neutral-700">
                📧 {lead.email}
              </span>
              {lead.emailSource && (
                <span className="text-xs text-neutral-400">
                  {lead.emailSource === "starter_story_page"
                    ? "📖 On page"
                    : lead.emailSource === "indie_hackers_page"
                      ? "🚀 On page"
                      : lead.emailSource === "failory_page"
                        ? "⚡ On page"
                        : lead.emailSource === "youtube_channel"
                          ? "📺 YouTube"
                          : lead.emailSource === "website"
                            ? "🌐 Website"
                            : lead.emailSource === "prospeo"
                              ? "🔗 Prospeo"
                              : lead.emailSource === "snov"
                                ? "❄️ Snov"
                                : lead.emailSource === "apollo"
                                  ? "🔍 Apollo"
                                  : lead.emailSource === "hunter"
                                    ? "🎯 Hunter"
                                    : lead.emailSource === "manual"
                                      ? "✏️ Manual"
                                      : lead.emailSource === "twitter_bio"
                                        ? "🐦 Twitter"
                                        : lead.emailSource}
                </span>
              )}
              {lead.emailConfidence !== null && (
                <span className={`text-xs font-medium ${confidenceColor}`}>
                  {lead.emailConfidence}%
                  {lead.emailConfidence < 70 && " ⚠️"}
                </span>
              )}
              <button
                onClick={() => setEditingEmail(true)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                ✏️
              </button>
            </div>
          ) : lead.status === "PENDING_EMAIL" ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400 animate-pulse">
                🔄 Finding email…
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-neutral-400">No email found</span>
                <button
                  onClick={() => setShowFindPanel((v) => !v)}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  {showFindPanel ? "▲ Close" : "🔍 Find email"}
                </button>
                <button
                  onClick={() => setEditingEmail(true)}
                  className="text-xs text-neutral-500 hover:underline"
                >
                  + Add manually
                </button>
                {lead.emailAttemptLog && lead.emailAttemptLog.length > 0 && (
                  <button
                    onClick={() => onToggleExpand(`${lead.id}-attemptlog`)}
                    className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                  >
                    {expanded === `${lead.id}-attemptlog` ? "▲ Hide details" : "▼ Why no email?"}
                  </button>
                )}
              </div>
              {showFindPanel && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-2.5 space-y-1.5">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">Quick search — open in new tab, copy email, paste above</p>
                  {[
                    {
                      icon: "🐦",
                      label: "Twitter",
                      href: `https://twitter.com/search?q=${encodeURIComponent(`${lead.firstName} ${lead.company}`)}`,
                    },
                    {
                      icon: "🌐",
                      label: "Google",
                      href: `https://google.com/search?q=${encodeURIComponent(`${lead.firstName} ${lead.company} email contact`)}`,
                    },
                    {
                      icon: "💼",
                      label: "LinkedIn",
                      href: `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${lead.firstName} ${lead.company}`)}`,
                    },
                    {
                      icon: "📺",
                      label: "YouTube video",
                      href: lead.pipelineVideo.youtubeUrl,
                    },
                  ].map(({ icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                      <span className="ml-auto text-indigo-300">↗</span>
                    </a>
                  ))}
                </div>
              )}
              {expanded === `${lead.id}-attemptlog` && lead.emailAttemptLog && (
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-2.5 space-y-1">
                  {lead.emailAttemptLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <span className="shrink-0 w-3">
                        {entry.result === "found" ? "✅" : entry.result === "skipped" ? "⏭" : "❌"}
                      </span>
                      <span className="font-medium text-neutral-600 capitalize w-16 shrink-0">{entry.source}</span>
                      <span className="text-neutral-400">{entry.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content preview toggles */}
        <div className="flex gap-2 flex-wrap">
          {(["linkedin", "twitter", "newsletter"] as const).map((section) => {
            const key = `${lead.id}-${section}`;
            const isOpen = expanded === key;
            const content =
              section === "linkedin"
                ? lead.linkedinPost
                : section === "twitter"
                  ? lead.twitterPost
                  : lead.newsletter;
            return (
              <button
                key={section}
                onClick={() => onToggleExpand(key)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  isOpen
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                }`}
              >
                {section === "linkedin"
                  ? "💼 LinkedIn"
                  : section === "twitter"
                    ? "𝕏 Post"
                    : "📰 Newsletter"}
              </button>
            );
          })}
        </div>

        {(["linkedin", "twitter", "newsletter"] as const).map((section) => {
          const key = `${lead.id}-${section}`;
          if (expanded !== key) return null;
          const content =
            section === "linkedin"
              ? lead.linkedinPost
              : section === "twitter"
                ? lead.twitterPost
                : lead.newsletter;
          return (
            <div
              key={key}
              className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700 whitespace-pre-wrap max-h-40 overflow-y-auto"
            >
              {content || "—"}
            </div>
          );
        })}

        {READY_STATUSES.includes(lead.status) && (
          <div className="space-y-1.5 pt-1">
            {sendError && (
              <p className="text-xs font-medium text-red-500">{sendError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!lead.email) {
                    setSendError("Add an email address before sending");
                    setEditingEmail(true);
                    return;
                  }
                  setSendError(null);
                  onApproveAndSend(lead.id);
                }}
                disabled={sending || skipping}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {sending ? "📨 Sending…" : "✅ Approve & Send"}
              </button>
              <button
                onClick={() => onSkip(lead.id)}
                disabled={sending || skipping}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              >
                {skipping ? "…" : "⏭ Skip"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelineClient({ leads, pipelineLog, lastRun, llmStats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("READY");
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [actioningIds, setActioningIds] = useState<Record<string, "approving" | "skipping" | "sending">>({});
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [rssRunning, setRssRunning] = useState(false);
  const [rssResult, setRssResult] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [customMax, setCustomMax] = useState(10);
  const [customMinRevenue, setCustomMinRevenue] = useState(5000);
  const [showLog, setShowLog] = useState(false);
  const [readyFilter, setReadyFilter] = useState<ReadyFilter>("all");
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const readyLeads = localLeads.filter((l) => READY_STATUSES.includes(l.status));
  const approvedLeads = localLeads.filter((l) => l.status === "APPROVED");
  const sentLeads = localLeads.filter((l) => l.status === "SENT");
  const skippedLeads = localLeads.filter((l) => l.status === "SKIPPED");

  // Build sets of already-emailed founders to prevent re-contacting them
  const sentEmailSet = new Set(sentLeads.map((l) => l.email).filter(Boolean) as string[]);
  const sentFounderKeys = new Set(
    sentLeads.map((l) => `${l.firstName.toLowerCase()}|${l.company.toLowerCase()}`),
  );

  const filteredReadyLeads = readyLeads.filter((l) => {
    // Anti-spam: hide leads for founders we've already sent emails to
    if (l.email && sentEmailSet.has(l.email)) return false;
    if (sentFounderKeys.has(`${l.firstName.toLowerCase()}|${l.company.toLowerCase()}`)) return false;
    if (readyFilter === "growing_plus") {
      return l.revenueStage === "growing" || l.revenueStage === "scaled";
    }
    if (readyFilter === "has_email") return !!l.email;
    return true;
  });

  const tabLeads: Record<Tab, Lead[]> = {
    READY: filteredReadyLeads,
    APPROVED: approvedLeads,
    SENT: sentLeads,
    SKIPPED: skippedLeads,
    FAILED: [],
  };
  const tabCount = (tab: Tab) => tabLeads[tab].length;

  async function buildLeadEmail(lead: Lead): Promise<{ subject: string; body: string }> {
    // Call GPT-4o to generate a personalised email body and subject.
    // Falls back to a static template if the API call fails.
    try {
      const res = await fetch("/api/pipeline/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderName: lead.firstName,
          company: lead.company,
          source: lead.interviewSource,
          interviewSummary: [lead.interviewTopic, lead.specificMoment]
            .filter(Boolean)
            .join(" — "),
          generatedPost: lead.linkedinPost,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { subject: string; body: string };
        return data;
      }
    } catch {
      // fall through to static fallback
    }

    // Static fallback — used if GPT call fails
    const subject = `I ran your ${lead.company} interview through something — here's what it made`;
    const body = buildEmailBody({
      note: `Hi {{first_name}},\n\nI came across your work at {{company}} on {{interview_source}}.\n\nI'm building an AI agent called Korel that runs founder content automatically.\n\nWhen you connect an RSS feed it:\n- extracts your latest conversations or articles\n- generates LinkedIn posts, X threads, and newsletter ideas\n- repurposes them into multiple variations\n- lets you approve, schedule, or publish them directly\n\nOut of curiosity, I ran one of your recent interviews through it and it generated several posts from it.\n\nExample it produced:\n\n{{linkedin_post_preview}}\n\nIf you're curious, you can try it here (no signup needed): https://www.usekorel.com\n\nJust drop an RSS feed and it will generate content automatically.\n\nWould love to know if something like this would actually be useful for founders like you.\n\n— Saqib`,
      linkedinPost: lead.linkedinPost,
      twitterPost: lead.twitterPost,
      newsletter: lead.newsletter,
      firstName: lead.firstName,
      company: lead.company,
      interviewSource: lead.interviewSource,
      interviewTopic: lead.interviewTopic,
      specificMoment: lead.specificMoment,
      demoLink: "https://usekorel.com",
      yourName: "Saqib",
      include: { linkedin: false, twitter: false, newsletter: false },
    });
    return { subject, body };
  }

  async function approveAndSendLead(id: string) {
    const lead = localLeads.find((l) => l.id === id);
    if (!lead?.email) return;
    setActioningIds((prev) => ({ ...prev, [id]: "sending" }));

    // Step 1: mark APPROVED in DB
    try {
      await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
    } catch {
      setActioningIds((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setToast({ message: "❌ Approve failed — check connection", type: "error" });
      return;
    }

    // Step 2: generate personalised email via GPT-4o, then send
    const { subject, body } = await buildLeadEmail(lead);
    try {
      const sendRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: lead.email, toName: lead.firstName, subject, body }),
      });
      const sendData = (await sendRes.json()) as { success?: boolean; error?: string };
      if (!sendRes.ok || !sendData.success) {
        // Keep as APPROVED — visible in Approved tab for retry
        setLocalLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: "APPROVED", approvedAt: new Date().toISOString() } : l)),
        );
        setToast({ message: "❌ Send failed — check Gmail connection", type: "error" });
      } else {
        await fetch(`/api/admin/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SENT" }),
        });
        setLocalLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: "SENT", sentAt: new Date().toISOString() } : l)),
        );
        setToast({ message: `✅ Sent to ${lead.firstName}!`, type: "success" });
      }
    } catch {
      setLocalLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "APPROVED", approvedAt: new Date().toISOString() } : l)),
      );
      setToast({ message: "❌ Send failed — check Gmail connection", type: "error" });
    }
    setActioningIds((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function skipLead(id: string) {
    setActioningIds((prev) => ({ ...prev, [id]: "skipping" }));
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SKIPPED" }),
    });
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "SKIPPED" } : l)),
    );
    setActioningIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function skipAllLeads() {
    const ids = readyLeads.map((l) => l.id);
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SKIPPED" }),
        }),
      ),
    );
    setLocalLeads((prev) =>
      prev.map((l) => (READY_STATUSES.includes(l.status) ? { ...l, status: "SKIPPED" } : l)),
    );
  }

  async function editEmail(id: string, email: string) {
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, status: email ? "EMAIL_FOUND" : "NO_EMAIL" }),
    });
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, email: email || null, status: email ? "EMAIL_FOUND" : "NO_EMAIL" } : l,
      ),
    );
  }

  function updateLead(id: string, patch: Partial<Lead>) {
    setLocalLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function approveAllAndSend() {
    const toSend = readyLeads.filter((l) => l.email); // capture before state updates
    // Approve all in DB (including leads without email)
    await fetch("/api/admin/leads/approve-all", { method: "POST" });
    setLocalLeads((prev) =>
      prev.map((l) =>
        READY_STATUSES.includes(l.status)
          ? { ...l, status: "APPROVED", approvedAt: new Date().toISOString() }
          : l,
      ),
    );
    if (!toSend.length) {
      setActiveTab("APPROVED");
      return;
    }
    setSendingAll(true);
    setSendProgress({ current: 0, total: toSend.length });
    for (let i = 0; i < toSend.length; i++) {
      const lead = toSend[i];
      setSendProgress({ current: i, total: toSend.length });
      const { subject, body } = await buildLeadEmail(lead);
      try {
        const sendRes = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: lead.email, toName: lead.firstName, subject, body }),
        });
        const sendData = (await sendRes.json()) as { success?: boolean; error?: string };
        if (!sendRes.ok || !sendData.success) {
          console.error(`[send-email] Failed for ${lead.email}: ${sendData.error ?? "unknown error"}`);
          continue;
        }
        await fetch(`/api/admin/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SENT" }),
        });
        setLocalLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: "SENT", sentAt: new Date().toISOString() } : l)),
        );
      } catch {
        console.error(`[send-email] Network error for ${lead.email}`);
      }
      if (i < toSend.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    setSendProgress({ current: toSend.length, total: toSend.length });
    setSendingAll(false);
    setActiveTab("SENT");
  }

  async function repairStuck() {
    setRepairing(true);
    setRepairResult(null);
    try {
      const res = await fetch("/api/admin/leads/repair", { method: "POST" });
      const data = (await res.json()) as { success: boolean; repaired?: number; skipped?: number; error?: string };
      if (data.success) {
        setRepairResult(`🔧 Repaired ${data.repaired} stuck pack${data.repaired !== 1 ? "s" : ""} — refresh to see them in Ready tab.`);
      } else {
        setRepairResult(`❌ ${data.error ?? "Repair failed"}`);
      }
    } catch {
      setRepairResult("❌ Network error");
    }
    setRepairing(false);
  }

  async function runRssCheck() {
    setRssRunning(true);
    setRssResult(null);
    try {
      const res = await fetch("/api/cron/rss/trigger", { method: "POST" });
      const data = await res.json() as {
        success?: boolean;
        feedsChecked?: number;
        newEpisodes?: number;
        packsGenerated?: number;
        error?: string;
      };
      if (data.success) {
        setRssResult(
          `✅ Done — ${data.feedsChecked ?? 0} feed${(data.feedsChecked ?? 0) !== 1 ? "s" : ""} checked, ${data.newEpisodes ?? 0} new episode${(data.newEpisodes ?? 0) !== 1 ? "s" : ""}, ${data.packsGenerated ?? 0} pack${(data.packsGenerated ?? 0) !== 1 ? "s" : ""} generated.`,
        );
      } else {
        setRssResult(`❌ ${data.error ?? "RSS check failed"}`);
      }
    } catch {
      setRssResult("❌ Network error — check console");
    }
    setRssRunning(false);
  }

  async function runPipeline() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/cron/pipeline/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxResults: customMax, minRevenue: customMinRevenue }),
      });
      const data = (await res.json()) as {
        success: boolean;
        discovered?: number;
        processed?: number;
        skipped?: number;
        failed?: number;
        emailRetries?: number;
        emailsFound?: number;
        error?: string;
      };
      if (data.success) {
        setRunResult(
          `✅ Done — ${data.discovered ?? 0} stories found, ${data.processed ?? 0} leads created, ${data.skipped ?? 0} skipped, ${data.emailRetries ?? 0} email retries (${data.emailsFound ?? 0} found). Refresh to see new leads.`,
        );
      } else {
        setRunResult(`❌ ${data.error ?? "Pipeline failed"}`);
      }
    } catch {
      setRunResult("❌ Network error — check console");
    }
    setRunning(false);
  }

  async function sendAllApproved() {
    const toSend = approvedLeads.filter((l) => l.email);
    if (!toSend.length) {
      alert("No approved leads with email addresses to send.");
      return;
    }
    setSendingAll(true);
    setSendProgress({ current: 0, total: toSend.length });

    for (let i = 0; i < toSend.length; i++) {
      const lead = toSend[i];
      setSendProgress({ current: i, total: toSend.length });

      const { subject, body } = await buildLeadEmail(lead);

      try {
        const sendRes = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: lead.email, toName: lead.firstName, subject, body }),
        });
        const sendData = await sendRes.json() as { success?: boolean; error?: string };
        if (!sendRes.ok || !sendData.success) {
          console.error(`[send-email] Failed for ${lead.email}: ${sendData.error ?? "unknown error"}`);
          // Do NOT mark as SENT — leave in APPROVED so it can be retried
          continue;
        }
        await fetch(`/api/admin/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SENT" }),
        });
        setLocalLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id ? { ...l, status: "SENT", sentAt: new Date().toISOString() } : l,
          ),
        );
      } catch {
        console.error(`[send-email] Network error for ${lead.email}`);
        // continue to next lead
      }

      if (i < toSend.length - 1) {
        await new Promise((r) => setTimeout(r, 3000)); // 3s delay between sends
      }
    }

    setSendProgress({ current: toSend.length, total: toSend.length });
    setSendingAll(false);
    setActiveTab("SENT");
  }

  const currentLeads = tabLeads[activeTab];

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0 space-y-0.5">
          {lastRun ? (
            <p className="text-sm text-neutral-700">
              <span className="font-medium">Last run:</span>{" "}
              {new Date(lastRun.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              — {lastRun.count} video{lastRun.count !== 1 ? "s" : ""} processed
            </p>
          ) : (
            <p className="text-sm text-neutral-400">Never run — trigger a run to start.</p>
          )}
          {llmStats.total > 0 && (
            <p className="text-xs text-neutral-500">
              Last 30 days: {llmStats.total} pack{llmStats.total !== 1 ? "s" : ""} —{" "}
              <span className="text-sky-600 font-medium">🤖 {llmStats.gpt4o} GPT-4o</span>
              {llmStats.claude > 0 && (
                <span className="text-orange-600 font-medium"> · 🧠 {llmStats.claude} Claude fallback</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={repairStuck}
            disabled={repairing || running}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition-colors"
          >
            {repairing ? "🔧 Repairing…" : "🔧 Repair Stuck"}
          </button>
          <button
            onClick={() => setShowRunPanel((v) => !v)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            ⚙ Settings
          </button>
          <button
            onClick={runRssCheck}
            disabled={rssRunning || running}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {rssRunning ? "⏳ Checking…" : "📡 Run RSS Check"}
          </button>
          <button
            onClick={runPipeline}
            disabled={running}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {running ? "⏳ Running…" : "▶ Run Now"}
          </button>
        </div>
      </div>

      {repairResult && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            repairResult.startsWith("🔧")
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {repairResult}
        </div>
      )}

      {runResult && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            runResult.startsWith("✅")
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {runResult}
        </div>
      )}

      {rssResult && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            rssResult.startsWith("✅")
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {rssResult}
        </div>
      )}

      {/* Custom run panel */}
      {showRunPanel && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">🔍 Discovery Run Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Max stories to process
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={customMax}
                onChange={(e) => setCustomMax(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Min monthly revenue filter ($)
              </label>
              <select
                value={customMinRevenue}
                onChange={(e) => setCustomMinRevenue(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[0, 1000, 5000, 10000, 25000, 50000].map((v) => (
                  <option key={v} value={v}>
                    {v === 0 ? "No minimum" : `$${v >= 1000 ? `${v / 1000}k` : v}/mo+`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-neutral-400">
            Scrapes starterstory.com/stories, generates content packs, then runs email waterfall for new leads.
          </p>
          <button
            onClick={() => { setShowRunPanel(false); runPipeline(); }}
            disabled={running}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            ▶ Run with these settings
          </button>
        </div>
      )}

      {/* Outreach queue */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50">
          {(["READY", "APPROVED", "SENT", "SKIPPED", "FAILED"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {STATUS_LABELS[tab]}{" "}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {/* Ready tab actions */}
          {activeTab === "READY" && readyLeads.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={approveAllAndSend}
                disabled={sendingAll}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {sendingAll ? "📨 Sending…" : `✅ Approve All & Send All (${readyLeads.length})`}
              </button>
              <button
                onClick={skipAllLeads}
                disabled={sendingAll || readyLeads.length === 0}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 transition-colors"
              >
                ⏭ Skip All
              </button>
              {sendingAll && sendProgress && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.round((sendProgress.current / sendProgress.total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500">{sendProgress.current}/{sendProgress.total}</span>
                </div>
              )}
              <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                {(
                  [
                    { key: "all", label: "Show all" },
                    { key: "growing_plus", label: "Growing+" },
                    { key: "has_email", label: "Has email" },
                  ] as { key: ReadyFilter; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setReadyFilter(key)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      readyFilter === key
                        ? "bg-white shadow-sm text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {label}
                    {key !== "all" && (
                      <span className="ml-1 text-neutral-400">
                        (
                        {key === "growing_plus"
                          ? readyLeads.filter(
                              (l) => l.revenueStage === "growing" || l.revenueStage === "scaled",
                            ).length
                          : readyLeads.filter((l) => !!l.email).length}
                        )
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Approved tab actions */}
          {activeTab === "APPROVED" && approvedLeads.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={sendAllApproved}
                  disabled={sendingAll}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  {sendingAll ? "📨 Sending…" : `📨 Send All via Gmail (${approvedLeads.filter((l) => l.email).length})`}
                </button>
                {!sendingAll && (
                  <span className="text-xs text-neutral-400">
                    {approvedLeads.filter((l) => !l.email).length > 0 &&
                      `${approvedLeads.filter((l) => !l.email).length} without email will be skipped`}
                  </span>
                )}
              </div>
              {sendingAll && sendProgress && (
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">
                    Sending {sendProgress.current + 1} of {sendProgress.total}…
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.round((sendProgress.current / sendProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leads */}
          {currentLeads.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">
              {activeTab === "READY" ? "No leads ready — run the pipeline to discover videos." : `No ${STATUS_LABELS[activeTab].toLowerCase()} leads.`}
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {currentLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onApproveAndSend={approveAndSendLead}
                  onSkip={skipLead}
                  onEmailEdit={editEmail}
                  onLeadUpdate={updateLead}
                  expanded={expandedSection}
                  onToggleExpand={setExpandedSection}
                  sending={actioningIds[lead.id] === "sending"}
                  skipping={actioningIds[lead.id] === "skipping"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline log */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowLog((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          <span>Pipeline Log ({pipelineLog.length} recent videos)</span>
          <span className="text-neutral-400 text-xs">{showLog ? "▲" : "▼"}</span>
        </button>
        {showLog && (
          <div className="overflow-x-auto border-t border-neutral-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-50 text-left">
                  <th className="px-4 py-2 font-semibold text-neutral-500">Video</th>
                  <th className="px-4 py-2 font-semibold text-neutral-500">Channel</th>
                  <th className="px-4 py-2 font-semibold text-neutral-500">Status</th>
                  <th className="px-4 py-2 font-semibold text-neutral-500">Processed</th>
                  <th className="px-4 py-2 font-semibold text-neutral-500">Error</th>
                </tr>
              </thead>
              <tbody>
                {pipelineLog.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 max-w-[200px] truncate text-neutral-800">
                      {row.title}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {row.youtubeVideoId.startsWith("ss_")
                        ? "📖 Starter Story"
                        : row.youtubeVideoId.startsWith("ih_")
                          ? "🚀 Indie Hackers"
                          : row.youtubeVideoId.startsWith("fa_")
                            ? "⚡ Failory"
                            : row.youtubeVideoId.startsWith("pack_")
                              ? "✋ Manual"
                              : "📺 YouTube"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          row.status === "READY"
                            ? "bg-green-100 text-green-700"
                            : row.status === "FAILED"
                              ? "bg-red-100 text-red-600"
                              : row.status === "SKIPPED"
                                ? "bg-neutral-100 text-neutral-500"
                                : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-400">
                      {new Date(row.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2 text-red-500 max-w-[180px] truncate">
                      {row.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
