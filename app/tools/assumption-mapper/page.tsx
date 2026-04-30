"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy, Check, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Quadrant = "validate-first" | "monitor" | "deprioritize" | "safe-bet";

interface Assumption {
  id: string;
  text: string;
  quadrant: Quadrant;
  notes: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

// ─── Quadrant config ──────────────────────────────────────────────────────────

const QUADRANTS: {
  id: Quadrant;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}[] = [
  {
    id: "validate-first",
    label: "Validar primero",
    sublabel: "Alto impacto · Baja certeza",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/8",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  {
    id: "monitor",
    label: "Monitorear",
    sublabel: "Alto impacto · Alta certeza",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  {
    id: "deprioritize",
    label: "Despriorizar",
    sublabel: "Bajo impacto · Baja certeza",
    color: "text-muted-foreground",
    bg: "bg-muted/20",
    border: "border-border/40",
    dot: "bg-muted-foreground",
  },
  {
    id: "safe-bet",
    label: "Apuesta segura",
    sublabel: "Bajo impacto · Alta certeza",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/8",
    border: "border-green-500/20",
    dot: "bg-green-500",
  },
];

const QUADRANT_MAP: Record<string, { x: 0 | 1; y: 0 | 1 }> = {
  "validate-first": { x: 0, y: 1 }, // left, top
  monitor: { x: 1, y: 1 },          // right, top
  deprioritize: { x: 0, y: 0 },     // left, bottom
  "safe-bet": { x: 1, y: 0 },       // right, bottom
};

// ─── Generate export ──────────────────────────────────────────────────────────

function generateExport(assumptions: Assumption[]): string {
  const grouped = QUADRANTS.map((q) => ({
    ...q,
    items: assumptions.filter((a) => a.quadrant === q.id),
  }));

  const date = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  return `# Mapa de Supuestos
Generado el ${date}

---

${grouped
    .map(
      (g) =>
        `## ${g.label} (${g.sublabel})\n\n${
          g.items.length === 0
            ? "_Sin supuestos en este cuadrante_"
            : g.items
                .map(
                  (a, i) =>
                    `${i + 1}. **${a.text}**${a.notes ? `\n   > ${a.notes}` : ""}`
                )
                .join("\n\n")
        }`
    )
    .join("\n\n---\n\n")}

---
*Generado con DesignKit — Assumption Mapper*`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssumptionMapperPage() {
  const [assumptions, setAssumptions] = useState<Assumption[]>([
    { id: uid(), text: "Los usuarios están dispuestos a compartir sus datos financieros", quadrant: "validate-first", notes: "" },
    { id: uid(), text: "La mayoría de los usuarios ya tienen cuenta bancaria digital", quadrant: "safe-bet", notes: "" },
  ]);
  const [newText, setNewText] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"matrix" | "list">("matrix");
  const [copied, setCopied] = useState(false);

  const selectedAssumption = assumptions.find((a) => a.id === selected);

  function addAssumption() {
    if (!newText.trim()) return;
    const id = uid();
    setAssumptions((prev) => [
      ...prev,
      { id, text: newText.trim(), quadrant: "validate-first", notes: "" },
    ]);
    setNewText("");
    setSelected(id);
  }

  function updateAssumption(id: string, patch: Partial<Assumption>) {
    setAssumptions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeAssumption(id: string) {
    setAssumptions((prev) => prev.filter((a) => a.id !== id));
    if (selected === id) setSelected(null);
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateExport(assumptions));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generateExport(assumptions)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assumption-map.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPageShell toolId="assumption-mapper">
      <div className="space-y-6">
        {/* Add assumption */}
        <div className="flex gap-3">
          <Input
            placeholder="Escribe un supuesto... Ej: Los usuarios revisan su saldo diariamente"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAssumption()}
            className="flex-1"
          />
          <Button onClick={addAssumption} disabled={!newText.trim()}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>

        {/* View toggle + export */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 p-1 glass-panel rounded-xl border border-border/40 w-fit">
            {(["matrix", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v === "matrix" ? "Matriz" : "Lista"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center">{assumptions.length} supuestos</span>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Exportar"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" /> .md
            </Button>
          </div>
        </div>

        {view === "matrix" ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            {/* 2×2 matrix */}
            <div className="space-y-2">
              {/* Axis labels */}
              <div className="grid grid-cols-[24px_1fr_1fr] gap-2">
                <div />
                <div className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wide pb-1">Baja certeza</div>
                <div className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wide pb-1">Alta certeza</div>
              </div>
              <div className="grid grid-cols-[24px_1fr_1fr] gap-2">
                {/* Y-axis label: top = high impact */}
                <div className="flex flex-col justify-between items-center py-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide [writing-mode:vertical-rl] rotate-180">
                    Alto impacto
                  </span>
                </div>
                {/* Top row */}
                <QuadrantCell
                  quadrant={QUADRANTS.find((q) => q.id === "validate-first")!}
                  assumptions={assumptions.filter((a) => a.quadrant === "validate-first")}
                  selected={selected}
                  onSelect={setSelected}
                  onMove={(id, q) => updateAssumption(id, { quadrant: q })}
                  onRemove={removeAssumption}
                />
                <QuadrantCell
                  quadrant={QUADRANTS.find((q) => q.id === "monitor")!}
                  assumptions={assumptions.filter((a) => a.quadrant === "monitor")}
                  selected={selected}
                  onSelect={setSelected}
                  onMove={(id, q) => updateAssumption(id, { quadrant: q })}
                  onRemove={removeAssumption}
                />
              </div>
              <div className="grid grid-cols-[24px_1fr_1fr] gap-2">
                <div className="flex flex-col justify-between items-center py-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide [writing-mode:vertical-rl] rotate-180">
                    Bajo impacto
                  </span>
                </div>
                {/* Bottom row */}
                <QuadrantCell
                  quadrant={QUADRANTS.find((q) => q.id === "deprioritize")!}
                  assumptions={assumptions.filter((a) => a.quadrant === "deprioritize")}
                  selected={selected}
                  onSelect={setSelected}
                  onMove={(id, q) => updateAssumption(id, { quadrant: q })}
                  onRemove={removeAssumption}
                />
                <QuadrantCell
                  quadrant={QUADRANTS.find((q) => q.id === "safe-bet")!}
                  assumptions={assumptions.filter((a) => a.quadrant === "safe-bet")}
                  selected={selected}
                  onSelect={setSelected}
                  onMove={(id, q) => updateAssumption(id, { quadrant: q })}
                  onRemove={removeAssumption}
                />
              </div>
            </div>

            {/* Detail panel */}
            {selectedAssumption ? (
              <div className="glass-panel rounded-2xl p-5 border border-border/40 space-y-4 h-fit">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm">Detalle</h3>
                  <button onClick={() => setSelected(null)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm leading-snug">{selectedAssumption.text}</p>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cuadrante</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUADRANTS.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => updateAssumption(selectedAssumption.id, { quadrant: q.id })}
                        className={cn(
                          "p-2 rounded-lg border text-left transition-colors",
                          selectedAssumption.quadrant === q.id
                            ? `${q.bg} ${q.border} ${q.color}`
                            : "border-border/40 hover:border-border text-muted-foreground"
                        )}
                      >
                        <div className="text-xs font-bold">{q.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{q.sublabel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notas</label>
                  <Textarea
                    rows={3}
                    placeholder="¿Por qué asumes esto? ¿Qué evidencia tienes? ¿Cómo lo validarías?"
                    value={selectedAssumption.notes}
                    onChange={(e) => updateAssumption(selectedAssumption.id, { notes: e.target.value })}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => removeAssumption(selectedAssumption.id)}
                >
                  <Trash2 className="h-4 w-4" /> Eliminar supuesto
                </Button>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-5 border border-border/40 flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
                <p className="text-sm text-muted-foreground">Haz clic en un supuesto para editar sus detalles</p>
              </div>
            )}
          </div>
        ) : (
          /* List view */
          <div className="space-y-4">
            {QUADRANTS.map((q) => {
              const items = assumptions.filter((a) => a.quadrant === q.id);
              return (
                <div key={q.id} className={cn("glass-panel rounded-2xl p-5 border space-y-3", q.border)}>
                  <div className="flex items-center gap-2">
                    <div className={cn("size-2.5 rounded-full", q.dot)} />
                    <h3 className={cn("font-bold text-sm", q.color)}>{q.label}</h3>
                    <span className="text-xs text-muted-foreground">— {q.sublabel}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin supuestos</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((a) => (
                        <li key={a.id} className="flex items-start gap-2 group">
                          <span className="text-sm flex-1">{a.text}</span>
                          {a.notes && (
                            <span className="text-xs text-muted-foreground italic max-w-[200px] truncate">{a.notes}</span>
                          )}
                          <button onClick={() => removeAssumption(a.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}

// ─── Quadrant cell ────────────────────────────────────────────────────────────

function QuadrantCell({
  quadrant,
  assumptions,
  selected,
  onSelect,
  onMove,
  onRemove,
}: {
  quadrant: (typeof QUADRANTS)[0];
  assumptions: Assumption[];
  selected: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, q: Quadrant) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={cn("rounded-2xl p-4 border min-h-[200px] space-y-2", quadrant.bg, quadrant.border)}>
      <div className="flex items-center gap-1.5 mb-3">
        <div className={cn("size-2 rounded-full", quadrant.dot)} />
        <span className={cn("text-xs font-bold", quadrant.color)}>{quadrant.label}</span>
      </div>
      {assumptions.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-xl text-xs border transition-colors leading-snug",
            selected === a.id
              ? "bg-primary/10 border-primary text-foreground"
              : "bg-background/60 border-border/30 hover:border-border text-foreground/80 hover:text-foreground"
          )}
        >
          {a.text}
        </button>
      ))}
      {assumptions.length === 0 && (
        <p className="text-[11px] text-muted-foreground/50 italic text-center py-4">Sin supuestos</p>
      )}
    </div>
  );
}
