"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function GradientButton({
  children,
}: Props) {
  return (
    <Button
      className="
      rounded-xl
      bg-gradient-to-r
      from-violet-600
      to-cyan-500
      hover:opacity-90
      transition-all
    "
    >
      {children}
    </Button>
  );
}