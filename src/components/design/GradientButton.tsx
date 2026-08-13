"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export default function GradientButton({
  children,
  onClick,
  type = "button",
  className = "",
}: Props) {
  return (
    <Button
      type={type}
      onClick={onClick}
      className={`
      rounded-xl
      bg-gradient-to-r
      from-violet-600
      to-cyan-500
      hover:opacity-90
      transition-all
      ${className}
    `}
    >
      {children}
    </Button>
  );
}