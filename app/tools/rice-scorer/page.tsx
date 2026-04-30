"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Copy, Check, Download, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  name: string;
  notes: string;
  reach: number;      // users per period
  impact: Impact;     // multiplier
  confidence: number; // %
  effort: number;     // person-months
}

type Impact = 0.25 | 0.5 | 1 | 2 | 3;

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

const IMPACT_OPTIONS: { value: Impact; label: string; desc: string }[] = [
  { value: 3, label: "Masivo", desc: "3×" },
  { value: 2, label: "Alto", desc: "2×" },
  { value: 1, label: "Medio", desc: "1×" },
  { value: 0.5, label: "Bajo", desc: "0.5×" },
  { value: 0.25, label: "Mínimo", desc: "0.25×" },
];

const IMPACT_COLORS: Record<Impact, string> = {
  3: "text-green-600 dark:text-green-400",
  2: "text-lime-600 dark:text-lime-400",
  1: "text-amber-600 dark:text-amber-400",
  0.5: "text-orange-600 dark:text-orange-400",
  0.25: "text-red-600 dark:text-red-400",
};

const DEFAULT_ITEMS: Item[] = [
  { id: uid(), name: "Onboarding rediseñado", notes: "", reach: 500, impact: 2, confidence: 80, effort: 2 },
  { id: uid(), name: "Notificaciones push", notes: "", reach: 2000, impact: 0.5, confidence: 60, effort: 1 },
  { id: uid(), name: "Dashboard analytics", notes: "", reach: 200, impact: 3, confidence: 90, effort: 4 },
];

function riceScore(item: Item): number {
  if (item.effort === 0) return 0;
  return Math.round((item.reach * item.impact * (item.confidence / 100)) / item.effort);
}

