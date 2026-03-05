"use client";

import { useState } from "react";

const FALLBACK_URL = "https://usekorel.com";

function getDestinationUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    if (to) return decodeURIComponent(to);
  } catch {
    // ignore
  }
  return FALLBACK_URL;
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/**
 * Build an Android intent URL that opens the destination directly in Chrome.
 * Falls back to the destination URL itself if Chrome is not installed.
 */
function buildIntentUrl(dest: string): string {
  // Strip the scheme — intent:// supplies its own
  const withoutScheme = dest.replace(/^https?:\/\//, "");
  const fallback = encodeURIComponent(dest);
  return `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}

export default function OpenInBrowserPage() {
  const [copied, setCopied] = useState(false);
  // null = not attempted, true = android intent fired, false = ios (can't auto-open)
  const [intentFired, setIntentFired] = useState<boolean | null>(null);

  async function copyUrl() {
    const url = getDestinationUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard API unavailable
    }
  }

  async function handleOpenInBrowser() {
    const dest = getDestinationUrl();

    if (isAndroid()) {
      // Android: intent URL asks the OS to open Chrome directly
      window.location.href = buildIntentUrl(dest);
      setIntentFired(true);
    } else {
      // iOS / other: WKWebView blocks programmatic browser launches.
      // Best we can do is copy the link and instruct the user.
      await copyUrl();
      setIntentFired(false);
    }
  }

  async function handleCopy() {
    await copyUrl();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F7FB",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          padding: "48px 40px",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            K
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0F172A",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            marginBottom: "12px",
          }}
        >
          Open Korel in your browser
        </h1>

        {/* Explanation */}
        <p
          style={{
            fontSize: "15px",
            color: "#64748B",
            lineHeight: 1.65,
            marginBottom: "32px",
          }}
        >
          LinkedIn&rsquo;s built-in browser blocks Google login. You need to
          open Korel in Safari or Chrome to continue.
        </p>

        {/* iOS notice after failed auto-open */}
        {intentFired === false && (
          <div
            style={{
              backgroundColor: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: "14px", color: "#92400E", margin: 0, lineHeight: 1.55 }}>
              <strong>iOS can&rsquo;t open the browser automatically.</strong>{" "}
              Your link has been copied — tap <strong>Copy link</strong> below
              then paste it in Safari or Chrome.
            </p>
          </div>
        )}

        {/* Android: show confirmation after intent fires */}
        {intentFired === true && (
          <div
            style={{
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: "14px", color: "#166534", margin: 0, lineHeight: 1.55 }}>
              <strong>Opening Chrome&hellip;</strong> If nothing happened, use{" "}
              <strong>Copy link</strong> and paste it in Chrome manually.
            </p>
          </div>
        )}

        {/* Primary CTA */}
        <button
          onClick={handleOpenInBrowser}
          style={{
            display: "block",
            width: "100%",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "15px",
            padding: "14px 24px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            marginBottom: "12px",
            boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
            transition: "opacity 0.15s ease",
            fontFamily: "inherit",
          }}
        >
          Open in Browser
        </button>

        {/* Copy link */}
        <button
          onClick={handleCopy}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "1.5px solid #E2E8F0",
            borderRadius: "10px",
            color: copied ? "#10B981" : "#64748B",
            fontWeight: 500,
            fontSize: "14px",
            padding: "12px 24px",
            cursor: "pointer",
            marginBottom: "32px",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
          }}
        >
          {copied ? "Link copied — paste in Safari or Chrome" : "Copy link"}
        </button>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "#F1F5F9",
            marginBottom: "24px",
          }}
        />

        {/* Manual instructions */}
        <div style={{ textAlign: "left" }}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#94A3B8",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Manual steps
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  marginBottom: "2px",
                }}
              >
                iPhone / Safari
              </p>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                Tap <strong>•••</strong> and choose{" "}
                <strong>&ldquo;Open in Safari&rdquo;</strong>
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  marginBottom: "2px",
                }}
              >
                Android / Chrome
              </p>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                Tap <strong>⋮</strong> and choose{" "}
                <strong>&ldquo;Open in Chrome&rdquo;</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
