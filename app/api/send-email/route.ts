import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const GMAIL_MCP_URL = "https://gmail.mcp.claude.com/mcp";

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { to, toName, subject, body, packId } = await req.json();
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

  let success = false;
  let errorMsg: string | null = null;

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04",
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
      errorMsg = `Anthropic API error ${res.status}: ${err}`;
    } else {
      const data = await res.json();
      const toolUsed = data.content?.some((b: { type: string }) => b.type === "mcp_tool_use");
      if (!toolUsed) {
        errorMsg = "Gmail tool was not invoked — check MCP connection";
      } else {
        success = true;
      }
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Unknown error";
  }

  // Log to DB if packId provided
  if (packId) {
    await prisma.packSendLog.create({
      data: {
        packId,
        recipientEmail: to,
        recipientName: toName ?? to,
        subject,
        status: success ? "sent" : "failed",
        error: errorMsg ?? undefined,
      },
    });
  }

  if (!success) {
    return NextResponse.json({ error: errorMsg }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
