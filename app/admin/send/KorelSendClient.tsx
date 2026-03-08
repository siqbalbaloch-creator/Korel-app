"use client";

import KorelSend from "@/components/admin/KorelSend";

type InitialPack = {
  project_id: string;
  client_name: string;
  client_email: string;
  company: string;
  linkedin_post: string;
  twitter_post: string;
  newsletter: string;
} | null;

export default function KorelSendClient({
  currentUser,
  initialPack,
}: {
  currentUser: { role: "admin"; name: string };
  initialPack?: InitialPack;
}) {
  return (
    <KorelSend
      adminOnly={true}
      currentUser={currentUser}
      initialPack={initialPack ?? undefined}
      onSendSuccess={(pack: unknown, recipient: unknown) =>
        console.log("Sent", pack, recipient)
      }
    />
  );
}
