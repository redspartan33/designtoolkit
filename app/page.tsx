"use client"

import { useState } from "react";
import { Search } from "lucide-react";
import { toolsRegistry } from "@/lib/tools-registry";
import { ToolCard } from "@/components/tools/tool-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: (ToolCategory | "Todas")[] = [
  "Todas",
  "Imagen",
  "Color",
  "Código",
  "Análisis",
  "Layout",
  "Escritura"
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "Todas">("Todas");

  const filteredTools = toolsRegistry.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategory === "Todas" || tool.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col space-y-12 pb-10">
      <div className="flex flex-col space-y-3">
        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          DesignKit
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Tu suite premium de herramientas de diseño. 
          <span className="block text-sm font-medium mt-2 text-primary">Procesamiento local • Privacidad total • Alta fidelidad</span>
        </p>
      </div>

      <div className="flex flex-col space-y-6 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0 p-8 glass rounded-[2.5rem] shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar herramienta..."
            className="pl-12 h-12 bg-white/20 dark:bg-black/20 border-white/10 rounded-2xl focus-visible:ring-primary/30 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm border",
                activeCategory === category 
                  ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                  : "bg-white/30 dark:bg-black/30 text-foreground border-white/10 hover:bg-white/50 dark:hover:bg-black/50"
              )}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
          <div className="rounded-full bg-muted p-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No se encontraron herramientas</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No pudimos encontrar ninguna herramienta que coincida con tu búsqueda.
            <br />
            Intenta con otros términos o cambia la categoría.
          </p>
        </div>
      )}
    </div>
  );
}
