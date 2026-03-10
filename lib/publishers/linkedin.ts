export type LinkedInPublishResult = {
  postId: string;
  postUrl: string;
};

/**
 * Publishes a text post to LinkedIn using the UGC Posts API.
 * Requires the w_member_social scope.
 */
export async function publishToLinkedIn(
  accessToken: string,
  linkedinUserId: string,
  content: string,
): Promise<LinkedInPublishResult> {
  const body = {
    author: `urn:li:person:${linkedinUserId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`LinkedIn publish failed (${res.status}): ${errorText}`);
  }

  // LinkedIn returns the post ID in the x-restli-id header
  const postId = res.headers.get("x-restli-id") ?? "";
  const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

  return { postId, postUrl };
}
