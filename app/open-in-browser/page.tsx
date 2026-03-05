"use client";

import { useState } from "react";

export default function OpenInBrowserPage() {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }

  async function handleOpenInBrowser() {
    const url = window.location.href;
    // Use replace() — most reliable redirect in restricted in-app browsers
    window.location.replace(url);
    // Auto-copy as fallback in case the redirect is blocked
    await copyUrl();
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
          LinkedIn opens links inside a restricted in-app browser that
          blocks Google login. Please open Korel in your device browser
          to continue.
        </p>

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
