import MainLayout from "@/components/layout/MainLayout";
import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import BattleModes from "@/components/battle/BattleModes";
import TournamentBanner from "@/components/tournament/TournamentBanner";
import AICoach from "@/components/ai/AICoach";

export default function Home() {
  return (
    <MainLayout>
      <Navbar />
      <Hero />
      <BattleModes />
      <TournamentBanner />
      <AICoach />
    </MainLayout>
  );
}