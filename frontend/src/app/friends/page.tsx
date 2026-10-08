import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FriendPanel from '@/components/friend/FriendPanel';

export default function FriendsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-[28px] border border-cyan-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_24%),linear-gradient(135deg,#08101d_0%,#0b1324_50%,#050816_100%)] p-5 text-white shadow-[0_25px_80px_rgba(34,211,238,0.12)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Squad</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl">Friends</h1>
            </div>
            <span className="inline-flex items-center self-start rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
              Real connections
            </span>
          </div>
        </section>

        <FriendPanel />
      </div>
    </DashboardLayout>
  );
}
