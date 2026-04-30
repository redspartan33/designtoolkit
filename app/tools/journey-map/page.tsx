"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy, Check, Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmotionLevel = 1 | 2 | 3 | 4 | 5;

interface Stage {
  id: string;
  name: string;
  actions: string;
  thoughts: string;
  emotion: EmotionLevel;
  touchpoints: string;
  painPoints: string;
  opportunities: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

const EMOTION_LABELS: Record<EmotionLevel, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😖", label: "Muy frustrado", color: "text-red-500" },
  2: { emoji: "😕", label: "Frustrado", color: "text-orange-500" },
  3: { emoji: "😐", label: "Neutral", color: "text-yellow-500" },
  4: { emoji: "🙂", label: "Satisfecho", color: "text-lime-500" },
  5: { emoji: "😄", label: "Muy satisfecho", color: "text-green-500" },
};

const DEFAULT_STAGES: Stage[] = [
  { id: uid(), name: "Descubrir", actions: "", thoughts: "", emotion: 3, touchpoints: "", painPoints: "", opportunities: "" },
  { id: uid(), name: "Considerar", actions: "", thoughts: "", emotion: 3, touchpoints: "", painPoints: "", opportunities: "" },
  { id: uid(), name: "Usar", actions: "", thoughts: "", emotion: 3, touchpoints: "", painPoints: "", opportunities: "" },
];

const ROW_LABELS = [
  { key: "actions" as const, label: "Acciones", icon: "→", hint: "¿Qué hace el usuario en esta etapa?" },
  { key: "thoughts" as const, label: "Pensamientos", icon: "💭", hint: "¿Qué piensa y siente internamente?" },
  { key: "touchpoints" as const, label: "Touchpoints", icon: "📍", hint: "¿Con qué canales o dispositivos interactúa?" },
  { key: "painPoints" as const, label: "Pain Points", icon: "⚡", hint: "¿Qué lo frustra o bloquea?" },
  { key: "opportunities" as const, label: "Oportunidades", icon: "✦", hint: "¿Cómo podemos mejorar esta experiencia?" },
];

// ─── Export ───────────────────────────────────────────────────────────────────

