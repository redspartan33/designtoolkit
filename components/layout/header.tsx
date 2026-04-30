'use client';

import { ThemeToggle } from './theme-toggle';
import { ThemeManager } from './theme-manager';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import { toolsRegistry } from '@/lib/tools-registry';
import { Search, LayoutDashboard, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { setCommandPaletteOpen } = useUIStore();
  const pathname = usePathname();

  const currentTool = toolsRegistry.find((t) => t.route === pathname);
  const isHome = pathname === '/';

  return (
    <header className={cn('sticky top-0 z-50 w-full flex items-center h-16 shrink-0', className)}>
      <div className="w-full flex items-center gap-3 px-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm min-w-0 mr-auto">
          <Link
            href="/"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            {!currentTool && <span className="hidden sm:inline font-medium">Dashboard</span>}
          </Link>
          {currentTool && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <span className="font-semibold text-foreground truncate">{currentTool.name}</span>
            </>
          )}
          {isHome && (
            <span className="font-semibold text-foreground hidden sm:inline">
              Todas las herramientas
            </span>
          )}
        </div>

        {/* Search trigger — hidden on mobile (handled by mobile nav) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 dark:bg-black/20 border border-white/10 text-muted-foreground text-sm hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-200 cursor-text shrink-0 w-48"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Buscar...</span>
          <kbd className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeManager />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
