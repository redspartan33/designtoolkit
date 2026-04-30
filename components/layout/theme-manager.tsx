'use client';

import { useUIStore, type VisualStyle } from '@/lib/store';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const themes: {
  id: VisualStyle;
  name: string;
  description: string;
  preview: string;
}[] = [
  {
    id: 'nature',
    name: 'Glass Nature',
    description: 'Glassmorphic con naturaleza',
    preview: 'bg-gradient-to-br from-emerald-300 to-teal-400',
  },
  {
    id: 'earth',
    name: 'Bento Earth',
    description: 'Cálido, sólido y minimalista',
    preview: 'bg-gradient-to-br from-amber-400 to-orange-500',
  },
  {
    id: 'aurora',
    name: 'Glass Aurora',
    description: 'Cristal con aurora boreal',
    preview: 'bg-gradient-to-br from-violet-500 via-purple-400 to-teal-400',
  },
  {
    id: 'cyber',
    name: 'Neon Cyber',
    description: 'Terminal con efecto neon',
    preview: 'bg-gradient-to-br from-green-400 to-emerald-600',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Azul marino y limpio',
    preview: 'bg-gradient-to-br from-blue-400 to-cyan-500',
  },
];

export function ThemeManager() {
  const { visualStyle, setVisualStyle } = useUIStore();

  const active = themes.find((t) => t.id === visualStyle);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-3 rounded-xl glass border-white/10 hover:bg-white/20 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary text-sm font-medium">
        <div className={cn('size-4 rounded-full shrink-0', active?.preview ?? 'bg-primary')} />
        <span className="hidden sm:inline text-foreground/80">{active?.name}</span>
        <Palette className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 p-2 glass border-white/10 rounded-2xl">
        <div className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
          Tema Visual
        </div>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setVisualStyle(theme.id)}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all mb-0.5',
              visualStyle === theme.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-white/10'
            )}
          >
            <div className={cn('size-8 rounded-lg shrink-0', theme.preview)} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">{theme.name}</div>
              <div className="text-[10px] opacity-70 leading-tight truncate">{theme.description}</div>
            </div>
            {visualStyle === theme.id && <Check className="w-4 h-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
