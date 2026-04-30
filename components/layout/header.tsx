"use client"

import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo or Title can go here, but sidebar already has it */}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Command Menu Placeholder */}
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
