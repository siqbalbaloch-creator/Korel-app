"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { logMarketingEvent } from "@/lib/marketingEvents";

type WaitlistPlan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
type WaitlistSource = "PRICING" | "NAVBAR" | "UPGRADE" | "UNKNOWN";

interface Props {
  plan: WaitlistPlan;
  source?: WaitlistSource;
  onClose: () => void;
}

const PLAN_LABELS: Record<WaitlistPlan, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

const PLAN_COPY: Record<WaitlistPlan, string> = {
  STARTER: "Starter plan is opening soon.",
  PROFESSIONAL: "Professional cohort is opening soon.",
  ENTERPRISE: "Enterprise onboarding opening soon.",
};

export function PricingWaitlistModal({ plan, source = "PRICING", onClose }: Props) {
  const { data: session, status: authStatus } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [entryStatus, setEntryStatus] = useState<string>("ACTIVE");
  const nameRef = useRef<HTMLInputElement>(null);

  const isAuthed = authStatus === "authenticated";
  const isAuthLoading = authStatus === "loading";

  // Auto-focus name field once auth state resolves
  useEffect(() => {
    if (!isAuthLoading) {
      nameRef.current?.focus();
    }
  }, [isAuthLoading]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitStatus === "submitting") return;
    setSubmitStatus("submitting");
    setErrorMsg("");

    try {
      const body: Record<string, string> = { plan, source };
      if (name.trim()) body.fullName = name.trim();
      // Only send email if not logged in — server uses session email when authed
      if (!isAuthed) body.email = email.trim();

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Submission failed. Please try again.");
      }

      const data = (await res.json()) as {
        ok: boolean;
        alreadyExists: boolean;
        plan: string;
        status: string;
      };
      setAlreadyExists(data.alreadyExists);
      setEntryStatus(data.status);
      if (!data.alreadyExists) {
        void logMarketingEvent("PRICING_INTENT_SUBMIT", { plan: data.plan });
      }
      setSubmitStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitStatus("error");
    }
  }

  const planLabel = PLAN_LABELS[plan];
  const planCopy = PLAN_COPY[plan];
  const submitting = submitStatus === "submitting";

  return (
    <>
      <style>{`@keyframes korel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "rgba(15, 23, 42, 0.55)",
          backdropFilter: "blur(4px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            border: "1px solid rgba(0, 0, 0, 0.07)",
            padding: "40px",
            width: "100%",
            maxWidth: "440px",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              backgroundColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#94A3B8",
              transition: "background-color 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F1F5F9";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#94A3B8";
            }}
          >
            <X size={15} strokeWidth={2} />
          </button>

          {/* === SUCCESS STATE === */}
          {submitStatus === "success" ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <CheckCircle2
                  size={40}
                  strokeWidth={1.5}
                  style={{ color: alreadyExists ? "#94A3B8" : "#4ADE80" }}
                />
              </div>
              <h2
                style={{
                  color: "#0F172A",
                  fontWeight: 700,
                  fontSize: "20px",
                  marginBottom: "10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {entryStatus === "CONVERTED" || entryStatus === "REMOVED"
                  ? "Already Recorded"
                  : alreadyExists
                  ? "Already Registered"
                  : "You\u2019re on the list."}
              </h2>
              <p
                style={{
                  color: "#64748B",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  marginBottom: "28px",
                }}
              >
                {entryStatus === "CONVERTED" || entryStatus === "REMOVED"
                  ? "Your interest was previously recorded. Please contact support if you believe this is a mistake."
                  : alreadyExists
                  ? `You\u2019re already on the ${planLabel} waitlist. We\u2019ll notify you when enrollment opens.`
                  : `You\u2019re on the ${planLabel} waitlist. We\u2019ll notify you when enrollment opens.`}
              </p>
              <button
                onClick={onClose}
                style={{
                  background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "15px",
                  height: "44px",
                  paddingLeft: "28px",
                  paddingRight: "28px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(109, 94, 243, 0.2)",
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Plan badge */}
              <div style={{ marginBottom: "20px" }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "rgba(109, 94, 243, 0.08)",
                    color: "#6D5EF3",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: "100px",
                  }}
                >
                  {planLabel}
                </span>
              </div>

              <h2
                id="waitlist-title"
                style={{
                  color: "#0F172A",
                  fontWeight: 700,
                  fontSize: "22px",
                  marginBottom: "8px",
                  letterSpacing: "-0.01em",
                  lineHeight: "1.25",
                }}
              >
                {planLabel} Access Opening Soon
              </h2>
              <p
                style={{
                  color: "#64748B",
                  fontSize: "14px",
                  lineHeight: "1.65",
                  marginBottom: "24px",
                }}
              >
                {planCopy} Join the priority list to get notified when enrollment opens.
              </p>

              {/* === AUTH-LOADING SKELETON === */}
              {isAuthLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "16px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    color: "#94A3B8",
                    fontSize: "14px",
                  }}
                >
                  <Loader2
                    size={16}
                    style={{ animation: "korel-spin 1s linear infinite", color: "#6D5EF3" }}
                  />
                  Loading…
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>

                  {/* Full Name */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      htmlFor="waitlist-name"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#374151",
                        fontSize: "13px",
                        fontWeight: 600,
                        marginBottom: "6px",
                      }}
                    >
                      Full Name
                      {isAuthed && (
                        <span style={{ fontWeight: 400, color: "#94A3B8" }}>
                          — optional
                        </span>
                      )}
                    </label>
                    <input
                      ref={nameRef}
                      id="waitlist-name"
                      type="text"
                      required={!isAuthed}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        isAuthed && session?.user?.name ? session.user.name : ""
                      }
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 14px",
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                        fontSize: "15px",
                        color: "#0F172A",
                        backgroundColor: "#F8FAFC",
                        outline: "none",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#6D5EF3";
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(109, 94, 243, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Email — read-only display when authed, input when not */}
                  <div style={{ marginBottom: "24px" }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Email Address
                    </p>

                    {isAuthed ? (
                      /* Signed-in: show email as a read-only display pill */
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          height: "44px",
                          padding: "0 14px",
                          borderRadius: "10px",
                          border: "1px solid #E2E8F0",
                          backgroundColor: "#F8FAFC",
                          fontSize: "14px",
                          color: "#374151",
                          userSelect: "none",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#4ADE80",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {session?.user?.email}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#94A3B8",
                            flexShrink: 0,
                          }}
                        >
                          signed in
                        </span>
                      </div>
                    ) : (
                      /* Signed-out: full editable email input */
                      <input
                        id="waitlist-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: "100%",
                          height: "44px",
                          padding: "0 14px",
                          borderRadius: "10px",
                          border: "1px solid #E2E8F0",
                          fontSize: "15px",
                          color: "#0F172A",
                          backgroundColor: "#F8FAFC",
                          outline: "none",
                          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#6D5EF3";
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(109, 94, 243, 0.08)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#E2E8F0";
                          e.currentTarget.style.backgroundColor = "#F8FAFC";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    )}
                  </div>

                  {/* Error */}
                  {submitStatus === "error" && errorMsg && (
                    <p
                      role="alert"
                      style={{
                        color: "#EF4444",
                        fontSize: "13px",
                        marginBottom: "16px",
                        padding: "10px 14px",
                        backgroundColor: "rgba(239, 68, 68, 0.06)",
                        borderRadius: "8px",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                      }}
                    >
                      {errorMsg}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%",
                      height: "48px",
                      background: submitting
                        ? "rgba(109, 94, 243, 0.6)"
                        : "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)",
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: "15px",
                      borderRadius: "12px",
                      border: "none",
                      cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: submitting
                        ? "none"
                        : "0 4px 16px rgba(109, 94, 243, 0.2)",
                      transition: "opacity 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {submitting && (
                      <Loader2
                        size={16}
                        style={{ animation: "korel-spin 1s linear infinite" }}
                      />
                    )}
                    {submitting ? "Joining\u2026" : "Notify Me"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
