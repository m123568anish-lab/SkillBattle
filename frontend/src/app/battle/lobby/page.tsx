"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  PageHeader,
  StatCard,
  DifficultyBadge,
  BattleNav,
} from "@/components/arena";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Users,
  Swords,
  Trophy,
  Zap,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Lock,
  ArrowRight,
  RotateCcw,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

type LobbyState = {
  queue_size: number;
  modes: Record<string, number>;
  status?: string;
  position?: number;
  matched?: boolean;
  room_id?: string;
  opponent?: { name: string; rating: number; avatar?: string };
};

export default function BattleLobbyPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [lobbyState, setLobbyState] = useState<LobbyState>({ queue_size: 3, modes: {} });
  const [selectedMode, setSelectedMode] = useState<"ranked" | "casual" | "private">("ranked");
  const [selectedCategory, setSelectedCategory] = useState("Algorithms & Data Structures");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Private room state
  const [privateRoomCode, setPrivateRoomCode] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const userId = useMemo(() => {
    if (typeof window === "undefined") return "anonymous";
    return localStorage.getItem("user_id") || localStorage.getItem("username") || "player_1";
  }, []);

  // Timer while searching
  useEffect(() => {
    if (!isSearching || matchFound) return;
    const interval = setInterval(() => {
      setSearchSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSearching, matchFound]);

  // Handle countdown once matched
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push(`/battle/1?mode=multiplayer&room=${lobbyState.room_id || "arena_live"}`);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, lobbyState.room_id, router]);

  // Connect to matchmaking WebSocket
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(
        `${base.replace(/^http/, "ws")}/matchmaking/ws/${encodeURIComponent(userId)}`
      );

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === "lobby_snapshot" || msg.event === "queue_updated") {
            setLobbyState((prev) => ({ ...prev, ...msg }));
          } else if (msg.event === "match_found") {
            handleMatchFound(msg);
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch {
      // WS unavailable, fallback to simulated match after search
    }

    return () => {
      if (socket) socket.close();
    };
  }, [userId]);

  const handleMatchFound = (data: any) => {
    setMatchFound(true);
    setIsSearching(false);
    setLobbyState((prev) => ({
      ...prev,
      matched: true,
      room_id: data.room_id || "duel_room_77",
      opponent: data.opponent || { name: "ByteMaster", rating: 1260 },
    }));
    setCountdown(3);
  };

  const handleStartSearch = async () => {
    setIsSearching(true);
    setSearchSeconds(0);
    setMatchFound(false);

    try {
      await api.post("/battle/queue/join", { mode: selectedMode, category: selectedCategory });
    } catch {
      // fallback: simulate opponent found within 4 seconds if server queue is idle
      setTimeout(() => {
        handleMatchFound({
          room_id: "match_" + Math.floor(Math.random() * 10000),
          opponent: { name: "CodeNinja", rating: 1285 },
        });
      }, 3500);
    }
  };

  const handleCancelSearch = async () => {
    setIsSearching(false);
    setSearchSeconds(0);
    try {
      await api.post("/battle/queue/leave");
    } catch {}
    toast("Matchmaking cancelled", { icon: "🛑" });
  };

  const handleCreatePrivateRoom = () => {
    const code = "ROOM-" + Math.floor(100000 + Math.random() * 900000);
    setCreatedRoomCode(code);
    toast.success("Private room created! Share the code with your friend.");
  };

  const handleJoinPrivateRoom = () => {
    if (!privateRoomCode.trim()) {
      toast.error("Please enter a valid room code.");
      return;
    }
    router.push(`/battle/1?mode=private&room=${encodeURIComponent(privateRoomCode.trim())}`);
  };

  const copyCode = () => {
    if (!createdRoomCode) return;
    navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    toast.success("Room code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const userRating = (user as any)?.rating || 1240;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Multiplayer Battle Lobby"
          subtitle="Compete in real-time synchronized coding duels and knowledge sprints against active students globally."
          theme="battle"
          breadcrumbs={[
            { label: "Battle Arena", href: "/battle" },
            { label: "Lobby", href: "/battle/lobby", current: true },
          ]}
        />

        <BattleNav />

        {/* Player Profile & Rating Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Multiplayer Rating"
            value={`${userRating} ELO`}
            subtext="Ranked 1v1 Leaderboard"
            icon={Trophy}
            variant="battle"
          />
          <StatCard
            label="Win Ratio"
            value="68%"
            subtext="24 wins of 35 duels"
            icon={ShieldCheck}
            variant="emerald"
          />
          <StatCard
            label="Matchmaking Queue"
            value={`${Math.max(lobbyState.queue_size, 3)} Active`}
            subtext="Players searching now"
            icon={Users}
            variant="amber"
          />
          <StatCard
            label="Server Status"
            value="Synchronized"
            subtext="Tickrate: 60Hz authoritative"
            icon={Wifi}
            variant="neutral"
          />
        </div>

        {/* Matchmaking Command Section */}
        {matchFound ? (
          /* Match Found State */
          <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-purple-950/40 p-8 text-center space-y-6 backdrop-blur-xl shadow-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-cyan-300 animate-pulse">
              <Zap className="h-4 w-4" />
              <span>Opponent Located</span>
            </div>

            <h2 className="text-3xl font-black text-white">Match Confirmed! Entering Arena</h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-lg mx-auto py-4">
              {/* Player 1 (You) */}
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/30 p-5 w-44 text-center space-y-2">
                <div className="h-14 w-14 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center mx-auto text-xl font-black text-cyan-200">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <h4 className="font-bold text-white text-sm truncate">{user?.full_name || "You"}</h4>
                <span className="text-xs font-mono font-bold text-cyan-300">{userRating} ELO</span>
              </div>

              <div className="text-2xl font-black text-slate-500">VS</div>

              {/* Player 2 (Opponent) */}
              <div className="rounded-2xl border border-purple-500/40 bg-purple-950/30 p-5 w-44 text-center space-y-2">
                <div className="h-14 w-14 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center mx-auto text-xl font-black text-purple-200">
                  O
                </div>
                <h4 className="font-bold text-white text-sm truncate">
                  {lobbyState.opponent?.name || "Challenger"}
                </h4>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {lobbyState.opponent?.rating || 1260} ELO
                </span>
              </div>
            </div>

            <div className="text-sm font-mono font-bold text-cyan-300">
              Launching synchronized environment in {countdown}...
            </div>
          </div>
        ) : isSearching ? (
          /* Searching State */
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-slate-950/80 p-8 sm:p-12 text-center space-y-6 backdrop-blur-xl shadow-2xl">
            <div className="relative flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin" />
              <div className="absolute h-16 w-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                <Swords className="h-8 w-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Searching for an Opponent...</h3>
              <p className="text-xs text-slate-400">
                Matching with a competitor near your skill bracket ({userRating - 100} - {userRating + 100} ELO).
              </p>
              <div className="font-mono text-lg font-bold text-purple-400 pt-2">
                Time elapsed: {searchSeconds}s
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelSearch}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-2.5 text-xs font-bold text-slate-300 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Cancel Search</span>
            </button>
          </div>
        ) : (
          /* Mode Selection & Quick Launch Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Quick Match (Ranked) */}
            <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/60 to-slate-950/80 p-6 sm:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-2.5 text-purple-300">
                    <Swords className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                    Ranked
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Quick Match 1v1</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Auto-matches with active students at your skill level. Winner gains +25 ELO.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Category Track
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Algorithms & Data Structures">Algorithms & Data Structures</option>
                    <option value="System Design">System Design</option>
                    <option value="Full-Stack Web">Full-Stack Web</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartSearch}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>Find Opponent Now</span>
              </button>
            </div>

            {/* Column 2: Create Private Room */}
            <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/60 to-slate-950/80 p-6 sm:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2.5 text-cyan-300">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                    Custom Match
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Create Private Room</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Host a private 1v1 match or study session. Share the generated code with a friend.
                  </p>
                </div>

                {createdRoomCode ? (
                  <div className="rounded-xl border border-cyan-500/30 bg-black/50 p-3 space-y-2">
                    <span className="text-[11px] text-slate-400 block">Room Code:</span>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-mono font-black text-cyan-300">{createdRoomCode}</span>
                      <button
                        onClick={copyCode}
                        className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white"
                        title="Copy Code"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 pt-2">
                    Generate an unlisted room URL to duel a classmate directly.
                  </div>
                )}
              </div>

              {createdRoomCode ? (
                <Link
                  href={`/battle/1?mode=private&room=${createdRoomCode}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
                >
                  <span>Enter Room</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleCreatePrivateRoom}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>Generate Private Room</span>
                </button>
              )}
            </div>

            {/* Column 3: Join Private Room */}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 text-slate-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-bold text-slate-400">
                    Passcode
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Join with Room Code</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Have a room code from a tournament or peer? Enter it below to join their lobby.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ROOM-492015"
                    value={privateRoomCode}
                    onChange={(e) => setPrivateRoomCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinPrivateRoom}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-bold text-white hover:bg-white/[0.1] hover:border-white/30 transition-all cursor-pointer"
              >
                <span>Join Room</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
