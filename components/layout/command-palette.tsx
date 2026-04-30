'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Clock, Hash } from 'lucide-react';
import { toolsRegistry } from '@/lib/tools-registry';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type Tool = (typeof toolsRegistry)[0];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, toolUsageCounts } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const sortedTools = useMemo(
    () =>
      [...toolsRegistry].sort(
        (a, b) => (toolUsageCounts[b.id] || 0) - (toolUsageCounts[a.id] || 0)
      ),
    [toolUsageCounts]
  );

  const filtered: Tool[] = query.trim()
    ? sortedTools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()) ||
          t.tags.some((tag) => tag.includes(query.toLowerCase()))
      )
    : sortedTools.slice(0, 8);

  const showingRecents = !query.trim() && Object.keys(toolUsageCounts).length > 0;
  const showingAll = !query.trim() && Object.keys(toolUsageCounts).length === 0;

  const handleNavigate = useCallback(
    (tool: Tool) => {
      setCommandPaletteOpen(false);
      setQuery('');
      router.push(tool.route);
    },
    [setCommandPaletteOpen, router]
  );

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery('');
  }, [setCommandPaletteOpen]);

  // Global Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen, close]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!commandPaletteOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) handleNavigate(filtered[selectedIndex]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, filtered, selectedIndex, handleNavigate]);

  // Reset index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] sm:pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="glass w-full max-w-lg mx-4 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar herramienta..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-2 max-h-[360px] overflow-auto">
          {/* Section label */}
          <div className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5 mb-1">
            {showingRecents ? (
              <>
                <Clock className="h-3 w-3" /> Recientes
              </>
            ) : showingAll ? (
              <>
                <Hash className="h-3 w-3" /> Herramientas
              </>
            ) : (
              <>
                <Search className="h-3 w-3" /> Resultados
              </>
            )}
          </div>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No se encontraron herramientas
            </div>
          )}

          {filtered.map((tool, i) => {
            const Icon = tool.icon;
            const isSelected = i === selectedIndex;
            return (
              <button
                key={tool.id}
                onClick={() => handleNavigate(tool)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-100 mb-0.5',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-white/10 dark:hover:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-lg shrink-0',
                    isSelected ? 'bg-white/20' : 'bg-muted'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{tool.name}</div>
                  <div
                    className={cn(
                      'text-xs truncate',
                      isSelected ? 'opacity-75' : 'text-muted-foreground'
                    )}
                  >
                    {tool.description}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded',
                      isSelected ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tool.category}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-white/10 flex items-center gap-3 text-[10px] text-muted-foreground/60">
          <span>
            <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded">↑↓</kbd> navegar
          </span>
          <span>
            <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded">↵</kbd> abrir
          </span>
          <span>
            <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded">Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
