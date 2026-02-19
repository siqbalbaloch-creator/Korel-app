import { prisma } from "./prisma";

export async function ensureDemoUser() {
  const existing = await prisma.user.findFirst({
    where: { email: "demo@korel.app" },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: "demo@korel.app",
      name: "Demo User",
    },
  });
}
