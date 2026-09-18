"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Sword, Users, Play, Code2, ShieldAlert, Zap } from "lucide-react";
import { motion } from "framer-motion";
import GradientButton from "@/components/ui/gradient-button";

const BATTLE_MODES = [
  { id: "1v1-ranked", title: "1v1 Ranked Match", icon: Sword, desc: "High stakes competitive coding battle", duration: "15 min", xp: "+120 XP", color: "from-rose-500 to-pink-600" },
  { id: "1v1-casual", title: "Casual Duel", icon: Users, desc: "Play casually against matches", duration: "10 min", xp: "+60 XP", color: "from-violet-500 to-purple-600" },
  { id: "friend", title: "Friend Challenge", icon: Code2, desc: "Invite a custom friend to battle", duration: "Custom", xp: "+80 XP", color: "from-amber-500 to-orange-600" },
  { id: "practice", title: "Solo Practice", icon: Play, desc: "Solve practice tasks at your own pace", duration: "Unlimited", xp: "+30 XP", color: "from-emerald-500 to-teal-600" }
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
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`text-left rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden group ${
        isSelected
          ? "border-cyan-500 bg-gradient-to-br from-cyan-500/15 to-cyan-600/5 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          : "border-white/10 bg-gradient-to-br from-white/5 to-white/0 hover:border-white/20 hover:bg-white/[0.08]"
      }`}
    >
      {/* Animated glow on hover */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400 to-transparent rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-3xl" />

      {/* Card content */}
      <div className="p-4 relative z-10 space-y-3">
        <div className="flex justify-between items-start w-full">
          <div className={`rounded-xl p-2.5 border transition-all ${
            isSelected
              ? `border-cyan-400/50 text-white bg-gradient-to-br ${mode.color}`
              : "border-white/10 text-slate-400 bg-white/5 group-hover:text-slate-300"
          }`}>
            <Icon size={18} />
          </div>
          <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-full transition-all ${
            isSelected
              ? "text-cyan-300 bg-cyan-500/20"
              : "text-slate-500 bg-white/5"
          }`}>
            {mode.duration}
          </span>
        </div>

        <div>
          <h4 className={`text-sm font-black tracking-tight transition-colors ${
            isSelected ? "text-white" : "text-slate-200 group-hover:text-white"
          }`}>
            {mode.title}
          </h4>
          <p className={`text-xs leading-snug mt-1 line-clamp-2 transition-colors ${
            isSelected
              ? "text-cyan-200/70"
              : "text-slate-400 group-hover:text-slate-300"
          }`}>
            {mode.desc}
          </p>
        </div>

        {/* XP reward badge */}
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg w-fit transition-all ${
          isSelected
            ? "bg-cyan-500/25 text-cyan-200"
            : "bg-white/5 text-slate-400 group-hover:bg-white/10"
        }`}>
          <Zap size={12} />
          {mode.xp}
        </div>
      </div>
    </motion.button>
  );
});

export default memo(function BattleDock() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState("1v1-ranked");
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("python");

  const handleStartBattle = useCallback(() => {
    if (selectedMode === "practice") {
      router.push("/battle/solo");
    } else {
      router.push(`/battle?mode=${selectedMode}&difficulty=${difficulty}&lang=${language}`);
    }
  }, [selectedMode, difficulty, language, router]);

  const selectedModeData = BATTLE_MODES.find(m => m.id === selectedMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F172A]/40 via-[#070B14]/60 to-[#050816]/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden"
    >
      {/* Gradient overlays */}
      <div className="absolute bottom-0 left-1/4 h-32 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 h-40 w-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 flex items-center gap-3 relative z-10"
      >
        <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
          <Sword size={20} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Zap size={14} className="animate-pulse" /> Battle Arena Modes
          </h3>
          <p className="text-xs text-slate-400 mt-1">Select your battle format and start competing</p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12 items-stretch relative z-10">
        {/* Mode Selector Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 grid gap-3 sm:grid-cols-2"
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

        {/* Quick Settings Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-950/40 p-5 sm:p-6 space-y-5 flex flex-col"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full text-sm font-semibold rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
            >
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Programming Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full text-sm font-semibold rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
            >
              <option value="python">🐍 Python</option>
              <option value="javascript">⚡ JavaScript</option>
              <option value="cpp">⚙️ C++</option>
              <option value="java">☕ Java</option>
            </select>
          </div>

          {/* Mode info card */}
          {selectedModeData && (
            <motion.div
              key={selectedModeData.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 p-3 text-xs"
            >
              <p className="text-slate-300">
                <span className="font-bold text-cyan-300">Selected:</span> {selectedModeData.title}
              </p>
              <p className="text-slate-400 mt-1">{selectedModeData.desc}</p>
            </motion.div>
          )}

          <GradientButton onClick={handleStartBattle} fullWidth className="mt-auto">
            <span className="flex items-center justify-center gap-2 font-black text-sm tracking-wide">
              <Zap size={16} />
              START BATTLE
            </span>
          </GradientButton>
        </motion.div>
      </div>
    </motion.div>
  );
});

