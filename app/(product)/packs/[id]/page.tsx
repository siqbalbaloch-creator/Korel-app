import { redirect } from "next/navigation";

type PacksRedirectParams = {
  params: Promise<{ id: string }>;
};

export default async function PacksRedirectPage({
  params,
}: PacksRedirectParams) {
  const { id } = await params;
  redirect(`/history/${id}`);
}
