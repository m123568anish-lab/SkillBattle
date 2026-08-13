import React from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import WaitingBattlesClient from "@/components/battle/WaitingBattlesClient";

export default function WaitingBattlesPage() {
  return (
    <RequireAuth>
      <WaitingBattlesClient />
    </RequireAuth>
  );
}
