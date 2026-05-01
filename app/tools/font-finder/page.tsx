"use client";

import {
  Code2,
  Copy,
  Download,
  ExternalLink,
  Search,
  Type,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace";

interface Font {
  family: string;
  category: FontCategory;
  weights: number[];
  italic?: boolean;
  designer?: string;
}

// Curated top fonts from Google Fonts. Each entry uses the family name as it
// appears in fonts.google.com — that's also what's needed for the download URL
// and the CSS API.
const FONTS: Font[] = [
  // Sans-serif
  {
    family: "Inter",
    category: "sans-serif",
    weights: [400, 500, 600, 700, 800],
    italic: true,
  },
  {
    family: "Roboto",
    category: "sans-serif",
    weights: [300, 400, 500, 700],
    italic: true,
  },
  {
    family: "Open Sans",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
    italic: true,
  },
  {
    family: "Lato",
    category: "sans-serif",
    weights: [300, 400, 700, 900],
    italic: true,
  },
  {
    family: "Montserrat",
    category: "sans-serif",
    weights: [400, 500, 600, 700, 800],
    italic: true,
  },
  {
    family: "Poppins",
    category: "sans-serif",
    weights: [300, 400, 500, 600, 700],
    italic: true,
  },
  {
    family: "Nunito",
    category: "sans-serif",
    weights: [400, 600, 700, 800],
    italic: true,
  },
  {
    family: "Work Sans",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
    italic: true,
  },
  {
    family: "DM Sans",
    category: "sans-serif",
    weights: [400, 500, 700],
    italic: true,
  },
  {
    family: "Manrope",
    category: "sans-serif",
    weights: [400, 500, 600, 700, 800],
  },
  {
    family: "Plus Jakarta Sans",
    category: "sans-serif",
    weights: [400, 500, 600, 700, 800],
    italic: true,
  },
  {
    family: "Outfit",
    category: "sans-serif",
    weights: [400, 500, 600, 700, 800],
  },
  {
    family: "Space Grotesk",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
  },
  {
    family: "Geist",
    category: "sans-serif",
    weights: [400, 500, 600, 700, 800],
  },
  {
    family: "Figtree",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
    italic: true,
  },

  // Serif
  {
    family: "Playfair Display",
    category: "serif",
    weights: [400, 500, 600, 700, 800],
    italic: true,
  },
  {
    family: "Merriweather",
    category: "serif",
    weights: [300, 400, 700, 900],
    italic: true,
  },
  {
    family: "Lora",
    category: "serif",
    weights: [400, 500, 600, 700],
    italic: true,
  },
  {
    family: "EB Garamond",
    category: "serif",
    weights: [400, 500, 600, 700],
    italic: true,
  },
  {
    family: "Cormorant Garamond",
    category: "serif",
    weights: [300, 400, 500, 600, 700],
    italic: true,
  },
  {
    family: "DM Serif Display",
    category: "serif",
    weights: [400],
    italic: true,
  },
  {
    family: "Libre Baskerville",
    category: "serif",
    weights: [400, 700],
    italic: true,
  },
  {
    family: "Source Serif 4",
    category: "serif",
    weights: [400, 600, 700],
    italic: true,
  },
  {
    family: "Bricolage Grotesque",
    category: "serif",
    weights: [400, 500, 600, 700],
  },
  {
    family: "Crimson Text",
    category: "serif",
    weights: [400, 600, 700],
    italic: true,
  },

  // Display
  { family: "Bebas Neue", category: "display", weights: [400] },
  { family: "Anton", category: "display", weights: [400] },
  { family: "Oswald", category: "display", weights: [400, 500, 600, 700] },
  { family: "Archivo Black", category: "display", weights: [400] },
  { family: "Abril Fatface", category: "display", weights: [400] },

  // Handwriting
  { family: "Pacifico", category: "handwriting", weights: [400] },
  {
    family: "Dancing Script",
    category: "handwriting",
    weights: [400, 500, 600, 700],
  },
  { family: "Caveat", category: "handwriting", weights: [400, 500, 600, 700] },
  { family: "Sacramento", category: "handwriting", weights: [400] },
  { family: "Permanent Marker", category: "handwriting", weights: [400] },

  // Monospace
  {
    family: "JetBrains Mono",
    category: "monospace",
    weights: [400, 500, 600, 700],
    italic: true,
  },
  { family: "Fira Code", category: "monospace", weights: [400, 500, 600, 700] },
  {
    family: "Source Code Pro",
    category: "monospace",
    weights: [400, 500, 600, 700],
    italic: true,
  },
  {
    family: "IBM Plex Mono",
    category: "monospace",
    weights: [400, 500, 600, 700],
    italic: true,
  },
  {
    family: "Space Mono",
    category: "monospace",
    weights: [400, 700],
    italic: true,
  },
  {
    family: "Roboto Mono",
    category: "monospace",
    weights: [400, 500, 600, 700],
    italic: true,
  },
];

const CATEGORIES: { id: FontCategory | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "sans-serif", label: "Sans-serif" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "handwriting", label: "Handwriting" },
  { id: "monospace", label: "Monospace" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function urlFamily(family: string): string {
  // Google Fonts CSS2 expects spaces as +. e.g. "Plus Jakarta Sans" → "Plus+Jakarta+Sans"
  return family.replace(/\s+/g, "+");
}

function cssApiUrl(font: Font): string {
  const fam = urlFamily(font.family);
  if (font.italic && font.weights.length > 1) {
    const axis = font.weights
      .map((w) => `0,${w}`)
      .concat(font.weights.map((w) => `1,${w}`))
      .join(";");
    return `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@${axis}&display=swap`;
  }
  if (font.weights.length > 1) {
    return `https://fonts.googleapis.com/css2?family=${fam}:wght@${font.weights.join(";")}&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${fam}&display=swap`;
}

function downloadUrl(family: string): string {
  return `https://fonts.google.com/download?family=${encodeURIComponent(family)}`;
}

function specimenUrl(family: string): string {
  return `https://fonts.google.com/specimen/${family.replace(/\s+/g, "+")}`;
}

function importStatement(font: Font): string {
  return `@import url('${cssApiUrl(font)}');`;
}

function linkTag(font: Font): string {
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${cssApiUrl(font)}" rel="stylesheet">`;
}

function tailwindFontStack(font: Font): string {
  const fallback =
    font.category === "serif"
      ? "ui-serif, Georgia, serif"
      : font.category === "monospace"
        ? "ui-monospace, SFMono-Regular, monospace"
        : font.category === "handwriting" || font.category === "display"
          ? "ui-sans-serif, system-ui, sans-serif"
          : "ui-sans-serif, system-ui, sans-serif";
  return `'${font.family}', ${fallback}`;
}

// Inject a single <link> with all curated families so the grid renders each
// card in its own typeface without per-card requests.
function buildAllFamiliesUrl(): string {
  const families = FONTS.map((f) => {
    const fam = urlFamily(f.family);
    if (f.weights.length > 1) {
      return `${fam}:wght@${f.weights.join(";")}`;
    }
    return fam;
  })
    .map((q) => `family=${q}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FontFinderPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FontCategory | "all">(
    "all",
  );
  const [selected, setSelected] = useState<Font | null>(FONTS[0] ?? null);
  const [previewSize, setPreviewSize] = useState(48);
  const [previewWeight, setPreviewWeight] = useState(400);
  const [sample, setSample] = useState("Discover the Best Remote Jobs");

  // Inject the bulk Google Fonts <link> once on mount
  useEffect(() => {
    const id = "font-finder-bulk-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = buildAllFamiliesUrl();
    document.head.appendChild(link);
  }, []);

  // Reset weight when font changes
  useEffect(() => {
    if (!selected) return;
    if (!selected.weights.includes(previewWeight)) {
      setPreviewWeight(
        selected.weights.includes(400) ? 400 : selected.weights[0],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return FONTS.filter((f) => {
      const matchesQuery = !lower || f.family.toLowerCase().includes(lower);
      const matchesCategory =
        activeCategory === "all" || f.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory]);

  const handleInstall = (font: Font) => {
    // Trigger download of the .zip with .ttf files. The browser navigates to
    // Google Fonts' download endpoint, which returns the zip directly.
    const a = document.createElement("a");
    a.href = downloadUrl(font.family);
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    a.click();
    toast.success(`Descargando ${font.family}.zip`, {
      description: "Descomprime y haz doble clic en cada .ttf para instalar.",
    });
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <ToolPageShell toolId="font-finder">
      <div className="space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tipografía… (ej: Inter, Playfair, Mono)"
            className="pl-10 h-12 text-base"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                activeCategory === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Layout: grid + detail panel */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Grid */}
          <div className="min-h-[400px]">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/10 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Sin resultados para "{query}".
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "tipografía" : "tipografías"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((f) => {
                    const isActive = selected?.family === f.family;
                    return (
                      <button
                        key={f.family}
                        type="button"
                        onClick={() => setSelected(f)}
                        className={cn(
                          "text-left rounded-xl border bg-background hover:bg-muted/30 hover:border-primary/40 transition-colors p-5 flex flex-col gap-3 min-h-[120px]",
                          isActive &&
                            "border-primary bg-primary/5 ring-2 ring-primary/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-muted-foreground truncate">
                            {f.family}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase tracking-wider shrink-0"
                          >
                            {f.category}
                          </Badge>
                        </div>
                        <span
                          className="text-3xl leading-tight truncate"
                          style={{
                            fontFamily: tailwindFontStack(f),
                            fontWeight: f.weights.includes(500) ? 500 : 400,
                          }}
                        >
                          {f.family}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Detail panel */}
          <aside className="lg:sticky lg:top-20">
            {selected ? (
              <div className="rounded-xl border bg-background p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">
                      {selected.category}
                    </p>
                    <h3 className="text-lg font-bold truncate">
                      {selected.family}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selected.weights.map((w) => (
                        <Badge
                          key={w}
                          variant={previewWeight === w ? "default" : "outline"}
                          className="text-[10px] cursor-pointer"
                          onClick={() => setPreviewWeight(w)}
                        >
                          {w}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-lg border bg-muted/10 p-5 min-h-[140px] flex items-center">
                  <p
                    className="leading-tight break-words w-full"
                    style={{
                      fontFamily: tailwindFontStack(selected),
                      fontWeight: previewWeight,
                      fontSize: `${previewSize}px`,
                    }}
                  >
                    {sample || "Type something…"}
                  </p>
                </div>

                {/* Sample text editor */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Texto de prueba</Label>
                  <Textarea
                    value={sample}
                    onChange={(e) => setSample(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Size slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tamaño</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {previewSize}px
                    </span>
                  </div>
                  <Slider
                    value={[previewSize]}
                    onValueChange={(v) =>
                      setPreviewSize(Array.isArray(v) ? v[0] : v)
                    }
                    min={12}
                    max={120}
                    step={2}
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleInstall(selected)}
                    className="col-span-2"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Instalar (.zip)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(linkTag(selected), "<link>")}
                  >
                    <Code2 className="w-3.5 h-3.5 mr-1.5" /> {"<link>"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(importStatement(selected), "@import")
                    }
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> @import
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(
                        `font-family: ${tailwindFontStack(selected)};`,
                        "font-family",
                      )
                    }
                    className="col-span-2"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> font-family CSS
                  </Button>
                  <Link
                    href={specimenUrl(selected.family)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 inline-flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    Ver specimen en Google Fonts
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  El botón "Instalar" descarga el .zip con los archivos .ttf.
                  Descomprime y haz doble clic para instalar en el sistema.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center">
                <Type className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Selecciona una tipografía</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Haz click en cualquier card para previsualizarla y descargar
                  el archivo de instalación.
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-muted-foreground text-center">
          Tipografías servidas vía{" "}
          <a
            href="https://fonts.google.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Google Fonts
          </a>
          . Todas son de uso libre (Open Font License o Apache 2.0).
        </p>
      </div>
    </ToolPageShell>
  );
}
