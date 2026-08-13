import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-slate-500 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };