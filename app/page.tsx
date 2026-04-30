"use client";

import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { toolsRegistry } from "@/lib/tools-registry";
import { useUIStore } from "@/lib/store";
import { ThemeManager } from "@/components/layout/theme-manager";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ToolCard } from "@/components/tools/tool-card";
import { cn } from "@/lib/utils";
import { ToolCategory } from "@/lib/types";

const CATEGORIES: (ToolCategory | "Todas")[] = [
  "Todas", "Imagen", "Color", "Código", "Análisis", "Layout", "Escritura", "Diseño",
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "Todas">("Todas");
  const { toolUsageCounts } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedAndFiltered = useMemo(() => {
    const lower = query.toLowerCase().trim();

    const filtered = toolsRegistry.filter((tool) => {
      const matchesSearch =
        !lower ||
        tool.name.toLowerCase().includes(lower) ||
        tool.description.toLowerCase().includes(lower) ||
        tool.tags.some((tag) => tag.includes(lower));
      const matchesCategory =
        activeCategory === "Todas" || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort by usage count descending, preserving original order for ties
    return [...filtered].sort(
      (a, b) => (toolUsageCounts[b.id] || 0) - (toolUsageCounts[a.id] || 0)
    );
  }, [query, activeCategory, toolUsageCounts]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shrink-0">
              D
            </div>
            <span className="font-black text-sm tracking-tight">DesignKit</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeManager />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Search section */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-10 pb-6 flex flex-col gap-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar herramienta..."
            className="w-full h-14 pl-12 pr-12 text-base glass border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200 bg-transparent placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "glass border-white/10 text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools grid */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pb-12">
        {sortedAndFiltered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAndFiltered.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="size-12 rounded-2xl glass flex items-center justify-center">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Sin resultados para <strong>"{query}"</strong>
            </p>
            <button
              onClick={() => { setQuery(""); setActiveCategory("Todas"); }}
              className="text-xs text-primary hover:underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
