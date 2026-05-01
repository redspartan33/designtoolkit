"use client";

import { Search, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ToolCard } from "@/components/tools/tool-card";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useUIStore } from "@/lib/store";
import { toolsRegistry } from "@/lib/tools-registry";
import type { ToolCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

// "all" is the only non-ToolCategory value here. Real categories come from
// ToolCategory and are translated via the dictionary.
type CategoryFilter = ToolCategory | "all";
const CATEGORY_FILTERS: CategoryFilter[] = [
  "all",
  "Branding",
  "UX",
  "UI",
  "Research",
  "Product Management",
];

export default function HomePage() {
  const t = useTranslation();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const { toolUsageCounts } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedAndFiltered = useMemo(() => {
    const lower = query.toLowerCase().trim();

    const filtered = toolsRegistry.filter((tool) => {
      // Match against both the canonical name/description AND the active
      // translation, so search works regardless of UI language.
      const translatedName = t(
        `tools.${tool.id}.name`,
        tool.name,
      ).toLowerCase();
      const translatedDesc = t(
        `tools.${tool.id}.description`,
        tool.description,
      ).toLowerCase();
      const matchesSearch =
        !lower ||
        tool.name.toLowerCase().includes(lower) ||
        tool.description.toLowerCase().includes(lower) ||
        translatedName.includes(lower) ||
        translatedDesc.includes(lower) ||
        tool.tags.some((tag) => tag.includes(lower));
      const matchesCategory =
        activeCategory === "all" || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort(
      (a, b) => (toolUsageCounts[b.id] || 0) - (toolUsageCounts[a.id] || 0),
    );
  }, [query, activeCategory, toolUsageCounts, t]);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Decorative sparkles */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Sparkles className="sparkle absolute top-[12%] left-[8%] h-4 w-4 text-white/30" />
        <Sparkles
          className="sparkle absolute top-[18%] right-[12%] h-5 w-5 text-white/20"
          style={{ animationDelay: "0.6s" }}
        />
        <Sparkles
          className="sparkle absolute top-[40%] left-[50%] h-3 w-3 text-white/30"
          style={{ animationDelay: "1.2s" }}
        />
        <Sparkles
          className="sparkle absolute top-[28%] right-[40%] h-3 w-3 text-white/25"
          style={{ animationDelay: "1.8s" }}
        />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shrink-0">
              D
            </div>
            <span className="font-black text-sm tracking-tight">
              {t("home.brand")}
            </span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Search section */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-10 pb-6 flex flex-col gap-4 relative">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            className="w-full h-14 pl-12 pr-12 text-base glass border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200 bg-transparent placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0",
                activeCategory === cat
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "glass border-white/10 text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`category.${cat}`, cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Tools grid */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pb-12 relative">
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
              {t("home.noResultsPrefix")} <strong>"{query}"</strong>
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              className="text-xs text-primary hover:underline"
            >
              {t("home.clearSearch")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
