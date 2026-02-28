import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getUserPlan } from "@/lib/getUserPlan";
import UpgradeClient from "./UpgradeClient";

export default async function UpgradePage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const planInfo = await getUserPlan(session.user.id, { role: session.user.role });

  return <UpgradeClient planInfo={planInfo} />;
}
