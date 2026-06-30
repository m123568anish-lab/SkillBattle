export default function HeroDashboard() {
  return (
    <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Live challenge</p>
          <h2 className="text-xl font-semibold text-white">DSA Sprint</h2>
        </div>
        <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
          Live now
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Progress</span>
          <span>72%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-800">
          <div className="h-2 w-[72%] rounded-full bg-cyan-400" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Rank</p>
          <p className="mt-1 text-2xl font-semibold text-white">#128</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">XP</p>
          <p className="mt-1 text-2xl font-semibold text-white">12.4K</p>
        </div>
      </div>
    </div>
  );
}
