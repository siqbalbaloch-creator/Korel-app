"use client";

import { useState, useEffect } from "react";

type ProfileData = {
  coreThesis: string;
  positioning: string;
  targetAudience: string;
  tone: string;
  toneNotes: string;
};

const DEFAULT_PROFILE: ProfileData = {
  coreThesis: "",
  positioning: "",
  targetAudience: "",
  tone: "MEASURED",
  toneNotes: "",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function AuthorityProfileForm() {
  const [form, setForm] = useState<ProfileData>(DEFAULT_PROFILE);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/authority-profile")
      .then((r) => r.json())
      .then((data: { profile: Partial<ProfileData> | null }) => {
        if (data.profile) {
          setForm({
            coreThesis: data.profile.coreThesis ?? "",
            positioning: data.profile.positioning ?? "",
            targetAudience: data.profile.targetAudience ?? "",
            tone: data.profile.tone ?? "MEASURED",
            toneNotes: data.profile.toneNotes ?? "",
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/settings/authority-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!loaded) {
    return (
      <div className="px-6 py-5 text-sm text-neutral-400">Loading profile…</div>
    );
  }

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Core Thesis */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-medium text-neutral-600"
          htmlFor="ap-core-thesis"
        >
          Core Thesis
        </label>
        <textarea
          id="ap-core-thesis"
          rows={3}
          maxLength={500}
          placeholder="Your repeated belief — the idea you want to be known for."
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
          value={form.coreThesis}
          onChange={(e) => setForm((f) => ({ ...f, coreThesis: e.target.value }))}
        />
        <p className="text-[11px] text-neutral-400">
          Packs will stay consistent with this across generations. Max 500 chars.
        </p>
      </div>

      {/* Positioning */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-medium text-neutral-600"
          htmlFor="ap-positioning"
        >
          Positioning
        </label>
        <textarea
          id="ap-positioning"
          rows={2}
          maxLength={500}
          placeholder="How you want to be perceived in the market."
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
          value={form.positioning}
          onChange={(e) => setForm((f) => ({ ...f, positioning: e.target.value }))}
        />
        <p className="text-[11px] text-neutral-400">Max 500 chars.</p>
      </div>

      {/* Target Audience */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-medium text-neutral-600"
          htmlFor="ap-audience"
        >
          Target Audience
        </label>
        <input
          id="ap-audience"
          type="text"
          maxLength={200}
          placeholder="e.g. B2B founders, CFOs, PMs"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
          value={form.targetAudience}
          onChange={(e) =>
            setForm((f) => ({ ...f, targetAudience: e.target.value }))
          }
        />
        <p className="text-[11px] text-neutral-400">
          Who you speak to. Max 200 chars.
        </p>
      </div>

      {/* Tone + Tone Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium text-neutral-600"
            htmlFor="ap-tone"
          >
            Tone
          </label>
          <select
            id="ap-tone"
            value={form.tone}
            onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
          >
            <option value="MEASURED">Measured</option>
            <option value="BOLD">Bold</option>
            <option value="DIRECT">Direct</option>
            <option value="ACADEMIC">Academic</option>
            <option value="FRIENDLY">Friendly</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium text-neutral-600"
            htmlFor="ap-tone-notes"
          >
            Tone Notes
            <span className="ml-1 text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            id="ap-tone-notes"
            type="text"
            maxLength={280}
            placeholder="e.g. no hype, operator voice"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
            value={form.toneNotes}
            onChange={(e) =>
              setForm((f) => ({ ...f, toneNotes: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={status === "saving"}
          onClick={() => void handleSave()}
          className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {status === "saving" ? "Saving…" : "Save Profile"}
        </button>
        {status === "saved" && (
          <span className="text-xs font-medium text-green-600">Saved</span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-500">Failed to save. Try again.</span>
        )}
      </div>
    </div>
  );
}
