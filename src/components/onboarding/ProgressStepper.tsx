"use client";

interface Props {
  step: number;
  total: number;
}

export default function ProgressStepper({
  step,
  total,
}: Props) {
  const percent =
    ((step + 1) / total) * 100;

  return (
    <div className="mb-10">

      <div className="mb-3 flex justify-between text-sm text-slate-400">

        <span>
          Step {step + 1}
        </span>

        <span>
          {total}
        </span>

      </div>

      <div className="h-2 rounded-full bg-white/10">

        <div
          style={{
            width: `${percent}%`,
          }}
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-cyan-500
            to-violet-500
            transition-all
            duration-500
          "
        />

      </div>

    </div>
  );
}