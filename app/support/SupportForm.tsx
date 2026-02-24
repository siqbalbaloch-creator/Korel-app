"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export function SupportForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setSubject("");
    setMessage("");
    setIsSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center rounded-full"
          style={{ width: 40, height: 40, background: "rgba(79,70,229,0.08)" }}>
          <Send size={16} color="#4F46E5" strokeWidth={1.75} />
        </div>
        <p className="text-sm font-semibold text-[#111827] mb-1">Message sent</p>
        <p className="text-sm text-[#6B7280] mb-4">
          Your message has been received. Our team will respond shortly.
        </p>
        <button onClick={() => router.push("/new")}
          className="text-sm font-medium text-[#4F46E5] hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-shadow";

  const labelClass = "block text-sm font-medium text-[#374151] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-6">
      <p className="text-base font-semibold text-[#111827] mb-5">Send us a message</p>

      <div className="space-y-4">
        {/* Email — read-only, pre-filled */}
        <div>
          <label className={labelClass} htmlFor="s-email">Email</label>
          <input
            id="s-email"
            type="email"
            value={userEmail}
            readOnly
            className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#6B7280] cursor-default focus:outline-none"
          />
        </div>

        {/* Subject */}
        <div>
          <label className={labelClass} htmlFor="s-subject">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="s-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Issue with pack generation"
            className={fieldClass}
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className={labelClass} htmlFor="s-message">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="s-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or question..."
            rows={7}
            className={`${fieldClass} resize-none`}
            required
          />
          <p className="text-xs text-[#9CA3AF] mt-1.5">
            Please include as much detail as possible to help us assist you better.
          </p>
        </div>
      </div>

      {error ? <p className="text-xs text-red-500 mt-3">{error}</p> : null}

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F3F4F6]">
        <button
          type="button"
          onClick={() => router.push("/new")}
          className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Sending..." : (
            <>Send Message <Send size={13} strokeWidth={2} /></>
          )}
        </button>
      </div>
    </form>
  );
}
