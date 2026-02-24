import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

/**
 * Post-login role-aware redirect.
 * Admins land on /admin; regular users land on /new.
 * Used as the default callbackUrl when no explicit destination is provided.
 */
export default async function RoleRedirectPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  redirect("/new");
}
