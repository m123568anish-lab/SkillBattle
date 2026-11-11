"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  PageHeader,
  StatCard,
  BattleNav,
} from "@/components/arena";
import { api } from "@/lib/api";
import {
  Swords,
  Zap,
  UserPlus,
  Lock,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

type LobbyState = {
  queue_size: number | null;
  status?: string;
  position?: number;
  matched?: boolean;
  battle_id?: string;
};

export default function BattleLobbyPage() {
  const router = useRouter();

  const [lobbyState, setLobbyState] = useState<LobbyState>({ queue_size: null });
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [selectedQuestionType, setSelectedQuestionType] = useState<"mcq" | "coding">("mcq");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);

  const [roomIdInput, setRoomIdInput] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadQueueStatus = useCallback(async () => {
    const response = await api.get<LobbyState>("/battle/queue/status");
    const status = response.data;
    setLobbyState((previous) => ({ ...previous, ...status }));
    setQueueError(null);
    if (status.matched && status.battle_id) {
      setIsSearching(false);
      router.push(`/battle/${encodeURIComponent(status.battle_id)}`);
    }
    return status;
  }, [router]);

  useEffect(() => {
    void loadQueueStatus()
      .catch(() => setQueueError("Unable to load live matchmaking status."))
      .finally(() => setQueueLoading(false));
  }, [loadQueueStatus]);

  useEffect(() => {
    if (!isSearching) return;
    const interval = setInterval(() => {
      setSearchSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSearching]);

  useEffect(() => {
    if (!isSearching) return;
    const interval = setInterval(() => {
      void loadQueueStatus().catch(() => {
        setQueueError("Unable to verify matchmaking status. You can retry or leave the queue.");
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isSearching, loadQueueStatus]);

  const handleStartSearch = async () => {
    setIsSearching(true);
    setSearchSeconds(0);
    setQueueError(null);

    try {
      const { data } = await api.post<LobbyState & { status?: string }>("/battle/queue/join", {
        difficulty: selectedDifficulty,
        battle_type: "general",
        mode: "global",
      });
      setLobbyState((previous) => ({ ...previous, ...data }));
      if ((data.status === "matched" || data.status === "already_in_battle") && data.battle_id) {
        setIsSearching(false);
        router.push(`/battle/${encodeURIComponent(data.battle_id)}`);
      }
    } catch {
      setIsSearching(false);
      setQueueError("Matchmaking is unavailable. Please try again.");
      try {
        await api.post("/battle/queue/leave");
      } catch {
        setQueueError("Matchmaking failed, and the server could not confirm that you left the queue.");
      }
    }
  };

  const handleCancelSearch = async () => {
    try {
      await api.post("/battle/queue/leave");
      setIsSearching(false);
      setSearchSeconds(0);
      setQueueError(null);
      void loadQueueStatus().catch(() => setQueueError("Unable to refresh matchmaking status."));
      toast("Matchmaking cancelled", { icon: "🛑" });
    } catch {
      setQueueError("Unable to leave the matchmaking queue. Please retry.");
      toast.error("Unable to cancel matchmaking.");
    }
  };

  const handleCreateRoom = async () => {
    setRoomActionLoading(true);
    try {
      const { data } = await api.post<{ id: string }>("/battle/create", {
        title: "Invite battle",
        difficulty: selectedDifficulty,
        battle_type: "general",
        battle_mode: "duo",
        max_players: 2,
        question_type: selectedQuestionType,
        question_count: 1,
      });
      if (!data.id) throw new Error("The server did not return a battle ID.");
      setCreatedRoomId(data.id);
      toast.success("Battle room created. Share its ID to invite another player.");
    } catch {
      toast.error("Unable to create a battle room. Please try again.");
    } finally {
      setRoomActionLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const battleId = roomIdInput.trim();
    if (!battleId) {
      toast.error("Enter a battle room ID.");
      return;
    }
    setRoomActionLoading(true);
    try {
      const { data } = await api.post<{ id: string }>("/battle/join", { battle_id: battleId });
      if (!data.id) throw new Error("The server did not return a battle ID.");
      router.push(`/battle/${encodeURIComponent(data.id)}`);
    } catch {
      toast.error("Unable to join that battle room. Check the ID and try again.");
    } finally {
      setRoomActionLoading(false);
    }
  };

  const copyCode = () => {
    if (!createdRoomId) return;
    void navigator.clipboard.writeText(createdRoomId).then(() => {
      setCopied(true);
      toast.success("Battle ID copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Unable to copy the battle ID."));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Arena Duels"
          subtitle="Compete in real-time synchronized coding duels and knowledge sprints against active engineers globally."
          theme="battle"
          breadcrumbs={[
            { label: "Qubira Arena", href: "/battle" },
            { label: "Arena Duels", href: "/battle/lobby", current: true },
          ]}
        />

        <BattleNav />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Players in queue"
            value={queueLoading ? "Loading" : lobbyState.queue_size === null ? "Unavailable" : `${lobbyState.queue_size}`}
            subtext="Live server matchmaking count"
            icon={Swords}
            variant="amber"
          />
          <StatCard
            label="Matchmaking"
            value={queueError ? "Unavailable" : "Server managed"}
            subtext="Matches require a server-created battle"
            icon={Lock}
            variant="neutral"
          />
        </div>

        {queueError && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">
            <span>{queueError}</span>
            <button type="button" onClick={() => void loadQueueStatus().catch(() => setQueueError("Unable to load live matchmaking status."))} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Matchmaking Command Section */}
        {isSearching ? (
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
                Waiting for the server to match another active player. No opponent is assumed until a battle is created.
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
            {/* Column 1: Quick Match */}
            <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/60 to-slate-950/80 p-6 sm:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-2.5 text-purple-300">
                    <Swords className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                    Live queue
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Quick Match</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Join the server-managed queue. A battle starts only after the backend matches players and creates its room.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as "easy" | "medium" | "hard")}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
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

            {/* Column 2: Create a battle room */}
            <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/60 to-slate-950/80 p-6 sm:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2.5 text-cyan-300">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                    Invite match
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Create Battle Room</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Create a real waiting battle room and share its server-generated ID with another player.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(["mcq", "coding"] as const).map((questionType) => (
                    <button
                      key={questionType}
                      type="button"
                      aria-pressed={selectedQuestionType === questionType}
                      onClick={() => setSelectedQuestionType(questionType)}
                      className={`min-h-10 rounded-lg border px-3 text-xs font-bold capitalize ${
                        selectedQuestionType === questionType
                          ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                          : "border-white/10 bg-black/30 text-slate-400"
                      }`}
                    >
                      {questionType}
                    </button>
                  ))}
                </div>

                {createdRoomId ? (
                  <div className="rounded-xl border border-cyan-500/30 bg-black/50 p-3 space-y-2">
                    <span className="text-[11px] text-slate-400 block">Battle ID:</span>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-mono font-black text-cyan-300">{createdRoomId}</span>
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
                    The room is created by the server; only a successfully created room receives an ID.
                  </div>
                )}
              </div>

              {createdRoomId ? (
                <button
                  type="button"
                  onClick={() => router.push(`/battle/${encodeURIComponent(createdRoomId)}`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
                >
                  <span>Enter Room</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={roomActionLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>{roomActionLoading ? "Creating..." : "Create Battle Room"}</span>
                </button>
              )}
            </div>

            {/* Column 3: Join a battle room */}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7 space-y-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 text-slate-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-bold text-slate-400">
                    Room ID
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Join with Battle ID</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Enter the ID of an existing waiting battle room. The server verifies availability before you join.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Battle ID
                  </label>
                  <input
                    type="text"
                    placeholder="Paste battle ID"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={roomActionLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-bold text-white hover:bg-white/[0.1] hover:border-white/30 transition-all cursor-pointer"
              >
                <span>{roomActionLoading ? "Joining..." : "Join Room"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
