"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type PostCopyButtonProps = {
  value: string;
  className?: string;
};

export default function PostCopyButton({
  value,
  className,
}: PostCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:bg-neutral-100 ${className ?? ""}`}
      aria-label="Copy post"
    >
      {copied ? (
        <Check className="h-4 w-4 text-neutral-600" />
      ) : (
        <Copy className="h-4 w-4 text-neutral-500" />
      )}
    </button>
  );
}
