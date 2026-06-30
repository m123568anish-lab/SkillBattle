import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function HeroTitle({ children }: Props) {
  return (
    <h1 className="text-5xl md:text-7xl font-black leading-tight">
      {children}
    </h1>
  );
}

export function Heading({ children }: Props) {
  return (
    <h2 className="text-4xl font-bold">
      {children}
    </h2>
  );
}

export function Paragraph({ children }: Props) {
  return (
    <p className="text-lg text-slate-400 leading-8">
      {children}
    </p>
  );
}