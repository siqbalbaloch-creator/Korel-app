import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { generateOutreachEmail } from "@/lib/pipeline/generateOutreachEmail";

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    founderName?: string;
    company?: string;
    source?: string;
    interviewSummary?: string;
    generatedPost?: string;
  };

  const { founderName, company, source, interviewSummary, generatedPost } = body;

  if (!founderName || !company) {
    return NextResponse.json({ error: "founderName and company are required" }, { status: 400 });
  }

  try {
    const result = await generateOutreachEmail({
      founderName,
      company,
      source: source ?? "",
      interviewSummary: interviewSummary ?? "",
      generatedPost: generatedPost ?? "",
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-email]", err);
    return NextResponse.json({ error: "Email generation failed" }, { status: 500 });
  }
}
