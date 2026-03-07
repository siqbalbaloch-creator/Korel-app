"use client";

import KorelSend from "@/components/admin/KorelSend";

export default function KorelSendClient({
  currentUser,
}: {
  currentUser: { role: "admin"; name: string };
}) {
  return (
    // @ts-expect-error — JSX component
    <KorelSend
      adminOnly={true}
      currentUser={currentUser}
      onSendSuccess={(pack: unknown, recipient: unknown) =>
        console.log("Sent", pack, recipient)
      }
    />
  );
}
