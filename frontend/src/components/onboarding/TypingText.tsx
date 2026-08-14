"use client";

import { useEffect, useState } from "react";

interface Props {
  text: string;
  speed?: number;
}

export default function TypingText({
  text,
  speed = 45,
}: Props) {
  const [display, setDisplay] =
    useState("");

  useEffect(() => {
    let index = 0;

    setDisplay("");

    const timer = setInterval(() => {
      index++;

      setDisplay(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <h2 className="text-center text-3xl font-bold text-white">
      {display}

      <span className="animate-pulse text-cyan-400">
        |
      </span>
    </h2>
  );
}