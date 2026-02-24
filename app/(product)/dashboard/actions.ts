"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { generateAuthorityPack as generateStructuredPack } from "@/lib/packGenerationService";

export type GeneratePackResult =
  | { status: "ok" }
  | { status: "limit" }
  | { status: "unauthorized" };

export async function generateAuthorityPack(
  input: string,
): Promise<GeneratePackResult> {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { status: "unauthorized" };
  }
  const packCount = await prisma.authorityPack.count({
    where: { userId },
  });

  if (packCount >= 3) {
    return { status: "limit" };
  }

  const structuredPack = await generateStructuredPack(input);

  await prisma.authorityPack.create({
    data: {
      title: `Authority Pack #${packCount + 1}`,
      originalInput: input,
      userId,
      coreThesis: structuredPack.coreThesis,
      strategicHooks: structuredPack.strategicHooks,
      highLeveragePosts: structuredPack.highLeveragePosts,
      insightBreakdown: structuredPack.insightBreakdown,
      repurposingMatrix: structuredPack.repurposingMatrix,
      executiveSummary: structuredPack.executiveSummary,
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
