import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export default async function PacksPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  redirect("/history");
}
