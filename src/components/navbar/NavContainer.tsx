import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function NavContainer({
  children,
}: Props) {
  return (
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
      {children}
    </div>
  );
}