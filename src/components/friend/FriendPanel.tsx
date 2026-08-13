"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { friendService, type FriendResponse } from "@/services/friend.service";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  Check,
  X,
  Trophy,
  Zap,
  MessageSquare,
  MoreVertical,
} from "lucide-react";

export default function FriendPanel() {
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendId, setFriendId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [hoveredFriend, setHoveredFriend] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await friendService.listFriends();
        if (active) setFriends(response.friends);
      } catch (err: any) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleAddFriend() {
    if (!friendId.trim()) {
      setError("Enter a valid friend ID.");
      return;
    }

    setError(null);
    setAddingFriend(true);

    try {
      const newFriend = await friendService.addFriend(friendId.trim());
      setFriends((current) => [...current, newFriend]);
      setFriendId("");
      toast.success("Friend added! 🎮");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to add friend.");
      toast.error("Failed to add friend.");
    } finally {
      setAddingFriend(false);
    }
  }

  async function handleRemoveFriend(friendUserId: string) {
    try {
      setFriends((current) =>
        current.filter((f) => f.user_id !== friendUserId)
      );
      toast.success("Friend removed.");
    } catch (err: any) {
      toast.error("Failed to remove friend.");
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-cyan-950/10 p-8 text-white shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-cyan-500/20 border border-cyan-500/30 p-4">
            <Users className="h-8 w-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Squad Roster</h1>
            <p className="mt-1 text-slate-400">Manage your friends and build your ultimate squad</p>
          </div>
        </div>
      </motion.div>

      {/* Add Friend Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="h-5 w-5 text-violet-400" />
          <h2 className="text-xl font-bold">Add Friend</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Friend ID</label>
            <input
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              placeholder="Enter friend's user ID"
              onKeyPress={(e) => e.key === "Enter" && handleAddFriend()}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50 outline-none transition"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3"
            >
              <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          <motion.button
            onClick={handleAddFriend}
            disabled={addingFriend || !friendId.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {addingFriend ? "Adding..." : "Add Friend"}
          </motion.button>
        </div>
      </motion.div>

      {/* Friends List */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold">Friends ({friends.length})</h2>
              <p className="text-xs text-slate-400 mt-1">Your squad members</p>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-bold"
          >
            {friends.length}/{10}
          </motion.div>
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative h-12 w-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-slate-600 border-t-cyan-400"
              />
            </div>
            <p className="mt-4 text-slate-400">Loading your squad...</p>
          </motion.div>
        ) : friends.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-dashed border-white/20 bg-slate-950/40 p-12 text-center"
          >
            <Users className="h-12 w-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold text-white">No friends yet</p>
            <p className="text-sm text-slate-400 mt-2">Start building your squad by adding friends above!</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence>
              {friends.map((friend, index) => (
                <motion.div
                  key={friend.user_id}
                  variants={itemVariants}
                  layout
                  onMouseEnter={() => setHoveredFriend(friend.user_id)}
                  onMouseLeave={() => setHoveredFriend(null)}
                  className="group relative rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/60 to-slate-900/40 p-4 hover:border-cyan-400/50 transition-all"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(100, 116, 139, 0.1)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500"
                      >
                        <span className="text-sm font-bold text-white">
                          {friend.user_id[0].toUpperCase()}
                        </span>
                      </motion.div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{friend.user_id}</span>
                          {index === 0 && (
                            <span className="inline-flex items-center rounded-full bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 text-xs font-bold text-yellow-300">
                              <Trophy className="h-3 w-3 mr-1" />
                              Leader
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          Joined {new Date(friend.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{
                        opacity: hoveredFriend === friend.user_id ? 1 : 0,
                        x: hoveredFriend === friend.user_id ? 0 : 10,
                      }}
                      className="flex gap-2"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-full bg-cyan-500/20 border border-cyan-500/30 p-2 text-cyan-400 hover:bg-cyan-500/30 transition"
                        title="Send message"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveFriend(friend.user_id)}
                        className="rounded-full bg-red-500/20 border border-red-500/30 p-2 text-red-400 hover:bg-red-500/30 transition"
                        title="Remove friend"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  </div>

                  {/* Stats Bar */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: hoveredFriend === friend.user_id ? 1 : 0,
                    }}
                    className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-white/5"
                  >
                    <div className="text-center">
                      <Zap className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                      <div className="text-xs text-slate-400">Active</div>
                    </div>
                    <div className="text-center">
                      <Trophy className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
                      <div className="text-xs text-slate-400">5 Wins</div>
                    </div>
                    <div className="text-center">
                      <Check className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                      <div className="text-xs text-slate-400">Online</div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Squad Stats Card */}
      {friends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-8 text-white shadow-2xl backdrop-blur-xl"
        >
          <h3 className="text-xl font-bold mb-4">Squad Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-2xl font-black text-cyan-400">{friends.length}</div>
              <div className="text-xs text-slate-400 mt-1">Total Members</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-2xl font-black text-yellow-400">
                {friends.length * 5}
              </div>
              <div className="text-xs text-slate-400 mt-1">Combined Wins</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">
                {Math.round((friends.length / 10) * 100)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Squad Full</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
