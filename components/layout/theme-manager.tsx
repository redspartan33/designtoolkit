'use client';

import { useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Layout, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeManager() {
  const { visualStyle, setVisualStyle } = useUIStore();

  const themes = [
    {
      id: 'nature',
      name: 'Glass Nature',
      description: 'Efectos de cristal y naturaleza',
      icon: Layout,
      color: 'bg-emerald-500',
    },
    {
      id: 'earth',
      name: 'Bento Earth',
      description: 'Cálido, minimalista y sólido',
      icon: Palette,
      color: 'bg-amber-600',
    },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center size-10 rounded-xl glass border-white/10 hover:bg-white/20 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary">
        <Palette className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 glass border-white/10 rounded-2xl">
        <div className="px-2 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Estilo Visual
        </div>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setVisualStyle(theme.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1",
              visualStyle === theme.id ? "bg-primary text-primary-foreground" : "hover:bg-white/10"
            )}
          >
            <div className={cn("p-2 rounded-lg", theme.color)}>
              <theme.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{theme.name}</div>
              <div className="text-[10px] opacity-70 leading-tight">{theme.description}</div>
            </div>
            {visualStyle === theme.id && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
