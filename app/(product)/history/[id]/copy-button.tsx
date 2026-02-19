"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyButtonProps = {
  value: string;
};

export default function CopyButton({ value }: CopyButtonProps) {
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
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
      aria-label="Copy link"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-neutral-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-neutral-500" />
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
