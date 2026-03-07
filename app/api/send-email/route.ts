import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const GMAIL_MCP_URL = "https://gmail.mcp.claude.com/mcp";

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { to, subject, body } = await req.json();
  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing to, subject, or body" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const prompt = `Send an email using Gmail with these exact details:
To: ${to}
Subject: ${subject}
Body:
${body}

Use the Gmail tool to send this email now. Do not ask for confirmation, just send it.`;

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      mcp_servers: [{ type: "url", url: GMAIL_MCP_URL, name: "gmail" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Anthropic API error ${res.status}: ${err}` }, { status: 502 });
  }

  const data = await res.json();
  const toolUsed = data.content?.some((b: { type: string }) => b.type === "mcp_tool_use");
  if (!toolUsed) {
    return NextResponse.json({ error: "Gmail tool was not invoked — check MCP connection" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
