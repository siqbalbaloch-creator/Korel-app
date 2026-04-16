import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getUserPlan } from "@/lib/getUserPlan";
import { prisma } from "@/lib/prisma";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const [planInfo, sub] = await Promise.all([
    getUserPlan(session.user.id, { role: session.user.role }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { paddleCustomerId: true },
    }),
  ]);

  return (
    <BillingClient
      planInfo={planInfo}
      hasPaddleCustomer={!!sub?.paddleCustomerId}
    />
  );
}
