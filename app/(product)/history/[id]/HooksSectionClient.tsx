"use client";

import { useEffect, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import PostCopyButton from "./post-copy-button";
import PlanLimitNotice from "@/components/PlanLimitNotice";

type StrategicHooks = {
  linkedin: string[];
  twitter: string[];
  contrarian: string[];
};

type HooksSectionClientProps = {
  packId: string;
  initialHooks: StrategicHooks;
  defaultOpen?: boolean;
  regenLimitReached?: boolean;
  regenNotice?: string;
  upgradeHref?: string;
};

export default function HooksSectionClient({
  packId,
  initialHooks,
  defaultOpen = false,
  regenLimitReached = false,
  regenNotice,
  upgradeHref,
}: HooksSectionClientProps) {
  const [hooks, setHooks] = useState(initialHooks);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(regenLimitReached);

  useEffect(() => {
    setLimitReached(regenLimitReached);
  }, [regenLimitReached]);

  const regenerateHooks = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/packs/${packId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "hooks" }),
      });
      const data = (await res.json()) as {
        hooks?: StrategicHooks;
        error?: string;
        code?: string;
        message?: string;
      };
      if (data.code === "PLAN_LIMIT_REGEN_EXCEEDED") {
        setLimitReached(true);
        setError(data.message ?? "Regeneration limit reached.");
        return;
      }
      if (data.hooks) {
        setHooks(data.hooks);
      } else {
        setError("Regeneration failed. Please try again.");
      }
    } catch {
      setError("Regeneration failed. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const isDisabled = regenerating || limitReached;

  return (
    <details
      className="group rounded-2xl border border-neutral-200 bg-white shadow-sm"
      open={defaultOpen}
    >
      <summary className="flex h-12 items-center justify-between px-5 text-sm font-semibold text-neutral-900 cursor-pointer list-none">
        <span>Strategic Hooks</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isDisabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void regenerateHooks();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
            title="Regenerate hooks"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`}
            />
          </button>
          <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
        </div>
      </summary>

      <div className="px-5 pb-5 pt-5 space-y-4">
        {limitReached && (
          <PlanLimitNotice
            message={
              regenNotice ??
              "Regeneration limit reached. Upgrade to increase capacity."
            }
            upgradeHref={upgradeHref}
          />
        )}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">LinkedIn</p>
          <ul className="space-y-1 text-sm text-neutral-600">
            {hooks.linkedin.filter(Boolean).map((hook, i) => (
              <li key={i} className="group/hook flex items-center gap-2">
                <span className="text-neutral-400 shrink-0">•</span>
                <span className="flex-1">{hook}</span>
                <PostCopyButton
                  value={hook}
                  className="shrink-0 opacity-0 pointer-events-none group-hover/hook:opacity-100 group-hover/hook:pointer-events-auto transition-opacity"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">X / Twitter</p>
          <ul className="space-y-1 text-sm text-neutral-600">
            {hooks.twitter.filter(Boolean).map((hook, i) => (
              <li key={i} className="group/hook flex items-center gap-2">
                <span className="text-neutral-400 shrink-0">•</span>
                <span className="flex-1">{hook}</span>
                <PostCopyButton
                  value={hook}
                  className="shrink-0 opacity-0 pointer-events-none group-hover/hook:opacity-100 group-hover/hook:pointer-events-auto transition-opacity"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Contrarian</p>
          <ul className="space-y-1 text-sm text-neutral-600">
            {hooks.contrarian.filter(Boolean).map((hook, i) => (
              <li key={i} className="group/hook flex items-center gap-2">
                <span className="text-neutral-400 shrink-0">•</span>
                <span className="flex-1">{hook}</span>
                <PostCopyButton
                  value={hook}
                  className="shrink-0 opacity-0 pointer-events-none group-hover/hook:opacity-100 group-hover/hook:pointer-events-auto transition-opacity"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
