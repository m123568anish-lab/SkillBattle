import HeroButtons from "./HeroButtons";
import HeroStats from "./HeroStats";

export default function HeroContent() {
  return (
    <div className="max-w-2xl">
      <div className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 backdrop-blur">
        ⚡ AI-powered competitive coding platform
      </div>

      <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-6xl">
        Train smarter. Battle harder. Win bigger.
      </h1>

      <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
        Challenge your coding skills, climb the leaderboard, and unlock real placement-ready experience with every battle.
      </p>

      <HeroButtons />
      <HeroStats />
    </div>
  );
}