function generateExport(items: Item[]): string {
  const sorted = [...items].sort((a, b) => riceScore(b) - riceScore(a));
  const date = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  return `# RICE Score — Priorización de Features
Fecha: ${date}

| Rank | Feature | Reach | Impact | Confidence | Effort | RICE |
|------|---------|-------|--------|-----------|--------|------|
${sorted.map((item, i) => `| ${i + 1} | ${item.name} | ${item.reach} | ${item.impact}× | ${item.confidence}% | ${item.effort} | **${riceScore(item)}** |`).join("\n")}

---

## Detalle

${sorted.map((item, i) => `### ${i + 1}. ${item.name}
- **RICE Score:** ${riceScore(item)}
- **Reach:** ${item.reach.toLocaleString()} usuarios/período
- **Impact:** ${IMPACT_OPTIONS.find((o) => o.value === item.impact)?.label} (${item.impact}×)
- **Confidence:** ${item.confidence}%
- **Effort:** ${item.effort} persona-mes${item.effort !== 1 ? "es" : ""}${item.notes ? `\n- **Notas:** ${item.notes}` : ""}`).join("\n\n")}

---
*Generado con DesignKit — RICE Scorer*`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RiceScorerPage() {
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sorted = [...items].sort((a, b) => riceScore(b) - riceScore(a));
  const maxScore = Math.max(...items.map(riceScore), 1);

  function addItem() {
    const id = uid();
    setItems((prev) => [...prev, { id, name: "Nueva feature", notes: "", reach: 100, impact: 1, confidence: 80, effort: 1 }]);
    setEditingId(id);
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateExport(items));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generateExport(items)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rice-scores.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  const editing = items.find((i) => i.id === editingId);

  return (
    <ToolPageShell toolId="rice-scorer">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">

        {/* ── Ranking ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Priorización RICE</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                RICE = (Reach × Impact × Confidence) ÷ Effort
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Exportar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" /> .md
              </Button>
              <Button size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </div>
          </div>

          {/* RICE formula explainer */}
          <div className="glass-panel rounded-2xl p-4 border border-border/40 grid grid-cols-4 gap-3 text-center text-sm">
            {[
              { label: "Reach", desc: "¿A cuántos usuarios impacta por período?" },
              { label: "Impact", desc: "¿Cuánto mueve la métrica objetivo?" },
              { label: "Confidence", desc: "¿Qué tan seguros estamos de los estimados?" },
              { label: "Effort", desc: "¿Cuánto cuesta en persona-meses?" },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="font-bold text-primary">{f.label}</div>
                <div className="text-xs text-muted-foreground leading-snug">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Ranked list */}
          <div className="space-y-2">
            {sorted.map((item, rank) => {
              const score = riceScore(item);
              const barPct = maxScore > 0 ? (score / maxScore) * 100 : 0;
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "glass-panel rounded-2xl border transition-all",
                    isEditing ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-border"
                  )}
                >
                  {/* Summary row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setEditingId(isEditing ? null : item.id)}
                  >
                    {/* Rank badge */}
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                      rank === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {rank + 1}
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="font-semibold text-sm truncate">{item.name}</div>
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Score + params */}
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="hidden sm:flex gap-3 text-xs text-muted-foreground font-mono">
                        <span title="Reach">{item.reach.toLocaleString()}</span>
                        <span className={IMPACT_COLORS[item.impact]} title="Impact">{item.impact}×</span>
                        <span title="Confidence">{item.confidence}%</span>
                        <span title="Effort">/{item.effort}m</span>
                      </div>
                      <div className="text-2xl font-black font-mono text-primary w-16 text-right">{score}</div>
                      {isEditing ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded edit */}
                  {isEditing && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nombre de la feature">
                          <Input value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} />
                        </Field>
                        <Field label="Reach — usuarios por período">
                          <Input type="number" min={0} value={item.reach} onChange={(e) => updateItem(item.id, { reach: Number(e.target.value) })} className="font-mono" />
                        </Field>
                      </div>

                      <Field label="Impact">
                        <div className="flex gap-2">
                          {IMPACT_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateItem(item.id, { impact: opt.value })}
                              className={cn(
                                "flex-1 py-2 rounded-xl border text-xs font-medium transition-colors",
                                item.impact === opt.value
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary/40"
                              )}
                            >
                              <div>{opt.label}</div>
                              <div className="opacity-60">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </Field>

                      <div className="grid grid-cols-2 gap-4">
                        <Field label={`Confidence — ${item.confidence}%`} hint="¿Qué tan seguros estamos?">
                          <input
                            type="range" min={10} max={100} step={10}
                            value={item.confidence}
                            onChange={(e) => updateItem(item.id, { confidence: Number(e.target.value) })}
                            className="w-full accent-primary"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>10% (intuición)</span><span>100% (certeza)</span>
                          </div>
                        </Field>
                        <Field label="Effort (persona-meses)">
                          <Input type="number" min={0.25} step={0.25} value={item.effort} onChange={(e) => updateItem(item.id, { effort: Number(e.target.value) })} className="font-mono" />
                        </Field>
                      </div>

                      <Field label="Notas (opcional)">
                        <Textarea rows={2} placeholder="Contexto, dependencias, links..." value={item.notes} onChange={(e) => updateItem(item.id, { notes: e.target.value })} />
                      </Field>

                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button variant="outline" className="w-full border-dashed" onClick={addItem}>
            <Plus className="h-4 w-4" /> Nueva feature
          </Button>
        </div>

        {/* ── Guide panel ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="font-bold">Guía de estimación</h3>

          <div className="glass-panel rounded-2xl p-5 border border-border/40 space-y-4">
            <GuideSection title="Reach" color="text-blue-500">
              <p>Usuarios únicos que se verán impactados en el próximo trimestre (o período que uses como referencia). Usa datos reales si los tienes.</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <GuideBox label="Pequeño" value="< 100" />
                <GuideBox label="Medio" value="100 – 1K" />
                <GuideBox label="Grande" value="1K – 10K" />
                <GuideBox label="Masivo" value="> 10K" />
              </div>
            </GuideSection>

            <GuideSection title="Impact" color="text-green-500">
              <div className="space-y-1.5 text-xs">
                {IMPACT_OPTIONS.map((o) => (
                  <div key={o.value} className="flex items-center justify-between">
                    <span className={IMPACT_COLORS[o.value]}>{o.desc} — {o.label}</span>
                  </div>
                ))}
              </div>
            </GuideSection>

            <GuideSection title="Confidence" color="text-amber-500">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong className="text-foreground">100%</strong> — Datos cuantitativos y cualitativos sólidos</p>
                <p><strong className="text-foreground">80%</strong> — Investigación cualitativa o datos parciales</p>
                <p><strong className="text-foreground">50%</strong> — Solo hipótesis / feeling</p>
                <p><strong className="text-foreground">20%</strong> — Alta incertidumbre</p>
              </div>
            </GuideSection>

            <GuideSection title="Effort" color="text-red-500">
              <p>Suma de persona-meses de todo el equipo (diseño + ingeniería + QA). Si tarda 2 ingenieros 1 mes = 2 persona-meses.</p>
            </GuideSection>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-border/40">
            <h4 className="text-sm font-bold mb-2">¿Cómo leer el score?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El número absoluto no importa — lo que importa es la <strong className="text-foreground">posición relativa</strong>. Un score de 500 vs 50 significa que la primera feature debería ir primero en el roadmap. Usa el score como punto de conversación, no como verdad absoluta.
            </p>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function GuideSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className={cn("text-sm font-bold", color)}>{title}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function GuideBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 text-center">
      <div className="font-mono text-foreground">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
