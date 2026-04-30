"use client"

import { ThemeToggle } from "./theme-toggle";
import { ThemeManager } from "./theme-manager";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={cn("sticky top-0 z-50 w-full flex items-center h-16 shrink-0", className)}>
      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold uppercase tracking-[0.2em] opacity-50 ml-4">DesignKit</h1>
        </div>
        <div className="flex items-center gap-4 mr-2">
          <ThemeManager />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
