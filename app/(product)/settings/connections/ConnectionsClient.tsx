"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type AccountInfo = {
  username: string | null;
  connectedAt: string;
  expiresAt: string | null;
};

type Props = {
  linkedin: AccountInfo | null;
  x: AccountInfo | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PlatformRow({
  name,
  icon,
  account,
  connectHref,
  onDisconnect,
}: {
  name: string;
  icon: React.ReactNode;
  account: AccountInfo | null;
  connectHref: string;
  onDisconnect: () => Promise<void>;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [localAccount, setLocalAccount] = useState(account);

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${name}? You will no longer be able to publish to ${name}.`)) return;
    setDisconnecting(true);
    try {
      await onDisconnect();
      setLocalAccount(null);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900">{name}</p>
          {localAccount ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <p className="text-xs text-neutral-500 truncate">
                {localAccount.username ?? "Connected"} &middot; since{" "}
                {formatDate(localAccount.connectedAt)}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5">
              <XCircle className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
              <p className="text-xs text-neutral-400">Not connected</p>
            </div>
          )}
        </div>
      </div>

      {localAccount ? (
        <button
          type="button"
          disabled={disconnecting}
          onClick={handleDisconnect}
          className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
        >
          {disconnecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Disconnect"
          )}
        </button>
      ) : (
        <a
          href={connectHref}
          className="shrink-0 rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-colors"
        >
          Connect {name}
        </a>
      )}
    </div>
  );
}

export default function ConnectionsClient({ linkedin, x }: Props) {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected");
  const errorCode = searchParams.get("error");

  const disconnect = async (platform: string) => {
    const res = await fetch("/api/auth/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (!res.ok) throw new Error("Disconnect failed");
  };

  return (
    <div className="space-y-4">
      {justConnected && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Successfully connected{" "}
          {justConnected === "linkedin" ? "LinkedIn" : "X (Twitter)"}!
        </div>
      )}
      {errorCode && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Connection failed: {errorCode.replace(/_/g, " ")}. Please try again.
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Social</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <PlatformRow
            name="LinkedIn"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#0A66C2]">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            }
            account={linkedin}
            connectHref="/api/auth/linkedin"
            onDisconnect={() => disconnect("linkedin")}
          />
          <div className="border-t border-neutral-100" />
          <PlatformRow
            name="X (Twitter)"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-neutral-900">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            }
            account={x}
            connectHref="/api/auth/x"
            onDisconnect={() => disconnect("x")}
          />
        </div>
      </section>
    </div>
  );
}
