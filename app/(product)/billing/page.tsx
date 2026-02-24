import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getUserPlan } from "@/lib/getUserPlan";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const planInfo = await getUserPlan(session.user.id, { role: session.user.role });

  return <BillingClient planInfo={planInfo} />;
}
