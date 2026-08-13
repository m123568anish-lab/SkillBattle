import React from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import CreateBattleClient from "@/components/battle/CreateBattleClient";

export default function CreateBattlePage() {
  return (
    <RequireAuth>
      <CreateBattleClient />
    </RequireAuth>
  );
}
