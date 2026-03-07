// ─── korelAPI.js ─────────────────────────────────────────────────────────────
// Korel content pack API client.
// Drop this into your Korel project and wire up the real endpoints
// once the backend is live. Mock mode works out of the box.
//
// API CONTRACT (implement on usekorel.com):
//
//   OAuth:
//     POST /oauth/token
//     Body: { client_id, client_secret, grant_type: "client_credentials" }
//     → { access_token, expires_in }
//
//   GET  /api/v1/packs              → { packs: Pack[] }
//   GET  /api/v1/packs/:projectId   → Pack
//   GET  /api/v1/packs?client_email → { packs: Pack[] }
//
//   Pack shape:
//   {
//     project_id:     string
//     client_name:    string
//     client_email:   string
//     company:        string
//     linkedin_post:  string
//     twitter_post:   string
//     newsletter:     string
//     created_at:     ISO string
//   }

export const KOREL_BASE = process.env.NEXT_PUBLIC_KOREL_API_URL || "https://api.usekorel.com";

export const MOCK_PACKS = [
  {
    project_id: "proj_001",
    client_name: "Sarah Chen",
    client_email: "sarah@techco.io",
    company: "TechCo",
    linkedin_post: "🎙️ Just wrapped an incredible conversation with our CTO about the future of AI in B2B sales...\n\nHere are the 3 biggest takeaways:\n\n1. AI won't replace salespeople — it'll amplify the best ones\n2. Personalisation at scale is now table stakes\n3. The companies winning are those treating data as a product\n\nFull episode dropping Thursday. Follow for updates 👇",
    twitter_post: "We just published our latest founder interview and the insights on AI-driven growth are 🔥\n\nTop quote: \"Data isn't your moat anymore — how fast you act on it is.\"\n\nThread 🧵👇",
    newsletter: "## This Week: AI, Sales & the New B2B Playbook\n\nIn this week's edition we sat down with Sarah Chen, CTO at TechCo...\n\n**1. Qualification is getting automated**\n**2. The personalisation bar has moved**\n**3. Speed > perfection**",
    created_at: "2026-03-05T10:00:00Z",
  },
  {
    project_id: "proj_002",
    client_name: "Marcus Webb",
    client_email: "marcus@growth.co",
    company: "Growth Co",
    linkedin_post: "Revenue growth isn't about more leads. It's about better conversations.\n\nAfter 200+ founder interviews, the pattern is clear:\n\n✅ Best founders listen 70% of the time\n✅ They solve problems before pitching\n✅ They follow up with value, not pressure",
    twitter_post: "Talked to 10 $10M+ ARR founders this month.\n\nEvery single one said the same thing about growth:\n\n\"We stopped chasing and started attracting.\"\n\nWhat changed? Content. Consistency. Community.",
    newsletter: "## The Growth Paradox: Why Slowing Down Scales You Faster\n\nThis week Marcus Webb of Growth Co joined us to challenge everything we think we know about B2B growth...",
    created_at: "2026-03-06T14:30:00Z",
  },
  {
    project_id: "proj_003",
    client_name: "Priya Nair",
    client_email: "priya@b2blab.com",
    company: "B2B Lab",
    linkedin_post: "The B2B buying journey now involves 6-10 stakeholders.\n\nMost founders still pitch to one person.\n\nHere's the multi-threading playbook that's working for our clients in 2026...",
    twitter_post: "Hot take: Your ICP isn't a company. It's a person inside a company who feels a specific pain at a specific moment.\n\nStop targeting logos. Start targeting situations.",
    newsletter: "## Multi-Threading Your Way to Closed-Won\n\nPriya Nair from B2B Lab breaks down the exact process for mapping buying committees...",
    created_at: "2026-03-07T09:00:00Z",
  },
];

export const korelAPI = {
  async authenticate(baseUrl, clientId, clientSecret, mockMode = false) {
    if (mockMode || clientId === "mock") {
      return { access_token: "mock_token", expires_in: 3600 };
    }
    const res = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
    });
    if (!res.ok) throw new Error(`Auth failed: ${res.status} ${res.statusText}`);
    return res.json();
  },

  async fetchPack(baseUrl, token, projectId) {
    if (token === "mock_token") {
      const pack = MOCK_PACKS.find((p) => p.project_id === projectId);
      if (!pack) throw new Error(`Pack not found: ${projectId}`);
      return pack;
    }
    const res = await fetch(`${baseUrl}/api/v1/packs/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
  },

  async fetchByEmail(baseUrl, token, email) {
    if (token === "mock_token") {
      return { packs: MOCK_PACKS.filter((p) => p.client_email === email) };
    }
    const res = await fetch(`${baseUrl}/api/v1/packs?client_email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
  },

  async listAll(baseUrl, token) {
    if (token === "mock_token") return { packs: MOCK_PACKS };
    const res = await fetch(`${baseUrl}/api/v1/packs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
  },
};
