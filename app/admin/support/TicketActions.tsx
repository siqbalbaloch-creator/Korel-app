"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";

type Status = "open" | "in_progress" | "resolved";

const ACTIONS: Record<Status, { label: string; next: Status }[]> = {
  open: [
    { label: "Mark In Progress", next: "in_progress" },
    { label: "Mark Resolved", next: "resolved" },
  ],
  in_progress: [
    { label: "Mark Resolved", next: "resolved" },
    { label: "Reopen", next: "open" },
  ],
  resolved: [{ label: "Reopen", next: "open" }],
};

export function TicketActions({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const actions = ACTIONS[currentStatus] ?? [];

  async function apply(next: Status) {
    setOpen(false);
    setLoading(true);
    await fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 size={11} className="animate-spin" />}
        Actions
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-lg border border-neutral-200 bg-white shadow-lg py-1">
            {actions.map((a) => (
              <button
                key={a.next}
                type="button"
                onClick={() => apply(a.next)}
                className="w-full px-3 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
