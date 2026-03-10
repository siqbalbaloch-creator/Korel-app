export type XPublishResult = {
  tweetId: string;
  tweetUrl: string;
};

/**
 * Truncates content to fit within X's 280-character limit.
 * Breaks at the last complete sentence before the limit.
 */
function truncateForX(content: string, limit = 280): string {
  if (content.length <= limit) return content;

  // Find the last sentence-ending punctuation before the limit
  const truncated = content.slice(0, limit);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  );

  if (lastSentenceEnd > 0) {
    return content.slice(0, lastSentenceEnd + 1).trimEnd();
  }

  // Fallback: break at last word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  return content.slice(0, lastSpace > 0 ? lastSpace : limit).trimEnd();
}

/**
 * Publishes a tweet using the X API v2.
 * Automatically truncates content that exceeds 280 characters.
 */
export async function publishToX(
  accessToken: string,
  content: string,
): Promise<XPublishResult> {
  const text = truncateForX(content);

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`X publish failed (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as { data: { id: string; text: string } };
  const tweetId = data.data.id;
  const tweetUrl = `https://twitter.com/i/web/status/${tweetId}`;

  return { tweetId, tweetUrl };
}
