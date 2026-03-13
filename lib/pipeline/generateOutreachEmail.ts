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

const SYSTEM_PROMPT = `You are writing short cold outreach emails on behalf of Saqib, founder of Korel. Write only the personal note — short, direct, human. No fluff, no corporate language, no extra sections.`;

function buildUserPrompt({
  founderName,
  company,
  source,
  interviewSummary,
}: OutreachEmailParams): string {
  return `Write the personal opening note of a cold outreach email from Saqib to a bootstrapped founder. Output ONLY this short note — nothing else.

Founder details:
- First Name: ${founderName}
- Company: ${company}
- Interview Source: ${source}
- Interview summary / transcript excerpt: ${interviewSummary || "(not available — keep the reference general but mention the company name)"}

EXACT STRUCTURE (output only the body, no subject line):

Hi ${founderName},

I recently watched your interview on ${source} about [their product/company in one short phrase] — really enjoyed the part where you talked about [one specific idea or moment from the interview summary, 1 sentence max].

I built a small tool called Korel that turns founder interviews and conversations into structured authority content (LinkedIn posts, X threads, newsletters, etc.).

Out of curiosity, I pasted a transcript from your interview into Korel and it generated a full content pack from it.

— Saqib

RULES:
- Fill in ONLY the bracketed placeholders using the founder details above.
- Do NOT add extra sentences, bullets, or sections after "— Saqib".
- Do NOT include any LinkedIn post, X thread, or newsletter content in this note.
- If the interview summary is sparse, keep the reference in line 2 general (e.g. "about building ${company}") but still specific enough to feel personal.`;
}

export async function generateOutreachEmail(
  params: OutreachEmailParams,
): Promise<OutreachEmailResult> {
  const subject = `I turned your ${params.source} interview into content`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(params) },
    ],
  });

  const body = completion.choices[0]?.message?.content?.trim() ?? "";

  return { subject, body };
}
