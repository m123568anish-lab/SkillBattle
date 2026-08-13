import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleDetails from "@/components/battle/BattleDetails";

interface BattleRoomPageProps {
  params: Promise<{ battleId: string }>;
}

export default async function BattleRoomPage({ params }: BattleRoomPageProps) {
  const { battleId } = await params;

  return (
    <DashboardLayout>
      <BattleDetails battleId={battleId} />
    </DashboardLayout>
  );
}
