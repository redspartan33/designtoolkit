'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toolsRegistry } from '@/lib/tools-registry';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Image,
  Palette,
  Code2,
  BarChart2,
  Layout,
  PenLine,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Imagen: Image,
  Color: Palette,
  Código: Code2,
  Análisis: BarChart2,
  Layout: Layout,
  Escritura: PenLine,
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  const categories = toolsRegistry.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, typeof toolsRegistry>
  );

  return (
    <div
      className={cn(
        'hidden lg:flex flex-col shrink-0 overflow-hidden transition-all duration-500 ease-in-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-60',
        className
      )}
    >
      <div className="flex h-full max-h-screen flex-col">
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center shrink-0 transition-all duration-300',
            sidebarCollapsed ? 'justify-center' : 'px-5 gap-3'
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shrink-0">
              <span className="text-base font-black">D</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg tracking-tight font-black truncate">DesignKit</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <nav className={cn('flex flex-col gap-0.5', sidebarCollapsed ? 'px-2' : 'px-3')}>
            {/* Dashboard */}
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    'flex items-center justify-center h-10 w-full rounded-xl transition-all duration-200 cursor-pointer',
                    pathname === '/'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  )}
                  onClick={() => window.location.href = '/'}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/"
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                  pathname === '/'
                    ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                    : 'text-muted-foreground hover:bg-white/10 hover:text-foreground font-medium'
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </Link>
            )}

            {/* Categories */}
            {Object.entries(categories).map(([category, tools]) => {
              const CatIcon = CATEGORY_ICONS[category];
              return (
                <div key={category} className="mt-5 flex flex-col gap-0.5">
                  {/* Category header */}
                  {sidebarCollapsed ? (
                    <div className="mx-auto w-6 h-px bg-border/60 mb-1" />
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 mb-1">
                      {CatIcon && <CatIcon className="h-3 w-3 text-muted-foreground/50" />}
                      <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/40">
                        {category}
                      </span>
                    </div>
                  )}

                  {/* Tools */}
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = pathname === tool.route;

                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={tool.id}>
                          <TooltipTrigger
                            className={cn(
                              'flex items-center justify-center h-10 w-full rounded-xl transition-all duration-200 cursor-pointer',
                              isActive
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
                            )}
                            onClick={() => window.location.href = tool.route}
                          >
                            <Icon className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent side="right">{tool.name}</TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Link
                        key={tool.id}
                        href={tool.route}
                        className={cn(
                          'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-200',
                          isActive
                            ? 'bg-primary/12 text-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-white/10 hover:text-foreground font-medium'
                        )}
                      >
                        <div
                          className={cn(
                            'p-1 rounded-lg shrink-0 transition-colors duration-200',
                            isActive
                              ? 'bg-primary/20 text-primary'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate">{tool.name}</span>
                        {tool.status === 'beta' && (
                          <span className="ml-auto shrink-0 text-[8px] font-black uppercase tracking-wide text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                            β
                          </span>
                        )}
                        {tool.status === 'coming-soon' && (
                          <span className="ml-auto shrink-0 text-[8px] font-black uppercase tracking-wide text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded-full">
                            soon
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Collapse toggle */}
        <div className={cn('py-3 border-t border-white/10', sidebarCollapsed ? 'px-2' : 'px-3')}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'flex items-center rounded-xl transition-all duration-200 text-muted-foreground hover:bg-white/10 hover:text-foreground',
              sidebarCollapsed
                ? 'justify-center h-10 w-full'
                : 'w-full gap-2 px-3 py-2 text-sm font-medium'
            )}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
