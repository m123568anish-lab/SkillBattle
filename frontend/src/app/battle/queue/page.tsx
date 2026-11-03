import { redirect } from "next/navigation";

export default function BattleQueueRedirect() {
  redirect("/battle/lobby");
}
