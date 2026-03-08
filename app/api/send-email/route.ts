import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

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
    logger.error("send-email.no-api-key");
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  logger.info("send-email.start", {
    to,
    subject,
    packId: packId ?? null,
    apiKeyPrefix: apiKey.slice(0, 8),
    mcpUrl: GMAIL_MCP_URL,
  });

  const prompt = `Send an email using Gmail with these exact details:
To: ${to}
Subject: ${subject}
Body:
${body}

Use the Gmail tool to send this email now. Do not ask for confirmation, just send it.`;

  let success = false;
  let errorMsg: string | null = null;

  try {
    const requestBody = {
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      mcp_servers: [{ type: "url", url: GMAIL_MCP_URL, name: "gmail" }],
      messages: [{ role: "user", content: prompt }],
    };

    logger.info("send-email.anthropic-request", {
      model: requestBody.model,
      mcpServers: requestBody.mcp_servers,
    });

    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04",
      },
      body: JSON.stringify(requestBody),
    });

    logger.info("send-email.anthropic-response", {
      status: res.status,
      ok: res.ok,
    });

    if (!res.ok) {
      const err = await res.text();
      errorMsg = `Anthropic API error ${res.status}: ${err}`;
      logger.error("send-email.anthropic-error", { status: res.status, body: err });
    } else {
      const data = await res.json() as {
        content?: { type: string; name?: string; input?: unknown; text?: string }[];
        stop_reason?: string;
        usage?: unknown;
      };
      const contentTypes = data.content?.map((b) => b.type) ?? [];
      const toolUsed = data.content?.some((b) => b.type === "mcp_tool_use");
      const toolNames = data.content
        ?.filter((b) => b.type === "mcp_tool_use")
        .map((b) => b.name) ?? [];
      const textBlocks = data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text) ?? [];

      logger.info("send-email.anthropic-content", {
        stopReason: data.stop_reason,
        contentTypes,
        toolUsed,
        toolNames,
        textPreview: textBlocks[0]?.slice(0, 200) ?? null,
        usage: data.usage,
      });

      if (!toolUsed) {
        errorMsg = "Gmail tool was not invoked — check MCP connection";
        logger.warn("send-email.no-tool-use", {
          contentTypes,
          textPreview: textBlocks[0]?.slice(0, 500) ?? null,
        });
      } else {
        success = true;
        logger.info("send-email.success", { to, toolNames });
      }
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Unknown error";
    logger.error("send-email.exception", { error: errorMsg });
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
