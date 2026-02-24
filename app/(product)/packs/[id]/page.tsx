import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

type PacksRedirectParams = {
  params: Promise<{ id: string }>;
};

export default async function PacksRedirectPage({
  params,
}: PacksRedirectParams) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const { id } = await params;
  redirect(`/history/${id}`);
}
