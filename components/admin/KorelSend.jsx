// ─── KorelSend.jsx ────────────────────────────────────────────────────────────
// Main component — drop into your Korel admin dashboard.
// Props:
//   initialPack?   — pass a pack object from the parent page to pre-load
//   onSendSuccess? — callback(pack, recipient) after successful send
//   adminOnly?     — if true, renders an access-denied screen for non-admins
//   currentUser?   — { role: 'admin' | 'user', name: string }

import { useState, useEffect, useRef } from "react";
import { korelAPI, KOREL_BASE, MOCK_PACKS } from "./korelAPI";
import { sendViaGmail, buildEmailBody } from "./gmailSender";

const DEFAULT_SUBJECT = "Your content pack from Korel is ready 🎙️";
const DEFAULT_NOTE = `Hi {{first_name}},\n\nHere's your content pack generated from your recent interview — ready to schedule across your channels this week.\n\nLet me know if you'd like any edits!`;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").toLowerCase().replace(/ /g, "_"));
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim().replace(/^"|"$/g, ""); });
    obj.status = "pending";
    obj.id = Math.random().toString(36).slice(2);
    return obj;
  });
}

export default function KorelSend({ initialPack, onSendSuccess, adminOnly = true, currentUser }) {
  // Access guard
  if (adminOnly && currentUser?.role !== "admin") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#555" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#888" }}>Admin access required</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>This tool is only available to Korel admins.</div>
      </div>
    );
  }

  const [tab, setTab] = useState(initialPack ? "compose" : "korel");
  const [packTab, setPackTab] = useState("linkedin");

  // Compose state
  const [linkedin, setLinkedin] = useState(initialPack?.linkedin_post || "");
  const [twitter, setTwitter] = useState(initialPack?.twitter_post || "");
  const [newsletter, setNewsletter] = useState(initialPack?.newsletter || "");
  const [recipName, setRecipName] = useState(initialPack?.client_name || "");
  const [recipEmail, setRecipEmail] = useState(initialPack?.client_email || "");
  const [recipCompany, setRecipCompany] = useState(initialPack?.company || "");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [incLinkedin, setIncLinkedin] = useState(true);
  const [incTwitter, setIncTwitter] = useState(true);
  const [incNewsletter, setIncNewsletter] = useState(true);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);

  // Bulk state
  const [recipients, setRecipients] = useState([]);
  const [bulkLinkedin, setBulkLinkedin] = useState("");
  const [bulkTwitter, setBulkTwitter] = useState("");
  const [bulkNewsletter, setBulkNewsletter] = useState("");
  const [bulkSubject, setBulkSubject] = useState(DEFAULT_SUBJECT);
  const [bulkDelay, setBulkDelay] = useState(4);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const bulkStopRef = useRef(false);

  // Schedule state
  const [schedules, setSchedules] = useState([]);
  const [schedRecipName, setSchedRecipName] = useState("");
  const [schedRecipEmail, setSchedRecipEmail] = useState("");
  const [schedLinkedin, setSchedLinkedin] = useState("");
  const [schedTwitter, setSchedTwitter] = useState("");
  const [schedNewsletter, setSchedNewsletter] = useState("");
  const [schedSubject, setSchedSubject] = useState(DEFAULT_SUBJECT);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("09:00");

  // Korel API state
  const [korelBaseUrl] = useState(KOREL_BASE);
  const [korelClientId, setKorelClientId] = useState("mock");
  const [korelClientSecret, setKorelClientSecret] = useState("mock_secret");
  const [korelToken, setKorelToken] = useState(null);
  const [korelAuthed, setKorelAuthed] = useState(false);
  const [korelAuthLoading, setKorelAuthLoading] = useState(false);
  const [korelPacks, setKorelPacks] = useState([]);
  const [korelPacksLoading, setKorelPacksLoading] = useState(false);
  const [korelLookupType, setKorelLookupType] = useState("list");
  const [korelLookupVal, setKorelLookupVal] = useState("");
  const [korelSelectedPack, setKorelSelectedPack] = useState(initialPack || null);
  const [korelMockMode, setKorelMockMode] = useState(true);

  // History
  const [history, setHistory] = useState([]);

  // Toast
  const [toast, setToast] = useState(null);
  const toastRef = useRef();
  function showToast(msg, type = "default") {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3500);
  }

  // Schedule tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSchedules((prev) =>
        prev.map(async (s) => {
          if (s.status === "scheduled" && new Date(s.sendAt) <= now) {
            try {
              const body = buildEmailBody({ note: DEFAULT_NOTE, linkedinPost: s.linkedin, twitterPost: s.twitter, newsletter: s.newsletter, firstName: s.recipName, company: s.recipCompany });
              await sendViaGmail({ to: s.recipEmail, subject: s.subject, body });
              setHistory((h) => [{ name: s.recipName, email: s.recipEmail, subject: s.subject, status: "sent", time: new Date().toLocaleString(), type: "scheduled" }, ...h]);
              return { ...s, status: "sent" };
            } catch {
              return { ...s, status: "failed" };
            }
          }
          return s;
        })
      );
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Korel API handlers ──────────────────────────────────────────────────
  async function korelAuth() {
    setKorelAuthLoading(true);
    try {
      const { access_token } = await korelAPI.authenticate(korelMockMode ? "" : korelBaseUrl, korelMockMode ? "mock" : korelClientId, korelMockMode ? "" : korelClientSecret, korelMockMode);
      setKorelToken(access_token);
      setKorelAuthed(true);
      const { packs } = await korelAPI.listAll("", access_token);
      setKorelPacks(packs);
      showToast(korelMockMode ? "✅ Mock mode — demo packs loaded" : "✅ Connected to Korel API", "success");
    } catch (e) { showToast("❌ " + e.message, "error"); }
    setKorelAuthLoading(false);
  }

  async function korelFetch() {
    if (!korelToken) { showToast("⚠️ Authenticate first", "warn"); return; }
    setKorelPacksLoading(true);
    try {
      if (korelLookupType === "list") {
        const { packs } = await korelAPI.listAll("", korelToken);
        setKorelPacks(packs);
        showToast(`✅ ${packs.length} packs loaded`, "success");
      } else if (korelLookupType === "project_id") {
        const pack = await korelAPI.fetchPack("", korelToken, korelLookupVal);
        setKorelPacks([pack]);
      } else {
        const { packs } = await korelAPI.fetchByEmail("", korelToken, korelLookupVal);
        setKorelPacks(packs);
      }
    } catch (e) { showToast("❌ " + e.message, "error"); }
    setKorelPacksLoading(false);
  }

  function korelLoadIntoCompose(pack) {
    setLinkedin(pack.linkedin_post || "");
    setTwitter(pack.twitter_post || "");
    setNewsletter(pack.newsletter || "");
    setRecipName(pack.client_name || "");
    setRecipEmail(pack.client_email || "");
    setRecipCompany(pack.company || "");
    setKorelSelectedPack(pack);
    setTab("compose");
    showToast(`📦 ${pack.client_name} loaded → Compose`, "success");
  }

  function korelLoadIntoBulk(packs) {
    setRecipients(packs.map((p) => ({ id: p.project_id, first_name: (p.client_name || "").split(" ")[0], email: p.client_email || "", company: p.company || "", linkedin_post: p.linkedin_post || "", twitter_post: p.twitter_post || "", newsletter: p.newsletter || "", status: "pending" })));
    setBulkProgress(0);
    setTab("bulk");
    showToast(`📋 ${packs.length} packs → Bulk Send`, "success");
  }

  // ── Single send ─────────────────────────────────────────────────────────
  async function doSend() {
    if (!recipName || !recipEmail) { showToast("⚠️ Enter recipient name and email", "warn"); return; }
    if (!linkedin && !twitter && !newsletter) { showToast("⚠️ Paste at least one content piece", "warn"); return; }
    setSending(true);
    try {
      const sub = subject.replace(/\{\{first_name\}\}/g, recipName).replace(/\{\{company\}\}/g, recipCompany);
      const body = buildEmailBody({ note, linkedinPost: linkedin, twitterPost: twitter, newsletter, firstName: recipName, company: recipCompany, include: { linkedin: incLinkedin, twitter: incTwitter, newsletter: incNewsletter } });
      await sendViaGmail({ to: recipEmail, subject: sub, body });
      setHistory((h) => [{ name: recipName, email: recipEmail, subject: sub, status: "sent", time: new Date().toLocaleString(), type: "single" }, ...h]);
      showToast(`✅ Sent to ${recipEmail}!`, "success");
      onSendSuccess?.(korelSelectedPack, { name: recipName, email: recipEmail });
    } catch (e) {
      setHistory((h) => [{ name: recipName, email: recipEmail, subject, status: "failed", time: new Date().toLocaleString(), type: "single" }, ...h]);
      showToast("❌ " + e.message, "error");
    }
    setSending(false);
  }

  function doPreview() {
    const sub = subject.replace(/\{\{first_name\}\}/g, recipName || "{{first_name}}").replace(/\{\{company\}\}/g, recipCompany);
    const body = buildEmailBody({ note, linkedinPost: linkedin, twitterPost: twitter, newsletter, firstName: recipName || "{{first_name}}", company: recipCompany, include: { linkedin: incLinkedin, twitter: incTwitter, newsletter: incNewsletter } });
    setPreview({ to: `${recipName} <${recipEmail}>`, subject: sub, body });
  }

  // ── Bulk send ────────────────────────────────────────────────────────────
  async function startBulk() {
    if (!recipients.length) { showToast("⚠️ No recipients", "warn"); return; }
    setBulkRunning(true); bulkStopRef.current = false;
    let sent = 0;
    setRecipients((r) => r.map((x) => ({ ...x, status: "pending" })));
    for (let i = 0; i < recipients.length; i++) {
      if (bulkStopRef.current) break;
      const r = recipients[i];
      const name = r.first_name || r.name || "";
      setRecipients((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "sending" } : p));
      try {
        const sub = bulkSubject.replace(/\{\{first_name\}\}/g, name).replace(/\{\{company\}\}/g, r.company || "");
        const body = buildEmailBody({ note: DEFAULT_NOTE, linkedinPost: r.linkedin_post || bulkLinkedin, twitterPost: r.twitter_post || bulkTwitter, newsletter: r.newsletter || bulkNewsletter, firstName: name, company: r.company || "" });
        await sendViaGmail({ to: r.email, subject: sub, body });
        setRecipients((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "sent" } : p));
        setHistory((h) => [{ name, email: r.email, subject: sub, status: "sent", time: new Date().toLocaleString(), type: "bulk" }, ...h]);
        sent++;
      } catch {
        setRecipients((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "failed" } : p));
      }
      setBulkProgress(Math.round(((i + 1) / recipients.length) * 100));
      if (i < recipients.length - 1) await new Promise((res) => setTimeout(res, bulkDelay * 1000));
    }
    setBulkRunning(false);
    showToast(`🎉 Done — ${sent}/${recipients.length} sent`, "success");
  }

  // ── Schedule ─────────────────────────────────────────────────────────────
  function addSchedule() {
    if (!schedRecipEmail || !schedDate) { showToast("⚠️ Fill email and date", "warn"); return; }
    const sendAt = new Date(`${schedDate}T${schedTime}`);
    if (sendAt <= new Date()) { showToast("⚠️ Must be in the future", "warn"); return; }
    setSchedules((prev) => [...prev, { id: Math.random().toString(36).slice(2), recipName: schedRecipName, recipEmail: schedRecipEmail, linkedin: schedLinkedin, twitter: schedTwitter, newsletter: schedNewsletter, subject: schedSubject, sendAt: sendAt.toISOString(), status: "scheduled" }]);
    showToast(`📅 Scheduled for ${sendAt.toLocaleString()}`, "success");
  }

  const statSent = history.filter((h) => h.status === "sent").length;
  const statFailed = history.filter((h) => h.status === "failed").length;
  const statScheduled = schedules.filter((s) => s.status === "scheduled").length;

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    wrap: { fontFamily: "'Instrument Sans', 'DM Sans', system-ui, sans-serif", background: "#ffffff", color: "#111827", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    header: { background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: "#111827" },
    logoAccent: { color: "#e05a2b" },
    badge: { fontSize: 11, background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)", padding: "3px 10px", borderRadius: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 },
    nav: { display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 24px", background: "#f9fafb", gap: 2 },
    navBtn: (a) => ({ padding: "10px 16px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: "none", border: "none", borderBottom: `2px solid ${a ? "#e05a2b" : "transparent"}`, color: a ? "#e05a2b" : "#6b7280", fontFamily: "inherit", transition: "all 0.15s" }),
    body: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "22px 24px" },
    bodyFull: { padding: "22px 24px" },
    card: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 },
    cardTitle: { fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
    label: { fontSize: 11, fontWeight: 600, letterSpacing: "0.4px", color: "#6b7280", display: "block", marginBottom: 5, textTransform: "uppercase" },
    input: { width: "100%", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 12px", fontSize: 13, color: "#111827", fontFamily: "inherit", outline: "none", marginBottom: 12, boxSizing: "border-box" },
    textarea: { width: "100%", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 7, padding: "9px 12px", fontSize: 12.5, color: "#111827", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", outline: "none", resize: "vertical", lineHeight: 1.7, marginBottom: 12, boxSizing: "border-box" },
    btnPrimary: { background: "#e05a2b", color: "white", border: "none", borderRadius: 7, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 },
    btnSecondary: { background: "#ffffff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 },
    btnDanger: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" },
    btnRow: { display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" },
    packTabs: { display: "flex", gap: 6, marginBottom: 12 },
    packTab: (a) => ({ padding: "5px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${a ? "#e05a2b" : "#d1d5db"}`, background: a ? "#fff1ec" : "transparent", color: a ? "#e05a2b" : "#9ca3af" }),
    pill: (s) => {
      const c = { sent: ["#dcfce7","#16a34a"], failed: ["#fee2e2","#dc2626"], pending: ["#f3f4f6","#6b7280"], sending: ["#dbeafe","#2563eb"], scheduled: ["#e0e7ff","#4f46e5"] }[s] || ["#f3f4f6","#6b7280"];
      return { background: c[0], color: c[1], fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, display: "inline-block" };
    },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
    th: { textAlign: "left", padding: "9px 12px", background: "#f9fafb", color: "#9ca3af", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" },
    td: { padding: "10px 12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" },
    alert: (t) => {
      const c = { info: ["#eff6ff","#1d4ed8","#bfdbfe"], success: ["#f0fdf4","#16a34a","#bbf7d0"], warn: ["#fffbeb","#d97706","#fde68a"], error: ["#fef2f2","#dc2626","#fecaca"] }[t] || ["#f9fafb","#6b7280","#e5e7eb"];
      return { background: c[0], color: c[1], border: `1px solid ${c[2]}`, borderRadius: 7, padding: "10px 14px", fontSize: 12.5, marginBottom: 14, display: "flex", gap: 8 };
    },
    progress: { height: 4, background: "#e5e7eb", borderRadius: 4, overflow: "hidden", margin: "10px 0" },
    progressFill: (p) => ({ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,#e05a2b,#f08040)", borderRadius: 4, transition: "width 0.4s" }),
    statGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 },
    statCard: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px" },
    statNum: { fontFamily: "'Playfair Display',serif", fontSize: 32, letterSpacing: -1, lineHeight: 1, color: "#111827" },
    row: { display: "flex", gap: 12 }, flex1: { flex: 1 },
    checkRow: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#374151", cursor: "pointer", marginBottom: 7 },
    toast: (show, type) => ({
      position: "fixed", bottom: 20, right: 20,
      background: type === "success" ? "#f0fdf4" : type === "error" ? "#fef2f2" : type === "warn" ? "#fffbeb" : "#ffffff",
      color: type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : type === "warn" ? "#d97706" : "#111827",
      border: `1px solid ${type === "success" ? "#bbf7d0" : type === "error" ? "#fecaca" : type === "warn" ? "#fde68a" : "#e5e7eb"}`,
      padding: "11px 18px", borderRadius: 9, fontSize: 13, fontWeight: 500, zIndex: 9999,
      opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)", transition: "all 0.3s",
      maxWidth: 320, pointerEvents: "none",
    }),
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={S.wrap}>
        <div style={S.header}>
          <div style={S.logo}>korel<span style={S.logoAccent}>.</span>send</div>
          <div style={S.badge}><span>●</span> Gmail connected</div>
        </div>

        <nav style={S.nav}>
          {[["korel","🔗 Korel API"],["compose","✍️ Compose"],["bulk","📋 Bulk Send"],["schedule","📅 Schedule"],["tracking","📊 Tracking"]].map(([id, label]) => (
            <button key={id} style={S.navBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>

        {/* KOREL API TAB */}
        {tab === "korel" && (
          <div style={S.body}>
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>🔗 Korel API Connection</div>
                <label style={S.checkRow}>
                  <input type="checkbox" checked={korelMockMode} onChange={(e) => { setKorelMockMode(e.target.checked); setKorelAuthed(false); setKorelToken(null); setKorelPacks([]); }} />
                  Mock mode (test without live API)
                </label>
                {!korelMockMode && (
                  <>
                    <label style={S.label}>OAuth Client ID</label>
                    <input style={S.input} value={korelClientId} onChange={(e) => setKorelClientId(e.target.value)} />
                    <label style={S.label}>OAuth Client Secret</label>
                    <input style={S.input} type="password" value={korelClientSecret} onChange={(e) => setKorelClientSecret(e.target.value)} />
                  </>
                )}
                <button style={{ ...S.btnPrimary, opacity: korelAuthLoading ? 0.6 : 1 }} disabled={korelAuthLoading} onClick={korelAuth}>
                  {korelAuthLoading ? "⏳ Authenticating…" : korelAuthed ? "↺ Re-auth" : "🔐 Authenticate"}
                </button>
                {korelAuthed && <div style={{ ...S.alert("success"), marginTop: 12 }}>✅ Connected {korelMockMode ? "(mock)" : "to usekorel.com"}</div>}
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>📖 API Contract</div>
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 2, fontFamily: "monospace" }}>
                  <div style={{ color: "#e05a2b" }}>POST /oauth/token</div>
                  <div style={{ color: "#e05a2b" }}>GET  /api/v1/packs</div>
                  <div style={{ color: "#e05a2b" }}>GET  /api/v1/packs/:id</div>
                  <div style={{ color: "#e05a2b" }}>GET  /api/v1/packs?client_email=</div>
                  <br/>
                  <div style={{ color: "#6b7280" }}>Response: {"{ project_id, client_name,"}</div>
                  <div style={{ color: "#6b7280" }}>{"  client_email, company,"}</div>
                  <div style={{ color: "#6b7280" }}>{"  linkedin_post, twitter_post,"}</div>
                  <div style={{ color: "#6b7280" }}>{"  newsletter, created_at }"}</div>
                </div>
              </div>
            </div>
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>🔍 Fetch Packs</div>
                <div style={S.packTabs}>
                  {[["list","All"],["project_id","By ID"],["email","By Email"]].map(([v, l]) => (
                    <div key={v} style={S.packTab(korelLookupType === v)} onClick={() => setKorelLookupType(v)}>{l}</div>
                  ))}
                </div>
                {korelLookupType !== "list" && <input style={S.input} value={korelLookupVal} onChange={(e) => setKorelLookupVal(e.target.value)} placeholder={korelLookupType === "project_id" ? "proj_001" : "email@co.com"} />}
                <div style={S.btnRow}>
                  <button style={{ ...S.btnPrimary, opacity: (!korelAuthed || korelPacksLoading) ? 0.6 : 1 }} disabled={!korelAuthed || korelPacksLoading} onClick={korelFetch}>
                    {korelPacksLoading ? "⏳" : "Fetch →"}
                  </button>
                  {korelPacks.length > 1 && <button style={S.btnSecondary} onClick={() => korelLoadIntoBulk(korelPacks)}>📋 All → Bulk ({korelPacks.length})</button>}
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>📦 Packs <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{korelPacks.length}</span></div>
                {!korelPacks.length
                  ? <div style={{ color: "#9ca3af", fontSize: 12.5, textAlign: "center", padding: "24px 0" }}>{korelAuthed ? "Click Fetch" : "Authenticate first"}</div>
                  : korelPacks.map((pack) => (
                    <div key={pack.project_id} style={{ background: korelSelectedPack?.project_id === pack.project_id ? "#fff7ed" : "#ffffff", border: `1px solid ${korelSelectedPack?.project_id === pack.project_id ? "#fdba74" : "#e5e7eb"}`, borderRadius: 9, padding: "12px 14px", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{pack.client_name}</div>
                          <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>{pack.client_email} · {pack.company}</div>
                          <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>ID: {pack.project_id}</div>
                          <div style={{ display: "flex", gap: 4, marginTop: 7, flexWrap: "wrap" }}>
                            {pack.linkedin_post && <span style={S.pill("sent")}>💼 LinkedIn</span>}
                            {pack.twitter_post && <span style={S.pill("sending")}>𝕏 Post</span>}
                            {pack.newsletter && <span style={S.pill("scheduled")}>📰 Newsletter</span>}
                          </div>
                        </div>
                        <button style={{ ...S.btnPrimary, fontSize: 11.5, padding: "6px 12px" }} onClick={() => korelLoadIntoCompose(pack)}>Load →</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* COMPOSE TAB */}
        {tab === "compose" && (
          <div style={S.body}>
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>
                  📦 Content Pack
                  <span style={{ background: "#e05a2b22", color: "#e05a2b", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>from Korel</span>
                  {korelSelectedPack && <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>✅ {korelSelectedPack.project_id}</span>}
                  <button style={{ marginLeft: "auto", background: "none", border: "none", color: "#6b7280", fontSize: 11, cursor: "pointer" }} onClick={() => setTab("korel")}>← API</button>
                </div>
                <div style={S.packTabs}>
                  {[["linkedin","💼 LinkedIn"],["twitter","𝕏 Post"],["newsletter","📰 Newsletter"]].map(([id, label]) => (
                    <div key={id} style={S.packTab(packTab === id)} onClick={() => setPackTab(id)}>{label}</div>
                  ))}
                </div>
                {packTab === "linkedin" && <textarea style={{ ...S.textarea, minHeight: 160 }} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn post from Korel…" />}
                {packTab === "twitter" && <textarea style={{ ...S.textarea, minHeight: 160 }} value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="X post…" />}
                {packTab === "newsletter" && <textarea style={{ ...S.textarea, minHeight: 160 }} value={newsletter} onChange={(e) => setNewsletter(e.target.value)} placeholder="Newsletter content…" />}
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>📨 Recipient</div>
                <div style={S.row}>
                  <div style={S.flex1}><label style={S.label}>Name</label><input style={S.input} value={recipName} onChange={(e) => setRecipName(e.target.value)} placeholder="Alex" /></div>
                  <div style={S.flex1}><label style={S.label}>Email</label><input style={S.input} value={recipEmail} onChange={(e) => setRecipEmail(e.target.value)} placeholder="alex@co.com" /></div>
                </div>
                <label style={S.label}>Company</label>
                <input style={S.input} value={recipCompany} onChange={(e) => setRecipCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
            </div>
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>✉️ Email Settings</div>
                <label style={S.label}>Subject</label>
                <input style={S.input} value={subject} onChange={(e) => setSubject(e.target.value)} />
                <label style={S.label}>Personal Note</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }} value={note} onChange={(e) => setNote(e.target.value)} />
                <label style={S.label}>Include</label>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.checkRow}><input type="checkbox" checked={incLinkedin} onChange={(e) => setIncLinkedin(e.target.checked)} /> LinkedIn Post</label>
                  <label style={S.checkRow}><input type="checkbox" checked={incTwitter} onChange={(e) => setIncTwitter(e.target.checked)} /> X Post</label>
                  <label style={S.checkRow}><input type="checkbox" checked={incNewsletter} onChange={(e) => setIncNewsletter(e.target.checked)} /> Newsletter</label>
                </div>
                <div style={S.btnRow}>
                  <button style={S.btnSecondary} onClick={doPreview}>👁 Preview</button>
                  <button style={{ ...S.btnPrimary, opacity: sending ? 0.6 : 1 }} disabled={sending} onClick={doSend}>
                    {sending ? "⏳ Sending…" : "Send via Gmail →"}
                  </button>
                </div>
              </div>
              {preview && (
                <div style={S.card}>
                  <div style={S.cardTitle}>👁 Preview</div>
                  <div style={{ background: "#f9fafb", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "8px 14px", fontSize: 11.5, color: "#6b7280", display: "flex", gap: 12 }}>
                      <span><b style={{ color: "#374151" }}>To:</b> {preview.to}</span>
                    </div>
                    <div style={{ padding: 16, fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>{preview.body}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BULK TAB */}
        {tab === "bulk" && (
          <div style={S.body}>
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>📁 Upload Recipients CSV</div>
                <div style={{ border: "2px dashed #d1d5db", borderRadius: 8, padding: 22, textAlign: "center", cursor: "pointer", background: "#f9fafb", marginBottom: 12 }}
                  onClick={() => document.getElementById("csvInput").click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; const r = new FileReader(); r.onload = (ev) => { setRecipients(parseCSV(ev.target.result)); setBulkProgress(0); showToast("✅ CSV loaded"); }; r.readAsText(f); }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                  <div style={{ fontSize: 12.5, color: "#9ca3af" }}>Click to upload or drag & drop CSV</div>
                </div>
                <input id="csvInput" type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const r = new FileReader(); r.onload = (ev) => { setRecipients(parseCSV(ev.target.result)); setBulkProgress(0); showToast("✅ CSV loaded"); }; r.readAsText(e.target.files[0]); }} />
                <div style={S.btnRow}>
                  <button style={S.btnSecondary} onClick={() => { setRecipients(MOCK_PACKS.map((p) => ({ id: p.project_id, first_name: p.client_name.split(" ")[0], email: p.client_email, company: p.company, linkedin_post: p.linkedin_post, twitter_post: p.twitter_post, newsletter: p.newsletter, status: "pending" }))); setBulkProgress(0); showToast("📋 Sample loaded"); }}>Sample</button>
                  <button style={S.btnSecondary} onClick={() => { const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent("first_name,email,company,linkedin_post,twitter_post,newsletter\nJohn,john@example.com,Acme,,,\n"); a.download = "korel-recipients.csv"; a.click(); }}>⬇ Template</button>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>📦 Fallback Pack</div>
                <label style={S.label}>LinkedIn</label><textarea style={{ ...S.textarea, minHeight: 70 }} value={bulkLinkedin} onChange={(e) => setBulkLinkedin(e.target.value)} placeholder="Default LinkedIn…" />
                <label style={S.label}>X Post</label><textarea style={{ ...S.textarea, minHeight: 50 }} value={bulkTwitter} onChange={(e) => setBulkTwitter(e.target.value)} placeholder="Default X post…" />
                <label style={S.label}>Newsletter</label><textarea style={{ ...S.textarea, minHeight: 70 }} value={bulkNewsletter} onChange={(e) => setBulkNewsletter(e.target.value)} placeholder="Default newsletter…" />
              </div>
            </div>
            <div>
              <div style={S.card}>
                <div style={{ ...S.cardTitle, justifyContent: "space-between" }}>📋 Recipients <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{recipients.length}</span></div>
                <div style={{ overflowY: "auto", maxHeight: 230, borderRadius: 7, border: "1px solid #e5e7eb" }}>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Name</th><th style={S.th}>Email</th><th style={S.th}>Status</th></tr></thead>
                    <tbody>
                      {!recipients.length ? <tr><td colSpan={3} style={{ ...S.td, textAlign: "center", color: "#9ca3af", padding: 20 }}>No recipients</td></tr>
                        : recipients.map((r, i) => <tr key={r.id || i}><td style={S.td}>{r.first_name || "—"}</td><td style={{ ...S.td, fontSize: 11.5, color: "#666" }}>{r.email}</td><td style={S.td}><span style={S.pill(r.status)}>{r.status}</span></td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>⚙️ Send Settings</div>
                <label style={S.label}>Subject</label>
                <input style={S.input} value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} />
                <label style={S.label}>Delay between sends (sec)</label>
                <input type="number" style={{ ...S.input, width: 100 }} value={bulkDelay} onChange={(e) => setBulkDelay(Number(e.target.value))} min={2} max={60} />
                {bulkRunning && <><div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 4 }}>Sending… {bulkProgress}%</div><div style={S.progress}><div style={S.progressFill(bulkProgress)} /></div></>}
                <div style={S.btnRow}>
                  {!bulkRunning ? <button style={S.btnPrimary} onClick={startBulk}>🚀 Start Bulk Send</button> : <button style={S.btnDanger} onClick={() => { bulkStopRef.current = true; setBulkRunning(false); }}>⏹ Stop</button>}
                  <button style={S.btnSecondary} onClick={() => { setRecipients((r) => r.map((x) => ({ ...x, status: "pending" }))); setBulkProgress(0); }}>↺ Reset</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {tab === "schedule" && (
          <div style={S.body}>
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>📅 Schedule Send</div>
                <div style={S.alert("info")}>⏰ Keep this tab open — sends fire when the time arrives.</div>
                <div style={S.row}>
                  <div style={S.flex1}><label style={S.label}>Name</label><input style={S.input} value={schedRecipName} onChange={(e) => setSchedRecipName(e.target.value)} /></div>
                  <div style={S.flex1}><label style={S.label}>Email</label><input style={S.input} value={schedRecipEmail} onChange={(e) => setSchedRecipEmail(e.target.value)} /></div>
                </div>
                <label style={S.label}>Subject</label><input style={S.input} value={schedSubject} onChange={(e) => setSchedSubject(e.target.value)} />
                <label style={S.label}>LinkedIn</label><textarea style={{ ...S.textarea, minHeight: 70 }} value={schedLinkedin} onChange={(e) => setSchedLinkedin(e.target.value)} />
                <label style={S.label}>X Post</label><textarea style={{ ...S.textarea, minHeight: 50 }} value={schedTwitter} onChange={(e) => setSchedTwitter(e.target.value)} />
                <label style={S.label}>Newsletter</label><textarea style={{ ...S.textarea, minHeight: 70 }} value={schedNewsletter} onChange={(e) => setSchedNewsletter(e.target.value)} />
                <div style={S.row}>
                  <div style={S.flex1}><label style={S.label}>Date</label><input type="date" style={S.input} value={schedDate} onChange={(e) => setSchedDate(e.target.value)} /></div>
                  <div style={S.flex1}><label style={S.label}>Time</label><input type="time" style={S.input} value={schedTime} onChange={(e) => setSchedTime(e.target.value)} /></div>
                </div>
                <button style={S.btnPrimary} onClick={addSchedule}>📅 Schedule</button>
              </div>
            </div>
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>🗂 Queue <span style={{ background: "#1a2030", color: "#60a0f0", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{statScheduled}</span></div>
                {!schedules.length ? <div style={{ color: "#9ca3af", fontSize: 12.5, textAlign: "center", padding: "24px 0" }}>No schedules</div>
                  : schedules.map((s) => (
                    <div key={s.id} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.recipName} <span style={{ color: "#6b7280", fontWeight: 400, fontSize: 11.5 }}>({s.recipEmail})</span></div>
                        <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>{new Date(s.sendAt).toLocaleString()}</div>
                        <div style={{ marginTop: 5 }}><span style={S.pill(s.status)}>{s.status}</span></div>
                      </div>
                      <button style={S.btnDanger} onClick={() => setSchedules((p) => p.filter((x) => x.id !== s.id))}>✕</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TRACKING TAB */}
        {tab === "tracking" && (
          <div style={S.bodyFull}>
            <div style={S.statGrid}>
              <div style={S.statCard}><div style={S.statNum}>{history.length}</div><div style={{ fontSize: 10.5, color: "#444", marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</div></div>
              <div style={S.statCard}><div style={{ ...S.statNum, color: "#5ac86e" }}>{statSent}</div><div style={{ fontSize: 10.5, color: "#444", marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Delivered</div></div>
              <div style={S.statCard}><div style={{ ...S.statNum, color: "#e05a2b" }}>{statFailed}</div><div style={{ fontSize: 10.5, color: "#444", marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Failed</div></div>
              <div style={S.statCard}><div style={{ ...S.statNum, color: "#60a0f0" }}>{statScheduled}</div><div style={{ fontSize: 10.5, color: "#444", marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Scheduled</div></div>
            </div>
            <div style={S.card}>
              <div style={{ ...S.cardTitle, justifyContent: "space-between" }}>
                📜 Send History
                {history.length > 0 && <button style={S.btnSecondary} onClick={() => setHistory([])}>Clear</button>}
              </div>
              {!history.length
                ? <div style={{ color: "#9ca3af", fontSize: 12.5, textAlign: "center", padding: "24px 0" }}>No sends yet</div>
                : <div style={{ overflowX: "auto" }}>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Name</th><th style={S.th}>Email</th><th style={S.th}>Subject</th><th style={S.th}>Type</th><th style={S.th}>Time</th><th style={S.th}>Status</th></tr></thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td style={S.td}>{h.name}</td>
                          <td style={{ ...S.td, fontSize: 11.5, color: "#666" }}>{h.email}</td>
                          <td style={{ ...S.td, fontSize: 11.5, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.subject}</td>
                          <td style={{ ...S.td, fontSize: 11, color: "#444" }}>{h.type}</td>
                          <td style={{ ...S.td, fontSize: 11, color: "#444" }}>{h.time}</td>
                          <td style={S.td}><span style={S.pill(h.status)}>{h.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        )}

        <div style={S.toast(!!toast, toast?.type)}>{toast?.msg}</div>
      </div>
    </>
  );
}
