"use client";

import { useState, useMemo } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Unit = "px" | "rem" | "em";
type Method = "multiples" | "fibonacci" | "custom";

interface SpacingStep {
  name: string;
  px: number;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const BASE_PRESETS = [4, 8, 10, 16];

const NAMING_SYSTEMS = [
  {
    id: "tshirt",
    label: "T-shirt (xs–3xl)",
    names: ["0", "1", "2", "3", "4", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
  },
  {
    id: "numeric",
    label: "Numérico (0–11)",
    names: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
  },
  {
    id: "tailwind",
    label: "Tailwind-style",
    names: ["0", "0.5", "1", "1.5", "2", "3", "4", "6", "8", "10", "12", "16"],
  },
];

const STEP_COUNT_OPTIONS = [8, 10, 12, 14];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function toUnit(px: number, unit: Unit, base: number): string {
  if (unit === "px") return `${round2(px)}px`;
  if (unit === "rem") return `${round2(px / base)}rem`;
  return `${round2(px / base)}em`;
}

function buildMultiplesScale(base: number, steps: number): number[] {
  // 0, base*0.5, base, base*2, base*3, base*4, base*6, base*8...
  const multipliers = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
  return multipliers.slice(0, steps).map((m) => round2(base * m));
}

function buildFibonacciScale(base: number, steps: number): number[] {
  const fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
  return fibs.slice(0, steps).map((f) => round2(f * (base / 8)));
}

function applyNames(values: number[], system: (typeof NAMING_SYSTEMS)[0]): SpacingStep[] {
  return values.map((px, i) => ({
    name: system.names[i] ?? `${i}`,
    px,
  }));
}

function generateCSS(steps: SpacingStep[], unit: Unit, base: number): string {
  const vars = steps
    .map((s) => `  --spacing-${s.name}: ${toUnit(s.px, unit, base)};`)
    .join("\n");
  return `:root {\n${vars}\n}`;
}

function generateTailwindConfig(steps: SpacingStep[], unit: Unit, base: number): string {
  const entries = steps
    .map((s) => `    "${s.name}": "${toUnit(s.px, unit, base)}"`)
    .join(",\n");
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      spacing: {\n${entries}\n      }\n    }\n  }\n}`;
}

function generateJSON(steps: SpacingStep[], unit: Unit, base: number): string {
  const tokens: Record<string, unknown> = {};
  steps.forEach((s) => {
    tokens[s.name] = { value: toUnit(s.px, unit, base), type: "spacing" };
  });
  return JSON.stringify({ spacing: tokens }, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpacingScalePage() {
  const [baseSize, setBaseSize] = useState(8);
  const [method, setMethod] = useState<Method>("multiples");
  const [stepCount, setStepCount] = useState(12);
  const [unit, setUnit] = useState<Unit>("rem");
  const [namingId, setNamingId] = useState("tshirt");
  const [exportFormat, setExportFormat] = useState<"css" | "tailwind" | "json">("css");
  const [copied, setCopied] = useState(false);

  const namingSystem = NAMING_SYSTEMS.find((n) => n.id === namingId) ?? NAMING_SYSTEMS[0];

  const steps = useMemo<SpacingStep[]>(() => {
    const values =
      method === "fibonacci"
        ? buildFibonacciScale(baseSize, stepCount)
        : buildMultiplesScale(baseSize, stepCount);
    return applyNames(values, namingSystem);
  }, [baseSize, method, stepCount, namingSystem]);

  const exportCode = useMemo(() => {
    if (exportFormat === "css") return generateCSS(steps, unit, baseSize);
    if (exportFormat === "tailwind") return generateTailwindConfig(steps, unit, baseSize);
    return generateJSON(steps, unit, baseSize);
  }, [steps, exportFormat, unit, baseSize]);

  function handleCopy() {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const ext = exportFormat === "tailwind" ? "js" : exportFormat === "json" ? "json" : "css";
    const blob = new Blob([exportCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spacing-scale.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPageShell toolId="spacing-scale">
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8">
        {/* ── Controls ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-5">
            <h3 className="font-bold text-base">Configuración</h3>

            {/* Base */}
            <div className="space-y-2">
              <Label>Unidad base</Label>
              <div className="flex gap-2">
                {BASE_PRESETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBaseSize(b)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-sm font-mono border transition-colors",
                      baseSize === b
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {b}px
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                max={32}
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
                className="h-8 font-mono text-sm"
              />
            </div>

            {/* Method */}
            <div className="space-y-2">
              <Label>Método</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "multiples", label: "Múltiplos", desc: "base × 0, 0.5, 1, 2…" },
                    { id: "fibonacci", label: "Fibonacci", desc: "0, 1, 1, 2, 3, 5, 8…" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "p-3 rounded-xl text-left border transition-colors",
                      method === m.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step count */}
            <div className="space-y-2">
              <Label>Número de pasos</Label>
              <div className="flex gap-2">
                {STEP_COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setStepCount(n)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-sm font-mono border transition-colors",
                      stepCount === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Naming */}
            <div className="space-y-2">
              <Label>Sistema de nombres</Label>
              <div className="space-y-1.5">
                {NAMING_SYSTEMS.map((ns) => (
                  <button
                    key={ns.id}
                    onClick={() => setNamingId(ns.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors",
                      namingId === ns.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <span className="font-medium">{ns.label}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {ns.names.slice(0, 5).join(", ")}…
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Output unit */}
            <div className="space-y-2">
              <Label>Unidad de salida</Label>
              <div className="flex gap-2">
                {(["px", "rem", "em"] as Unit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-sm font-mono border transition-colors",
                      unit === u
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-4">
            <h3 className="font-bold text-base">Exportar</h3>
            <div className="flex gap-2">
              {(["css", "tailwind", "json"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setExportFormat(f)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-mono border transition-colors uppercase",
                    exportFormat === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {f === "tailwind" ? "TW" : f}
                </button>
              ))}
            </div>
            <pre className="bg-muted/30 rounded-xl p-4 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed border border-border/30">
              {exportCode}
            </pre>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Descargar
              </Button>
            </div>
          </div>
        </div>

        {/* ── Visual Scale ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Escala de Espaciado</h3>
            <span className="text-xs text-muted-foreground font-mono">
              base {baseSize}px · {stepCount} pasos
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-3">
            {steps.map((step) => (
              <SpacingRow
                key={step.name}
                step={step}
                unit={unit}
                base={baseSize}
                maxPx={steps[steps.length - 1].px || 1}
              />
            ))}
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function SpacingRow({
  step,
  unit,
  base,
  maxPx,
}: {
  step: SpacingStep;
  unit: Unit;
  base: number;
  maxPx: number;
}) {
  const pct = maxPx > 0 ? Math.max((step.px / maxPx) * 100, 0) : 0;

  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-xs w-10 shrink-0 text-muted-foreground text-right">
        {step.name}
      </span>
      <div className="flex-1 h-6 bg-muted/20 rounded-md overflow-hidden">
        <div
          className="h-full bg-primary/60 rounded-md transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-3 shrink-0 text-right">
        <span className="font-mono text-xs text-muted-foreground w-12">{step.px}px</span>
        <span className="font-mono text-xs font-medium w-16">{toUnit(step.px, unit, base)}</span>
      </div>
    </div>
  );
}
