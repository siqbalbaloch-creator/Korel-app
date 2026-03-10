"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type AccountInfo = {
  username: string | null;
  connectedAt: string;
  expiresAt: string | null;
};

type BeehiivInfo = {
  publicationName: string | null;
  connectedAt: string;
};

type Props = {
  linkedin: AccountInfo | null;
  x: AccountInfo | null;
  beehiiv: BeehiivInfo | null;
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

function BeehiivSection({ initial }: { initial: BeehiivInfo | null }) {
  const [account, setAccount] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justConnectedName, setJustConnectedName] = useState<string | null>(null);

  const save = async () => {
    if (!apiKey.trim() || !publicationId.trim()) {
      setError("Both fields are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/beehiiv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), publicationId: publicationId.trim() }),
      });
      const data = (await res.json()) as { error?: string; publicationName?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to connect. Check your credentials.");
        return;
      }
      const name = data.publicationName ?? null;
      setAccount({ publicationName: name, connectedAt: new Date().toISOString() });
      setJustConnectedName(name ?? "your publication");
      setShowForm(false);
      setApiKey("");
      setPublicationId("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Beehiiv? You won't be able to publish newsletters until reconnected.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/settings/beehiiv", { method: "DELETE" });
      setAccount(null);
      setShowForm(false);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {justConnectedName && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">
            Connected to {justConnectedName}
          </p>
          <button
            type="button"
            onClick={() => setJustConnectedName(null)}
            className="ml-auto text-xs text-green-600 hover:text-green-800"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] text-white text-xs font-bold">BH</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">Beehiiv</p>
            {account ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <p className="text-xs text-neutral-500 truncate">
                  {account.publicationName ?? "Connected"} &middot; since{" "}
                  {formatDate(account.connectedAt)}
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

        {account ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Update
            </button>
            <button
              type="button"
              disabled={disconnecting}
              onClick={disconnect}
              className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="shrink-0 rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-colors"
          >
            Connect Beehiiv
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="bh-..."
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-shadow"
            />
            <p className="text-xs text-neutral-400">
              Settings &rarr; Integrations &rarr; API in your Beehiiv dashboard.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700">Publication ID</label>
            <input
              type="text"
              value={publicationId}
              onChange={(e) => setPublicationId(e.target.value)}
              placeholder="pub_..."
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-shadow"
            />
            <p className="text-xs text-neutral-400">
              From your Beehiiv URL: beehiiv.com/publications/pub_xxx.
            </p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Connecting..." : "Connect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConnectionsClient({ linkedin, x, beehiiv }: Props) {
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

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Newsletter</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <BeehiivSection initial={beehiiv} />
          <div className="border-t border-neutral-100" />
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 text-white text-xs font-bold">S</span>
              <div>
                <p className="text-sm font-medium text-neutral-700">Substack</p>
                <p className="text-xs text-neutral-400">Publish newsletter sections directly</p>
              </div>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-400">
              Coming soon
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
