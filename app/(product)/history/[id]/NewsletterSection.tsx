"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import PostCopyButton from "./post-copy-button";

type NewsletterSectionProps = {
  content: string;
  packId: string;
  packTitle: string;
  beehiivConnected: boolean;
};

export default function NewsletterSection({ content, packId, packTitle, beehiivConnected }: NewsletterSectionProps) {
  const [beehiivState, setBeehiivState] = useState<{
    status: "idle" | "sending" | "sent" | "failed";
    webUrl?: string;
    error?: string;
  }>({ status: "idle" });

  if (!content.trim()) {
    return null;
  }

  const normalized = content.replace(/\\n/g, "\n").trim();

  const sendToBeehiiv = async () => {
    setBeehiivState({ status: "sending" });
    try {
      const res = await fetch("/api/publish/beehiiv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, title: packTitle, content: normalized }),
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
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Newsletter</h2>
        <p className="text-xs text-neutral-500">
          A single canonical newsletter format derived from the same thesis.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Mail className="h-4 w-4 text-neutral-500" />
            Newsletter
          </span>
          <PostCopyButton value={normalized} />
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className="whitespace-pre-line text-sm text-neutral-700 leading-relaxed">
            {normalized}
          </div>
        </div>

        {/* Beehiiv publish row */}
        <div className="px-5 pb-5 border-t border-neutral-100 pt-4">
          {beehiivConnected ? (
            beehiivState.status === "sent" ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm text-green-700">Draft created in Beehiiv</span>
                {beehiivState.webUrl && (
                  <a href={beehiivState.webUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-[#4F46E5] hover:underline">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {beehiivState.error && (
                  <p className="text-xs text-red-500">{beehiivState.error}</p>
                )}
                <button
                  type="button"
                  disabled={beehiivState.status === "sending"}
                  onClick={sendToBeehiiv}
                  className="flex items-center gap-2 rounded-lg border border-[#FF6B35] bg-white px-3 py-1.5 text-xs font-semibold text-[#FF6B35] hover:bg-orange-50 disabled:opacity-50 transition-colors"
                >
                  {beehiivState.status === "sending" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="font-bold text-xs bg-[#FF6B35] text-white px-1 py-0.5 rounded">BH</span>
                  )}
                  {beehiivState.status === "sending" ? "Creating draft..." : "Send to Beehiiv"}
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-neutral-400">
              <a href="/settings/connections" className="text-[#4F46E5] hover:underline">Connect Beehiiv</a>
              {" "}to publish drafts directly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
