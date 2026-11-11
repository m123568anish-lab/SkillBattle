"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sword,
  Users,
  ArrowRight,
} from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";

export default function BattleArenaCard() {
  const router = useRouter();

  const handleEnterBattle = () => {
    router.push("/battle");
  };

  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.01,
      }}
      className="rounded-3xl border border-[#252525] bg-[#101010] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 p-4">
          <Sword size={34} className="text-[#D8FF3E]" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#F5F5F5]">Battle Arena</h2>
          <p className="text-[#A1A1AA]">Challenge other developers.</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#252525] bg-[#050505] p-6">
        <div className="flex items-center gap-3">
          <Users className="text-[#D8FF3E]" size={22} />
          <span className="font-semibold text-[#F5F5F5]">Competitive modes</span>
        </div>

        <p className="mt-4 leading-7 text-[#A1A1AA]">
          Practice solo or join an available multiplayer lobby. Your results are saved to your battle history.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/battle/solo")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D8FF3E] px-5 py-3 font-bold text-[#101010] transition hover:bg-[#EAFCCB]"
        >
          ⚡ Solo Battle (Coding & MCQs)
        </button>

        <GradientButton onClick={handleEnterBattle}>
          Multiplayer
          <ArrowRight size={18} className="ml-2" />
        </GradientButton>
      </div>
    </motion.div>
  );
}