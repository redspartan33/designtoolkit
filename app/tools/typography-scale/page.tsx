"use client";

import { useState, useMemo } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScaleStep {
  name: string;
  size: number;
  lineHeight: number;
  letterSpacing: number;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const RATIO_PRESETS = [
  { label: "Minor Second", value: 1.067 },
  { label: "Major Second", value: 1.125 },
  { label: "Minor Third", value: 1.2 },
  { label: "Major Third", value: 1.25 },
  { label: "Perfect Fourth", value: 1.333 },
  { label: "Augmented Fourth", value: 1.414 },
  { label: "Perfect Fifth", value: 1.5 },
  { label: "Golden Ratio", value: 1.618 },
];

const STEP_NAMES = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];

const UNIT_OPTIONS = ["px", "rem", "em"] as const;
type Unit = (typeof UNIT_OPTIONS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function toUnit(px: number, unit: Unit, base: number): string {
  if (unit === "px") return `${round2(px)}px`;
  if (unit === "rem") return `${round2(px / base)}rem`;
  return `${round2(px / base)}em`;
}

function lineHeightFor(px: number): number {
  // Tighter at large sizes, more airy at small
  if (px <= 14) return 1.6;
  if (px <= 18) return 1.5;
  if (px <= 24) return 1.4;
  if (px <= 32) return 1.3;
  if (px <= 48) return 1.2;
  return 1.1;
}

function letterSpacingFor(px: number): number {
  // Looser at small, tighter at headings
  if (px <= 12) return 0.04;
  if (px <= 16) return 0.01;
  if (px <= 24) return 0;
  if (px <= 36) return -0.02;
  return -0.04;
}

function buildScale(
  base: number,
  ratio: number,
  steps: number
): ScaleStep[] {
  const result: ScaleStep[] = [];
  // Steps below base: negative indices
  // steps total: steps above base + some below
  const above = steps - 3; // e.g. 6 above base
  const below = 2; // 2 below base (xs, sm)

  for (let i = -below; i <= above; i++) {
    const px = base * Math.pow(ratio, i);
    result.push({
      name: STEP_NAMES[i + below] ?? `step-${i}`,
      size: round2(px),
      lineHeight: lineHeightFor(px),
      letterSpacing: letterSpacingFor(px),
    });
  }
  return result;
}

function generateCSS(
  scale: ScaleStep[],
  unit: Unit,
  base: number,
  font: string
): string {
  const vars = scale
    .map((s) => `  --text-${s.name}: ${toUnit(s.size, unit, base)};`)
    .join("\n");

  const classes = scale
    .map(
      (s) => `.text-${s.name} {\n  font-size: ${toUnit(s.size, unit, base)};\n  line-height: ${s.lineHeight};\n  letter-spacing: ${s.letterSpacing}em;\n}`
    )
    .join("\n\n");

  return `:root {\n${vars}\n  --font-base: ${base}px;\n  --font-family: ${font || "inherit"};\n}\n\n${classes}`;
}

function generateTokensJSON(
  scale: ScaleStep[],
  unit: Unit,
  base: number
): string {
  const tokens: Record<string, unknown> = {};
  scale.forEach((s) => {
    tokens[s.name] = {
      value: toUnit(s.size, unit, base),
      lineHeight: s.lineHeight,
      letterSpacing: `${s.letterSpacing}em`,
      type: "typography",
    };
  });
  return JSON.stringify({ typography: { scale: tokens } }, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TypographyScalePage() {
  const [baseSize, setBaseSize] = useState(16);
  const [ratio, setRatio] = useState(1.25);
  const [steps, setSteps] = useState(9);
  const [unit, setUnit] = useState<Unit>("rem");
  const [font, setFont] = useState("Inter, sans-serif");
  const [exportFormat, setExportFormat] = useState<"css" | "json">("css");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState("The quick brown fox jumps over the lazy dog");

  const scale = useMemo(
    () => buildScale(baseSize, ratio, steps),
    [baseSize, ratio, steps]
  );

  const exportCode =
    exportFormat === "css"
      ? generateCSS(scale, unit, baseSize, font)
      : generateTokensJSON(scale, unit, baseSize);

  function handleCopy() {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const ext = exportFormat === "css" ? "css" : "json";
    const blob = new Blob([exportCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `typography-scale.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPageShell toolId="typography-scale">
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8">
        {/* ── Controls ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-5">
            <h3 className="font-bold text-base">Configuración</h3>

            <div className="space-y-2">
              <Label>Tamaño base</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={24}
                  step={1}
                  value={baseSize}
                  onChange={(e) => setBaseSize(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-mono w-12 text-right">{baseSize}px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ratio</Label>
              <div className="flex flex-wrap gap-1.5">
                {RATIO_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setRatio(p.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs border transition-colors",
                      ratio === p.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {p.label}
                    <span className="ml-1 opacity-60">×{p.value}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs text-muted-foreground">Custom:</Label>
                <Input
                  type="number"
                  min={1.01}
                  max={2}
                  step={0.001}
                  value={ratio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  className="h-8 w-24 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidad de salida</Label>
              <div className="flex gap-2">
                {UNIT_OPTIONS.map((u) => (
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

            <div className="space-y-2">
              <Label>Fuente (preview)</Label>
              <Input
                value={font}
                onChange={(e) => setFont(e.target.value)}
                placeholder="Inter, sans-serif"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Texto de preview</Label>
              <Input
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                placeholder="The quick brown fox…"
                className="text-sm"
              />
            </div>
          </div>

          {/* Export */}
          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-4">
            <h3 className="font-bold text-base">Exportar</h3>
            <div className="flex gap-2">
              {(["css", "json"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setExportFormat(f)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-sm font-mono border transition-colors uppercase",
                    exportFormat === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {f}
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

        {/* ── Scale Preview ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Escala Tipográfica</h3>
            <span className="text-xs text-muted-foreground font-mono">
              ratio ×{ratio} · base {baseSize}px
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-1 overflow-x-auto">
            {[...scale].reverse().map((step) => (
              <ScaleRow
                key={step.name}
                step={step}
                unit={unit}
                base={baseSize}
                font={font}
                preview={preview}
                isBase={step.name === "base"}
              />
            ))}
          </div>

          {/* Info table */}
          <div className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border/30 bg-muted/20">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Step</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">px</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">{unit}</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Line-h</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Tracking</th>
                </tr>
              </thead>
              <tbody>
                {[...scale].reverse().map((step, i) => (
                  <tr
                    key={step.name}
                    className={cn(
                      "border-b border-border/20 last:border-0",
                      step.name === "base" && "bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      <span className={cn("font-bold", step.name === "base" && "text-primary")}>
                        {step.name}
                      </span>
                      {step.name === "base" && (
                        <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">base</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-right text-muted-foreground">{step.size}</td>
                    <td className="px-4 py-2 font-mono text-xs text-right">{toUnit(step.size, unit, baseSize)}</td>
                    <td className="px-4 py-2 font-mono text-xs text-right text-muted-foreground">{step.lineHeight}</td>
                    <td className="px-4 py-2 font-mono text-xs text-right text-muted-foreground">{step.letterSpacing}em</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

// ─── Scale row ────────────────────────────────────────────────────────────────

function ScaleRow({
  step,
  unit,
  base,
  font,
  preview,
  isBase,
}: {
  step: ScaleStep;
  unit: Unit;
  base: number;
  font: string;
  preview: string;
  isBase: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-4 py-2 px-3 rounded-xl transition-colors",
        isBase ? "bg-primary/5" : "hover:bg-muted/20"
      )}
    >
      <span className={cn("font-mono text-xs w-8 shrink-0 text-muted-foreground", isBase && "text-primary font-bold")}>
        {step.name}
      </span>
      <span
        className="flex-1 leading-none truncate"
        style={{
          fontSize: `${step.size}px`,
          lineHeight: step.lineHeight,
          letterSpacing: `${step.letterSpacing}em`,
          fontFamily: font,
        }}
      >
        {preview}
      </span>
      <span className="font-mono text-xs text-muted-foreground shrink-0">
        {toUnit(step.size, unit, base)}
      </span>
    </div>
  );
}
