export default function HeroVisual() {
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="
          flex
          w-full
          max-w-[450px]
          aspect-square
          items-center
          justify-center
          rounded-full
          border
          border-cyan-400/20
          bg-gradient-to-br
          from-violet-600/20
          to-cyan-500/20
          shadow-[0_0_100px_rgba(34,211,238,.25)]
        "
      >
        <div className="text-center p-6">
          <div className="text-5xl sm:text-7xl">
            ⚔️
          </div>

          <h3 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold">
            Battle Arena
          </h3>
        </div>
      </div>
    </div>
  );
}