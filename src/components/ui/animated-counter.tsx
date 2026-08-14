"use client";

import CountUp from "react-countup";

interface Props {
  end: number;
  suffix?: string;
}

export default function AnimatedCounter({
  end,
  suffix = "",
}: Props) {
  return (
    <span className="text-3xl font-bold text-white">
      <CountUp
        end={end}
        duration={2.5}
        separator=","
      />
      {suffix}
    </span>
  );
}