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
  "Layout"
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
    <div className="flex flex-col space-y-8 pb-10">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Bienvenido a DesignKit</h1>
        <p className="text-lg text-muted-foreground">
          Tu suite personal de herramientas de diseño, todo en un solo lugar y corriendo localmente.
        </p>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción o tag..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={activeCategory === category ? "default" : "secondary"}
              className={cn(
                "cursor-pointer hover:bg-primary/80 transition-colors",
                activeCategory !== category && "hover:bg-secondary/80 text-foreground"
              )}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Badge>
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
