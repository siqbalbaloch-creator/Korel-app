"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WaitlistInterestQuality = "UNREVIEWED" | "LOW" | "MEDIUM" | "HIGH";

const QUALITY_OPTIONS: { value: WaitlistInterestQuality; label: string }[] = [
  { value: "UNREVIEWED", label: "—" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const QUALITY_COLOR: Record<WaitlistInterestQuality, string> = {
  UNREVIEWED: "text-neutral-400",
  LOW: "text-red-500",
  MEDIUM: "text-amber-600",
  HIGH: "text-emerald-600",
};

export function WaitlistQualitySelect({
  entryId,
  currentQuality,
}: {
  entryId: string;
  currentQuality: WaitlistInterestQuality;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as WaitlistInterestQuality;
    if (next === currentQuality) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/waitlist/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestQuality: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={currentQuality}
      onChange={onChange}
      disabled={busy}
      className={`text-xs rounded-md border border-neutral-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent disabled:opacity-50 cursor-pointer font-medium ${QUALITY_COLOR[currentQuality]}`}
    >
      {QUALITY_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
