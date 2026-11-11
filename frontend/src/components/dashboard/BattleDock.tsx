"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Sword, Users, Play, Zap } from "lucide-react";
import { motion } from "framer-motion";

const BATTLE_MODES = [
  { id: "matchmaking", title: "Find a player", icon: Sword, desc: "Join the server-managed battle queue.", color: "from-[#D8FF3E] to-[#EAFCCB]" },
  { id: "room", title: "Create or join a room", icon: Users, desc: "Create a persisted room or join with its battle ID.", color: "from-[#151515] to-[#252525]" },
  { id: "practice", title: "Solo practice", icon: Play, desc: "Open the available individual practice workflows.", color: "from-[#D8FF3E]/30 to-[#D8FF3E]/10" }
];

const ModeCard = memo(function ModeCard({
  mode,
  isSelected,
  onSelect,
}: {
  mode: (typeof BATTLE_MODES)[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = mode.icon;
  
  return (
    <motion.button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8FF3E] ${
        isSelected
          ? "border-[#D8FF3E]/40 bg-[#101010]"
          : "border-[#252525] bg-[#0B0B0B] hover:border-[#D8FF3E]/25 hover:bg-[#101010]"
      }`}
    >
      <div className="relative z-10 space-y-3 p-4">
        <div className="flex w-full items-start justify-between">
          <div className={`rounded-xl border p-2.5 transition-colors ${
            isSelected
              ? `border-[#D8FF3E]/40 bg-gradient-to-br ${mode.color} text-[#101010]`
              : "border-[#252525] bg-[#101010] text-[#A1A1AA]"
          }`}>
            <Icon size={18} />
          </div>
          {isSelected && (
            <span className="rounded-full border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#D8FF3E]">
              Selected
            </span>
          )}
        </div>

        <div>
          <h4 className="text-sm font-black tracking-tight text-[#F5F5F5]">
            {mode.title}
          </h4>
          <p className="mt-1 text-xs leading-snug text-[#A1A1AA]">
            {mode.desc}
          </p>
        </div>
      </div>
    </motion.button>
  );
});

export default memo(function BattleDock() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState("matchmaking");

  const handleStartBattle = useCallback(() => {
    if (selectedMode === "practice") {
      router.push("/battle/solo");
    } else {
      router.push("/battle/lobby");
    }
  }, [selectedMode, router]);

  const selectedModeData = BATTLE_MODES.find(m => m.id === selectedMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[28px] border border-[#252525] bg-[#101010] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-6 flex items-center gap-3 border-b border-[#252525] pb-5"
      >
        <div className="rounded-2xl border border-[#D8FF3E]/25 bg-[#D8FF3E]/10 p-3">
          <Sword size={20} className="text-[#D8FF3E]" />
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#F5F5F5]">
            <Zap size={14} className="text-[#D8FF3E]" /> Battle Arena Modes
          </h3>
          <p className="mt-1 text-xs text-[#A1A1AA]">Choose a supported battle workflow</p>
        </div>
      </motion.div>

      <div className="relative z-10 grid items-stretch gap-4 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-3 sm:grid-cols-2 lg:col-span-8"
        >
          {BATTLE_MODES.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <ModeCard
                mode={mode}
                isSelected={selectedMode === mode.id}
                onSelect={() => setSelectedMode(mode.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col space-y-5 rounded-2xl border border-[#252525] bg-[#0B0B0B] p-5 sm:p-6 lg:col-span-4"
        >
          {selectedModeData && (
            <motion.div
              key={selectedModeData.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#252525] bg-[#101010] p-4 text-xs"
            >
              <p className="text-[#A1A1AA]">
                <span className="font-bold text-[#D8FF3E]">Selected workflow</span>
              </p>
              <p className="mt-2 text-sm font-bold text-[#F5F5F5]">{selectedModeData.title}</p>
              <p className="mt-1 leading-relaxed text-[#A1A1AA]">{selectedModeData.desc}</p>
            </motion.div>
          )}

          <button
            type="button"
            onClick={handleStartBattle}
            className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D8FF3E] px-4 py-3 text-sm font-black tracking-wide text-[#101010] transition-colors hover:bg-[#EAFCCB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8FF3E]"
          >
            <Zap size={16} />
            {selectedMode === "practice" ? "OPEN PRACTICE" : "OPEN BATTLE LOBBY"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
});
