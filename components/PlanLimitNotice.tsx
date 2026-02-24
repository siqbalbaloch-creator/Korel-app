"use client";

import Link from "next/link";

type PlanLimitNoticeProps = {
  message: string;
  upgradeHref?: string;
  actionLabel?: string;
};

export default function PlanLimitNotice({
  message,
  upgradeHref = "/upgrade",
  actionLabel = "Upgrade",
}: PlanLimitNoticeProps) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-3">
      <span className="text-amber-800">{message}</span>
      <Link
        href={upgradeHref}
        className="inline-flex items-center justify-center rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
