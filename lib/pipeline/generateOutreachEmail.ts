import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface OutreachEmailParams {
  founderName: string;
  company: string;
  source: string;
  interviewSummary: string;
  generatedPost: string;
}

export interface OutreachEmailResult {
  subject: string;
  body: string;
}

const SYSTEM_PROMPT = `You are writing cold outreach emails on behalf of Saqib, founder of Korel. Follow the exact structure provided — do not add any extra lines, do not use fluff or corporate language.`;

function buildUserPrompt({
  founderName,
  company,
  source,
  interviewSummary,
  generatedPost,
}: OutreachEmailParams): string {
  return `Write a cold outreach email from Saqib, founder of Korel, to a bootstrapped founder.

Founder details:
- First Name: ${founderName}
- Company: ${company}
- Interview Source: ${source} (e.g. Starter Story, Indie Hackers, Failory)
- Interview summary or transcript excerpt: ${interviewSummary || "(not available — keep the reference general but mention the company)"}
- Example LinkedIn post already generated from their interview: ${generatedPost}

Write the email in this EXACT structure — do not deviate:

1. Open with: "Hi ${founderName},"

2. One sentence referencing their specific interview and one specific idea they shared (pull from the interview summary — make it feel like you actually read it, not mass-blasted).

3. One sentence introducing Korel:
"I'm building an AI agent called Korel that runs founder content automatically."

4. One short paragraph explaining what it does when you connect an RSS feed, formatted as 4 bullet points:
- extracts latest conversations or articles
- generates LinkedIn posts, X threads, and newsletter ideas
- repurposes them into multiple variations
- lets you approve, schedule, or publish them directly

5. Transition sentence:
"Out of curiosity, I ran one of your recent interviews through it and it generated several posts from it."

6. Label "Example it produced:" followed by the generatedPost content pasted verbatim (do not summarise it).

7. One line:
"If you're curious, you can try it here (no signup needed): https://www.usekorel.com"

8. One line:
"Just drop an RSS feed and it will generate content automatically."

9. Closing line:
"Would love to know if something like this would actually be useful for founders like you."

10. Sign off:
"— Saqib"

Tone: conversational, genuine, founder-to-founder. No fluff. No corporate language.
Do not add any lines not specified above.
Do not invent specific details — only use what is provided.
If interviewSummary is sparse, keep the reference in step 2 general but still mention the company name.
Output only the email body — no subject line, no metadata.`;
}

export async function generateOutreachEmail(
  params: OutreachEmailParams,
): Promise<OutreachEmailResult> {
  const subject = `I ran your ${params.company} interview through something — here's what it made`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(params) },
    ],
  });

  const body = completion.choices[0]?.message?.content?.trim() ?? "";

  return { subject, body };
}
