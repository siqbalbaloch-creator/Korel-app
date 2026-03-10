"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";

type Props = {
  packId: string;
  approveToken: string | null;
  linkedinPost: string;
  twitterPost: string;
  newsletter: string;
  linkedInConnected: boolean;
  xConnected: boolean;
  beehiivConnected: boolean;
  episodeTitle?: string | null;
  packTitle?: string;
};

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#0A66C2] shrink-0">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-neutral-900 shrink-0">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type PublishState = {
  status: "idle" | "publishing" | "published" | "failed";
  postUrl?: string;
  error?: string;
};

function PublishPlatformCard({
  platform,
  content,
  onContentChange,
  connected,
  packId,
  approveToken,
}: {
  platform: "linkedin" | "x";
  content: string;
  onContentChange: (v: string) => void;
  connected: boolean;
  packId: string;
  approveToken: string | null;
}) {
  const [state, setState] = useState<PublishState>({ status: "idle" });
  const [scheduledFor, setScheduledFor] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);

  const label = platform === "linkedin" ? "LinkedIn" : "X (Twitter)";
  const maxLen = platform === "linkedin" ? 3000 : 280;

  const publish = async (scheduled?: string) => {
    setState({ status: "publishing" });
    try {
      const res = await fetch(`/api/approve/${packId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          content,
          approveToken,
          scheduledFor: scheduled || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        postUrl?: string;
        scheduledFor?: string;
      };
      if (!res.ok) {
        setState({ status: "failed", error: data.error ?? "Publish failed" });
        return;
      }
      setState({ status: "published", postUrl: data.postUrl });
    } catch {
      setState({ status: "failed", error: "Network error. Try again." });
    }
  };

  if (!connected) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          {platform === "linkedin" ? <LinkedInIcon /> : <XIcon />}
          <span className="text-sm font-semibold text-neutral-900">{label}</span>
          <span className="ml-auto text-xs text-neutral-400">Not connected</span>
        </div>
        <p className="text-xs text-neutral-500">
          Connect {label} in{" "}
          <a href="/settings/connections" className="text-[#4F46E5] underline">
            Settings
          </a>{" "}
          to publish.
        </p>
      </div>
    );
  }

  if (state.status === "published") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-sm font-semibold text-green-800">
            {label} — Published!
          </span>
          {state.postUrl && (
            <a
              href={state.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-green-700 hover:underline"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
      <div className="flex items-center gap-2">
        {platform === "linkedin" ? <LinkedInIcon /> : <XIcon />}
        <span className="text-sm font-semibold text-neutral-900">{label}</span>
        <span className="ml-auto text-xs text-neutral-400">
          {content.length}/{maxLen}
        </span>
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        rows={platform === "linkedin" ? 8 : 4}
        maxLength={maxLen}
        className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-shadow"
      />

      {state.status === "failed" && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowScheduler((s) => !s)}
          className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          Schedule
        </button>
        <button
          type="button"
          disabled={state.status === "publishing" || !content.trim()}
          onClick={() => publish()}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
        >
          {state.status === "publishing" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          Publish to {label}
        </button>
      </div>

      {showScheduler && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
          <button
            type="button"
            disabled={!scheduledFor || state.status === "publishing"}
            onClick={() => publish(new Date(scheduledFor).toISOString())}
            className="shrink-0 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
          >
            Schedule
          </button>
        </div>
      )}
    </div>
  );
}

export default function ApproveClient({
  packId,
  approveToken,
  linkedinPost: initialLinkedin,
  twitterPost: initialTwitter,
  newsletter,
  linkedInConnected,
  xConnected,
  beehiivConnected,
  episodeTitle,
  packTitle,
}: Props) {
  const [linkedinPost, setLinkedinPost] = useState(initialLinkedin);
  const [twitterPost, setTwitterPost] = useState(initialTwitter);
  const [newsletterContent, setNewsletterContent] = useState(newsletter);
  const [beehiivState, setBeehiivState] = useState<{ status: "idle" | "sending" | "sent" | "failed"; webUrl?: string; error?: string }>({ status: "idle" });
  const [tab, setTab] = useState<"linkedin" | "x" | "newsletter">("linkedin");

  const sendToBeehiiv = async () => {
    setBeehiivState({ status: "sending" });
    try {
      const res = await fetch("/api/publish/beehiiv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, approveToken, content: newsletterContent, title: packTitle }),
      });
      const data = (await res.json()) as { error?: string; webUrl?: string };
      if (!res.ok) {
        setBeehiivState({ status: "failed", error: data.error ?? "Failed to send to Beehiiv." });
        return;
      }
      setBeehiivState({ status: "sent", webUrl: data.webUrl });
    } catch {
      setBeehiivState({ status: "failed", error: "Network error. Try again." });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12C2 12 5 4 12 4s10 8 10 8-3 8-10 8-10-8-10-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-900">Korel</p>
          <p className="text-xs text-neutral-500">Content pack ready to publish</p>
        </div>
        <a
          href={`/history/${packId}`}
          className="ml-auto text-xs text-[#4F46E5] hover:underline"
        >
          Full view
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Episode title */}
        {episodeTitle && (
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-xs text-neutral-400 mb-0.5">Episode</p>
            <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{episodeTitle}</p>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-2xl border border-neutral-200 p-1">
          {(["linkedin", "x", "newsletter"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                tab === t
                  ? "bg-[#4F46E5] text-white"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {t === "linkedin" ? "LinkedIn" : t === "x" ? "X / Twitter" : "Newsletter"}
            </button>
          ))}
        </div>

        {/* LinkedIn tab */}
        {tab === "linkedin" && (
          <PublishPlatformCard
            platform="linkedin"
            content={linkedinPost}
            onContentChange={setLinkedinPost}
            connected={linkedInConnected}
            packId={packId}
            approveToken={approveToken}
          />
        )}

        {/* X tab */}
        {tab === "x" && (
          <PublishPlatformCard
            platform="x"
            content={twitterPost}
            onContentChange={setTwitterPost}
            connected={xConnected}
            packId={packId}
            approveToken={approveToken}
          />
        )}

        {/* Newsletter tab */}
        {tab === "newsletter" && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
            <p className="text-sm font-semibold text-neutral-900">Newsletter section</p>
            <textarea
              value={newsletterContent}
              onChange={(e) => setNewsletterContent(e.target.value)}
              rows={10}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-shadow"
            />

            {/* Beehiiv publish */}
            {beehiivConnected ? (
              beehiivState.status === "sent" ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm font-semibold text-green-800">Draft created in Beehiiv</span>
                  </div>
                  {beehiivState.webUrl ? (
                    <a
                      href={beehiivState.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a25] transition-colors"
                    >
                      Open draft in Beehiiv <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-xs text-green-700">Open your Beehiiv dashboard to review and send.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {beehiivState.status === "failed" && (
                    <p className="text-xs text-red-500">{beehiivState.error}</p>
                  )}
                  <button
                    type="button"
                    disabled={beehiivState.status === "sending" || !newsletterContent.trim()}
                    onClick={sendToBeehiiv}
                    className="flex items-center gap-2 rounded-xl border border-[#FF6B35] bg-white px-4 py-2.5 text-sm font-semibold text-[#FF6B35] hover:bg-orange-50 disabled:opacity-50 transition-colors"
                  >
                    {beehiivState.status === "sending" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span className="font-bold text-xs bg-[#FF6B35] text-white px-1.5 py-0.5 rounded">BH</span>
                    )}
                    {beehiivState.status === "sending" ? "Creating draft..." : "Send to Beehiiv as draft"}
                  </button>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">
                  Connect Beehiiv in{" "}
                  <a href="/settings/connections" className="text-[#4F46E5] underline">Settings</a>{" "}
                  to publish drafts directly.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}
