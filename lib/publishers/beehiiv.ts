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
 * Throws if the credentials are invalid.
 */
export async function validateBeehiivCredentials(
  apiKey: string,
  publicationId: string,
): Promise<BeehiivPublication> {
  const res = await fetch(`${BEEHIIV_API}/publications/${publicationId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Invalid API key — check your Beehiiv API key.");
  }
  if (res.status === 404) {
    throw new Error("Publication not found — check your Publication ID.");
  }
  if (!res.ok) {
    throw new Error(`Beehiiv API error: ${res.status}`);
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
 */
export async function createBeehiivDraft(
  apiKey: string,
  publicationId: string,
  title: string,
  contentHtml: string,
): Promise<BeehiivPost> {
  const res = await fetch(`${BEEHIIV_API}/publications/${publicationId}/posts`, {
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

  if (res.status === 401 || res.status === 403) {
    throw new Error("Beehiiv API key rejected — reconnect your account.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Beehiiv post creation failed (${res.status}): ${text.slice(0, 200)}`);
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
