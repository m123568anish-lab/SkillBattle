import MainLayout from "@/components/layout/MainLayout";
import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import BattleModes from "@/components/battle/BattleModes";

export default function Home() {
  return (
    <MainLayout>
      <Navbar />

      <Hero />

      <BattleModes />
    </MainLayout>
  );
}