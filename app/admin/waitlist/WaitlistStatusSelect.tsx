"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WaitlistStatus = "ACTIVE" | "CONTACTED" | "CONVERTED" | "REMOVED";

const STATUS_OPTIONS: { value: WaitlistStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONVERTED", label: "Converted" },
  { value: "REMOVED", label: "Removed" },
];

export function WaitlistStatusSelect({
  entryId,
  currentStatus,
}: {
  entryId: string;
  currentStatus: WaitlistStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as WaitlistStatus;
    if (next === currentStatus) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/waitlist/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={currentStatus}
      onChange={onChange}
      disabled={busy}
      className="text-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent disabled:opacity-50 cursor-pointer"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
