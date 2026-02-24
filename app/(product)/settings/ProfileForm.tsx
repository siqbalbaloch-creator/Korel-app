"use client";

import { useState } from "react";

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isDirty = name.trim() !== initialName.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || saving) return;

    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/account/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to save");
        setStatus("error");
      } else {
        setStatus("success");
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
          htmlFor="name"
          className="block text-xs font-medium text-neutral-600 mb-1"
        >
          Display name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          maxLength={100}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
          placeholder="Your name"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
      {status === "success" && (
        <p className="text-xs text-green-700">Name updated successfully.</p>
      )}

      <button
        type="submit"
        disabled={!isDirty || saving}
        className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
