import SystemHealthPanel from "./SystemHealthPanel";
import PlacementIntelligencePanel from "./PlacementIntelligencePanel";

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <SystemHealthPanel />
      <PlacementIntelligencePanel />
    </div>
  );
}
