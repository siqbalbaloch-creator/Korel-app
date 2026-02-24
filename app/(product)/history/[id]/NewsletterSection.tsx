"use client";

import { Mail } from "lucide-react";
import PostCopyButton from "./post-copy-button";

type NewsletterSectionProps = {
  content: string;
};

export default function NewsletterSection({ content }: NewsletterSectionProps) {
  if (!content.trim()) {
    return null;
  }

  const normalized = content.replace(/\\n/g, "\n").trim();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Newsletter</h2>
        <p className="text-xs text-neutral-500">
          A single canonical newsletter format derived from the same thesis.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Mail className="h-4 w-4 text-neutral-500" />
            Newsletter
          </span>
          <PostCopyButton value={normalized} />
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className="whitespace-pre-line text-sm text-neutral-700 leading-relaxed">
            {normalized}
          </div>
        </div>
      </div>
    </div>
  );
}
