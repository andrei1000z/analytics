import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md border border-line bg-soft-gray px-1.5 font-mono text-[10px] font-medium text-text-muted shadow-soft-1",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
