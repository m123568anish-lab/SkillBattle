import * as React from "react";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export default function Section({ children, className = "", ...props }: SectionProps) {
  return (
    <section className={`py-20 ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}
