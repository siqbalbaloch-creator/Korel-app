const BEEHIIV_API = "https://api.beehiiv.com/v2";

export type BeehiivPublication = {
  id: string;
  name: string;
  websiteUrl?: string;
};

export type BeehiivPost = {
  id: string;
  webUrl: string | null;
  status: string;
};

/**
 * Validate API key + publication ID and return publication metadata.
 * Throws human-readable errors on failure.
 */
export async function validateBeehiivCredentials(
  apiKey: string,
  publicationId: string,
): Promise<BeehiivPublication> {
  let res: Response;
  try {
    res = await fetch(`${BEEHIIV_API}/publications/${publicationId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch {
    throw new Error("Could not reach Beehiiv. Check your connection and try again.");
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Invalid API key. In your Beehiiv dashboard go to Settings \u2192 Integrations \u2192 API and copy the key.",
    );
  }
  if (res.status === 404) {
    throw new Error(
      "Publication not found. Copy the ID from your Beehiiv URL: app.beehiiv.com/publications/pub_xxx",
    );
  }
  if (res.status === 429) {
    throw new Error("Beehiiv rate limit hit \u2014 try again in a minute.");
  }
  if (!res.ok) {
    throw new Error(`Beehiiv returned an unexpected error (${res.status}). Try again.`);
  }

  const json = (await res.json()) as { data: { id: string; name: string; web_url?: string } };
  return {
    id: json.data.id,
    name: json.data.name,
    websiteUrl: json.data.web_url,
  };
}

/**
 * Create a draft post in Beehiiv.
 * Returns the created post's id and web URL.
 * Throws human-readable errors on failure.
 */
export async function createBeehiivDraft(
  apiKey: string,
  publicationId: string,
  title: string,
  contentHtml: string,
): Promise<BeehiivPost> {
  let res: Response;
  try {
    res = await fetch(`${BEEHIIV_API}/publications/${publicationId}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content_tags: [],
        status: "draft",
        content_html: contentHtml,
      }),
    });
  } catch {
    throw new Error("Could not reach Beehiiv. Check your connection and try again.");
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Beehiiv API key rejected. Go to Settings \u2192 Connected Accounts and reconnect Beehiiv.",
    );
  }
  if (res.status === 404) {
    throw new Error(
      "Publication not found. Go to Settings \u2192 Connected Accounts and reconnect Beehiiv with the correct Publication ID.",
    );
  }
  if (res.status === 429) {
    throw new Error("Beehiiv rate limit hit \u2014 try again in a minute.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Beehiiv returned an unexpected error (${res.status}). ${text.slice(0, 120)}`.trim(),
    );
  }

  const json = (await res.json()) as { data: { id: string; web_url?: string; status: string } };
  return {
    id: json.data.id,
    webUrl: json.data.web_url ?? null,
    status: json.data.status,
  };
}

/** Convert plain text newsletter content to simple HTML paragraphs. */
export function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}
