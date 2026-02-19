"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureDemoUser } from "@/lib/demo-user";
import { generateAuthorityPack as generateStructuredPack } from "@/lib/packGenerationService";

export type GeneratePackResult =
  | { status: "ok" }
  | { status: "limit" };

export async function generateAuthorityPack(
  input: string,
): Promise<GeneratePackResult> {
  const user = await ensureDemoUser();
  const packCount = await prisma.authorityPack.count({
    where: { userId: user.id },
  });

  if (packCount >= 3) {
    return { status: "limit" };
  }

  const structuredPack = await generateStructuredPack(input);

  await prisma.authorityPack.create({
    data: {
      title: `Authority Pack #${packCount + 1}`,
      originalInput: input,
      coreThesis: structuredPack.coreThesis,
      strategicHooks: structuredPack.strategicHooks,
      highLeveragePosts: structuredPack.highLeveragePosts,
      insightBreakdown: structuredPack.insightBreakdown,
      repurposingMatrix: structuredPack.repurposingMatrix,
      executiveSummary: structuredPack.executiveSummary,
      userId: user.id,
    },
  });

  return { status: "ok" };
}

export async function deletePack(id: string) {
  await prisma.authorityPack.delete({
    where: { id },
  });
  revalidatePath("/dashboard");
}
