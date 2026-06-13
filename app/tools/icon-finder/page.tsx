"use client";

import {
  Code2,
  Copy,
  Download,
  ImageDown,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ── Iconify ────────────────────────────────────────────────────────────────────
// Public free API. Docs: https://iconify.design/docs/api/
const API = "https://api.iconify.design";

interface Collection {
  prefix: string;
  name: string;
  hint: string;
}

const COLLECTIONS: Collection[] = [
  { prefix: "", name: "Todas", hint: "" },
  { prefix: "lucide", name: "Lucide", hint: "Stroke · MIT" },
  { prefix: "heroicons", name: "Heroicons", hint: "Tailwind · MIT" },
  { prefix: "tabler", name: "Tabler", hint: "Stroke · MIT" },
  { prefix: "ph", name: "Phosphor", hint: "Multi-weight · MIT" },
  {
    prefix: "material-symbols",
    name: "Material Symbols",
    hint: "Google · Apache 2.0",
  },
  { prefix: "mdi", name: "Material Design", hint: "Solid · Apache 2.0" },
  { prefix: "bi", name: "Bootstrap Icons", hint: "Solid · MIT" },
  { prefix: "ri", name: "Remix", hint: "Solid · Apache 2.0" },
  { prefix: "iconoir", name: "Iconoir", hint: "Stroke · MIT" },
  { prefix: "simple-icons", name: "Simple Icons", hint: "Logos · CC0" },
];

const DEFAULT_PREFIXES = COLLECTIONS.filter((c) => c.prefix).map(
  (c) => c.prefix,
);

interface IconResult {
  full: string; // "lucide:alert-circle"
  prefix: string;
  name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function searchIcons(
  query: string,
  prefix: string,
  signal: AbortSignal,
): Promise<IconResult[]> {
  const params = new URLSearchParams({ query, limit: "120" });
  if (prefix) params.set("prefix", prefix);
  else params.set("prefixes", DEFAULT_PREFIXES.join(","));
  const res = await fetch(`${API}/search?${params}`, { signal });
  if (!res.ok) throw new Error("search failed");
  const data: { icons?: string[] } = await res.json();
  return (data.icons ?? []).map((full) => {
    const [pfx, ...rest] = full.split(":");
    return { full, prefix: pfx, name: rest.join(":") };
  });
}

function iconUrl(
  prefix: string,
  name: string,
  params?: Record<string, string>,
): string {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return `${API}/${prefix}/${name}.svg${qs}`;
}

async function fetchIconSvg(
  prefix: string,
  name: string,
  params?: Record<string, string>,
): Promise<string> {
  const res = await fetch(iconUrl(prefix, name, params));
  if (!res.ok) throw new Error("icon fetch failed");
  return res.text();
}

function toPascalCase(s: string): string {
  return s
    .split(/[-_:]/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

function svgToJsx(svg: string, componentName: string): string {
  // Extract attrs and inner of <svg>
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  return `function ${componentName}(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" {...props}>
      ${inner.replace(/"/g, '\\"').trim()}
    </svg>
  );
}`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function IconFinderPage() {
  const [query, setQuery] = useState("alert");
  const [activePrefix, setActivePrefix] = useState<string>(""); // '' = all
  const [results, setResults] = useState<IconResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IconResult | null>(null);
  const [size, setSize] = useState(48);
  const [color, setColor] = useState("#0f172a");
  const [selectedSvg, setSelectedSvg] = useState<string>(""); // raw SVG string from API for selected icon
  const [loadingDetail, setLoadingDetail] = useState(false);

  const searchAbortRef = useRef<AbortController | null>(null);

  // Run search (debounced)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const ctrl = new AbortController();
      searchAbortRef.current = ctrl;
      setLoading(true);
      try {
        const list = await searchIcons(trimmed, activePrefix, ctrl.signal);
        if (!ctrl.signal.aborted) setResults(list);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
          toast.error("No se pudo buscar iconos. Verifica tu conexión.");
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, activePrefix]);

  // Fetch SVG for the selected icon (with current color/size baked in via API params)
  useEffect(() => {
    if (!selected) {
      setSelectedSvg("");
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    fetchIconSvg(selected.prefix, selected.name, {
      color,
      width: String(size),
      height: String(size),
    })
      .then((svg) => {
        if (!cancelled) setSelectedSvg(svg);
      })
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar el icono.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, color, size]);

  const handleCopySvg = useCallback(async () => {
    if (!selectedSvg) return;
    await navigator.clipboard.writeText(selectedSvg);
    toast.success("SVG copiado al portapapeles");
  }, [selectedSvg]);

  const handleCopyJsx = useCallback(async () => {
    if (!selected || !selectedSvg) return;
    const jsx = svgToJsx(
      selectedSvg,
      toPascalCase(`${selected.prefix}-${selected.name}`),
    );
    await navigator.clipboard.writeText(jsx);
    toast.success("JSX copiado al portapapeles");
  }, [selected, selectedSvg]);

  const handleDownload = useCallback(() => {
    if (!selectedSvg || !selected) return;
    const blob = new Blob([selectedSvg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selected.prefix}-${selected.name}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [selectedSvg, selected]);

  // Keyboard: ⌘C / Ctrl+C copies SVG when an icon is selected; Esc closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = !!target && /INPUT|TEXTAREA/.test(target.tagName);
      if (e.key === "Escape" && selected && !inField) {
        setSelected(null);
        return;
      }
      if (
        selected &&
        !inField &&
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "c"
      ) {
        e.preventDefault();
        handleCopySvg();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, handleCopySvg]);

  // For the grid: use CSS mask-image so each icon renders as currentColor.
  // Works for all monochrome sets in our default list. (Multicolor sets like
  // Twemoji aren't included.) Browser caches the .svg requests automatically.
  const gridIcons = useMemo(
    () =>
      results.map((it) => ({
        ...it,
        url: iconUrl(it.prefix, it.name),
      })),
    [results],
  );

  return (
    <ToolPageShell toolId="icon-finder">
      <div className="space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar iconos… (ej: alert, arrow, user, cart)"
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

        {/* Collection chips */}
        <div className="flex flex-wrap gap-1.5">
          {COLLECTIONS.map((c) => (
            <button
              key={c.prefix || "all"}
              type="button"
              onClick={() => setActivePrefix(c.prefix)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                activePrefix === c.prefix
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground",
              )}
              title={c.hint}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Layout: grid + detail panel */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Grid */}
          <div className="min-h-[400px]">
            {loading && results.length === 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: 24 }, (_, i) => `skeleton-${i}`).map(
                  (k) => (
                    <Skeleton key={k} className="aspect-square rounded-lg" />
                  ),
                )}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/10 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {query.trim()
                    ? "Sin resultados."
                    : "Escribe algo para empezar a buscar."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                  <span>
                    {results.length} {results.length === 1 ? "icono" : "iconos"}
                  </span>
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {gridIcons.map((it) => {
                    const isActive = selected?.full === it.full;
                    return (
                      <button
                        key={it.full}
                        type="button"
                        onClick={() => setSelected(it)}
                        title={it.full}
                        className={cn(
                          "aspect-square rounded-lg border bg-background hover:bg-muted/40 hover:border-primary/40 transition-colors flex items-center justify-center p-3 text-foreground",
                          isActive &&
                            "border-primary bg-primary/5 ring-2 ring-primary/30",
                        )}
                      >
                        <span
                          aria-hidden
                          className="block w-full h-full bg-current"
                          style={{
                            WebkitMask: `url(${it.url}) no-repeat center / contain`,
                            mask: `url(${it.url}) no-repeat center / contain`,
                          }}
                        />
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
              <div className="rounded-xl border bg-background p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold truncate">
                      {selected.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 font-mono text-[10px]"
                    >
                      {selected.prefix}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-muted-foreground hover:text-foreground -mr-1 -mt-1 p-1"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Big preview */}
                <div className="aspect-square rounded-lg border bg-muted/10 flex items-center justify-center p-8">
                  {loadingDetail && !selectedSvg ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : selectedSvg ? (
                    <div
                      className="[&>svg]:max-w-full [&>svg]:max-h-full"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG comes from trusted Iconify API
                      dangerouslySetInnerHTML={{ __html: selectedSvg }}
                    />
                  ) : null}
                </div>

                {/* Controls */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Label className="text-xs">Tamaño</Label>
                      <span className="text-xs font-mono text-muted-foreground">
                        {size}px
                      </span>
                    </div>
                    <Slider
                      value={[size]}
                      onValueChange={(v) =>
                        setSize(Array.isArray(v) ? v[0] : v)
                      }
                      min={16}
                      max={128}
                      step={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-9 w-10 rounded-md border bg-background cursor-pointer"
                      />
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="font-mono text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={handleCopySvg}
                    disabled={!selectedSvg}
                    className="col-span-2"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar SVG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyJsx}
                    disabled={!selectedSvg}
                  >
                    <Code2 className="w-3.5 h-3.5 mr-1.5" /> JSX
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={!selectedSvg}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> .svg
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Tip: pulsa{" "}
                  <kbd className="px-1 py-0.5 rounded bg-muted font-mono">
                    ⌘C
                  </kbd>{" "}
                  para copiar
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center">
                <ImageDown className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Selecciona un icono</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Haz click en cualquier icono para previsualizarlo, ajustar
                  tamaño y color, y copiar el SVG.
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-muted-foreground text-center">
          Iconos servidos vía{" "}
          <a
            href="https://iconify.design"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Iconify
          </a>
          . Cada colección conserva su licencia original (consulta la fuente
          antes de uso comercial).
        </p>
      </div>
    </ToolPageShell>
  );
}