function generateExport(persona: string, scenario: string, stages: Stage[]): string {
  const date = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  const emotionLine = stages.map((s) => `${EMOTION_LABELS[s.emotion].emoji}`).join(" → ");

  return `# Journey Map
**Persona:** ${persona || "—"}
**Escenario:** ${scenario || "—"}
**Fecha:** ${date}

---

## Curva emocional
${stages.map((s) => `${s.name}: ${EMOTION_LABELS[s.emotion].emoji} ${EMOTION_LABELS[s.emotion].label}`).join("  |  ")}

---

${stages
    .map(
      (s) => `## Etapa: ${s.name}

**Emoción:** ${EMOTION_LABELS[s.emotion].emoji} ${EMOTION_LABELS[s.emotion].label}

**Acciones:**
${s.actions || "—"}

**Pensamientos:**
${s.thoughts || "—"}

**Touchpoints:**
${s.touchpoints || "—"}

**Pain Points:**
${s.painPoints || "—"}

**Oportunidades:**
${s.opportunities || "—"}`
    )
    .join("\n\n---\n\n")}

---
*Generado con DesignKit — Journey Map Builder*`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JourneyMapPage() {
  const [persona, setPersona] = useState("");
  const [scenario, setScenario] = useState("");
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"map" | "export">("map");

  function addStage() {
    setStages((prev) => [
      ...prev,
      { id: uid(), name: `Etapa ${prev.length + 1}`, actions: "", thoughts: "", emotion: 3, touchpoints: "", painPoints: "", opportunities: "" },
    ]);
  }

  function removeStage(id: string) {
    if (stages.length <= 1) return;
    setStages((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStage(id: string, patch: Partial<Stage>) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function toggleRow(key: string) {
    setCollapsedRows((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const exportText = generateExport(persona, scenario, stages);

  function handleCopy() {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([exportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journey-map-${(persona || "usuario").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Emotion curve points for SVG
  const curvePoints = stages.map((s, i) => {
    const x = stages.length === 1 ? 50 : (i / (stages.length - 1)) * 100;
    const y = 100 - (s.emotion / 5) * 80 - 10;
    return { x, y };
  });

  const pathD =
    curvePoints.length < 2
      ? ""
      : curvePoints.reduce((acc, p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = curvePoints[i - 1];
          const cpx = (prev.x + p.x) / 2;
          return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
        }, "");

  return (
    <ToolPageShell toolId="journey-map">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Persona: Ej. Ana, 28, emprendedora"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Escenario: Ej. Primera compra en la app"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2 shrink-0">
          <div className="flex gap-1 p-1 glass-panel rounded-xl border border-border/40">
            {(["map", "export"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v === "map" ? "Mapa" : "Exportar"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "export" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Journey Map exportado</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" /> .md
              </Button>
            </div>
          </div>
          <pre className="glass-panel rounded-2xl p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-[70vh] border border-border/40">
            {exportText}
          </pre>
        </div>
      ) : (
        <div className="space-y-4 overflow-x-auto">
          {/* Emotion curve */}
          <div className="glass-panel rounded-2xl p-5 border border-border/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Curva emocional</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {Object.entries(EMOTION_LABELS).map(([level, { emoji, label }]) => (
                  <span key={level}>{emoji} {label}</span>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 100 100" className="w-full h-20" preserveAspectRatio="none">
              {/* Grid lines */}
              {[1, 2, 3, 4, 5].map((level) => {
                const y = 100 - (level / 5) * 80 - 10;
                return (
                  <line
                    key={level}
                    x1="0" y1={y} x2="100" y2={y}
                    stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5}
                  />
                );
              })}
              {/* Curve */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Points */}
              {curvePoints.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={3} fill="hsl(var(--primary))" />
                  <text
                    x={p.x}
                    y={p.y - 6}
                    textAnchor="middle"
                    fontSize={7}
                    fill="currentColor"
                    opacity={0.6}
                  >
                    {EMOTION_LABELS[stages[i].emotion].emoji}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Main grid */}
          <div className="min-w-[640px]">
            {/* Stage headers */}
            <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `120px repeat(${stages.length}, 1fr) 40px` }}>
              <div />
              {stages.map((stage) => (
                <div key={stage.id} className="glass-panel rounded-xl p-3 border border-border/40 text-center space-y-1">
                  <Input
                    value={stage.name}
                    onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                    className="text-sm font-bold text-center border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {/* Emotion selector */}
                  <div className="flex justify-center gap-1">
                    {([1, 2, 3, 4, 5] as EmotionLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => updateStage(stage.id, { emotion: lvl })}
                        className={cn(
                          "text-base transition-all",
                          stage.emotion === lvl ? "scale-125 opacity-100" : "opacity-30 hover:opacity-70"
                        )}
                        title={EMOTION_LABELS[lvl].label}
                      >
                        {EMOTION_LABELS[lvl].emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div />
            </div>

            {/* Rows */}
            {ROW_LABELS.map((row) => {
              const collapsed = collapsedRows.has(row.key);
              const rowColors: Record<string, string> = {
                actions: "border-blue-500/20 bg-blue-500/5",
                thoughts: "border-purple-500/20 bg-purple-500/5",
                touchpoints: "border-amber-500/20 bg-amber-500/5",
                painPoints: "border-red-500/20 bg-red-500/5",
                opportunities: "border-green-500/20 bg-green-500/5",
              };

              return (
                <div key={row.key} className="mb-2">
                  {/* Row header */}
                  <button
                    onClick={() => toggleRow(row.key)}
                    className="flex items-center gap-2 w-full text-left mb-1 px-1 py-0.5 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    <span className="text-sm">{row.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wide">{row.label}</span>
                    <span className="text-[10px] text-muted-foreground/60">{row.hint}</span>
                    {collapsed ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronUp className="h-3 w-3 ml-auto" />}
                  </button>

                  {!collapsed && (
                    <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${stages.length}, 1fr) 40px` }}>
                      <div className={cn("rounded-xl border p-3 flex items-center justify-center", rowColors[row.key])}>
                        <span className="text-xs font-bold text-muted-foreground text-center leading-tight">{row.label}</span>
                      </div>
                      {stages.map((stage) => (
                        <Textarea
                          key={stage.id}
                          rows={3}
                          placeholder={row.hint}
                          value={stage[row.key] as string}
                          onChange={(e) => updateStage(stage.id, { [row.key]: e.target.value })}
                          className={cn("resize-none text-xs rounded-xl border glass-panel", rowColors[row.key])}
                        />
                      ))}
                      <div />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Stage actions row */}
            <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: `120px repeat(${stages.length}, 1fr) 40px` }}>
              <div />
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => removeStage(stage.id)}
                  disabled={stages.length <= 1}
                  className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-dashed border-border/40 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3 w-3" /> Eliminar etapa
                </button>
              ))}
              <div />
            </div>
          </div>

          {/* Add stage */}
          <Button variant="outline" onClick={addStage} className="w-full border-dashed">
            <Plus className="h-4 w-4" /> Agregar etapa
          </Button>
        </div>
      )}
    </ToolPageShell>
  );
}
