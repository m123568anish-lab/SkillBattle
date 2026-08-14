"use client";
import { useEffect, useState } from "react";
import { adminService, AdminUser } from "@/services/admin.service";

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert("Failed to update user role");
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await adminService.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
    } catch (err) {
      alert("Failed to update active state");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 flex items-center gap-2">
          👥 User Management
        </h3>
        <button
          onClick={fetchUsers}
          className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400">Loading users...</div>
      ) : error ? (
        <div className="rounded-xl bg-rose-500/20 p-4 text-rose-300 text-sm">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{u.full_name}</div>
                    <div className="text-xs text-slate-400">@{u.username} • {u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${u.is_active ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30" : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"}`}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
