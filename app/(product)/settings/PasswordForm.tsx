"use client";

import { useState } from "react";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    if (next !== confirm) {
      setErrorMsg("Passwords do not match");
      setStatus("error");
      return;
    }
    if (next.length < 8) {
      setErrorMsg("New password must be at least 8 characters");
      setStatus("error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to update password");
        setStatus("error");
      } else {
        setStatus("success");
        reset();
      }
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="current-password"
          className="block text-xs font-medium text-neutral-600 mb-1"
        >
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          value={current}
          onChange={(e) => { setCurrent(e.target.value); setStatus("idle"); }}
          autoComplete="current-password"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
        />
      </div>

      <div>
        <label
          htmlFor="new-password"
          className="block text-xs font-medium text-neutral-600 mb-1"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          value={next}
          onChange={(e) => { setNext(e.target.value); setStatus("idle"); }}
          autoComplete="new-password"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
        />
        <p className="mt-1 text-[11px] text-neutral-400">At least 8 characters.</p>
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-xs font-medium text-neutral-600 mb-1"
        >
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setStatus("idle"); }}
          autoComplete="new-password"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
      {status === "success" && (
        <p className="text-xs text-green-700">Password updated successfully.</p>
      )}

      <button
        type="submit"
        disabled={saving || !current || !next || !confirm}
        className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
