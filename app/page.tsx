"use client";

import { useState } from "react";
import { Search, Sparkles, Clock } from "lucide-react";
import { toolsRegistry } from "@/lib/tools-registry";
import { ToolCard } from "@/components/tools/tool-card";
import { Input } from "@/components/ui/input";
import { ToolCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";

const categories: (ToolCategory | "Todas")[] = [
  "Todas",
  "Imagen",
  "Color",
  "Código",
  "Análisis",
  "Layout",
  "Escritura",
];

const STATS = [
  { value: `${toolsRegistry.length}`, label: "Herramientas" },
  { value: toolsRegistry.filter((t) => t.status === "stable").length.toString(), label: "Estables" },
  { value: "100%", label: "Local & Privado" },
  { value: "0", label: "Datos enviados" },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "Todas">("Todas");
  const { setCommandPaletteOpen, recentToolIds } = useUIStore();

  const filteredTools = toolsRegistry.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      activeCategory === "Todas" || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const recentTools = recentToolIds
    .map((id) => toolsRegistry.find((t) => t.id === id))
    .filter(Boolean) as typeof toolsRegistry;

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Hero */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass border-white/10 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Fase 8 · Suite completa
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
          Herramientas de<br />diseño premium
        </h1>
        <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
          Suite completa para diseñadores y devs. Todo corre en tu navegador — sin servidores, sin rastreo, sin límites.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(({ value, label }) => (
          <div key={label} className="glass rounded-2xl px-4 py-3 flex flex-col gap-1">
            <span className="text-2xl font-black tracking-tight">{value}</span>
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Recent tools */}
      {recentTools.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            Usados recientemente
          </div>
          <div className="flex flex-wrap gap-2">
            {recentTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.id}
                  href={tool.route}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass border-white/10 hover:bg-white/20 transition-all duration-200 text-sm font-medium"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {tool.name}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar herramienta... (⌘K)"
            className="pl-10 h-11 bg-white/20 dark:bg-black/20 border-white/10 rounded-xl text-sm cursor-text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (!searchQuery) setCommandPaletteOpen(true);
            }}
            readOnly={!searchQuery}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
                activeCategory === category
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-white/20 dark:bg-black/20 text-foreground border-white/10 hover:bg-white/30 dark:hover:bg-black/30"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="flex h-56 flex-col items-center justify-center rounded-2xl glass text-center gap-3">
          <div className="rounded-2xl bg-muted p-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Sin resultados</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Intenta con otros términos o cambia la categoría
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
