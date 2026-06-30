import MainLayout from "@/components/layout/MainLayout";
import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";

export default function Home() {
  return (
    <MainLayout>
      <Navbar />
      <Hero />
    </MainLayout>
  );
}