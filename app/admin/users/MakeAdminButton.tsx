"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MakeAdminButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/make-admin`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => void handleClick()}
      disabled={loading}
      className="rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5] hover:bg-[#E0E7FF] disabled:opacity-50 transition-colors"
    >
      {loading ? "Updating…" : "Make Admin"}
    </button>
  );
}
