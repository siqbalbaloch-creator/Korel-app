import { requireAdmin } from "@/lib/requireAdmin";
import KorelSendClient from "./KorelSendClient";

export default async function AdminSendPage() {
  const session = await requireAdmin();

  const currentUser = {
    role: "admin" as const,
    name: session.user.name ?? session.user.email ?? "Admin",
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          KorelSend
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Distribute authority packs to clients via Gmail.
        </p>
      </div>
      <KorelSendClient currentUser={currentUser} />
    </div>
  );
}
