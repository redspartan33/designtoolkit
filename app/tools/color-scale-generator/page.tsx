'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Color math ────────────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
  };
  return [f(0), f(8), f(4)];
}

function getContrastColor(hex: string): string {
  const [, , l] = hexToHsl(hex);
  return l > 55 ? '#000000' : '#ffffff';
}

// ── Scale generation ──────────────────────────────────────────────────────────

type ScaleMode = 'tailwind' | 'pastel' | 'vivid' | 'neutral';

const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const MODE_CONFIG: Record<ScaleMode, { label: string; description: string }> = {
  tailwind: { label: 'Tailwind', description: 'Escala similar a Tailwind CSS' },
  pastel: { label: 'Pastel', description: 'Tonos suaves y desaturados' },
  vivid: { label: 'Vívido', description: 'Saturación máxima en todo el rango' },
  neutral: { label: 'Neutral', description: 'Escala grisácea con matiz sutil' },
};

function generateScale(baseHex: string, steps: number[], mode: ScaleMode): { step: number; hex: string }[] {
  const [h, s, l] = hexToHsl(baseHex);

  return steps.map((step) => {
    const t = step / 1000; // 0..0.95

    let newH = h;
    let newS = s;
    let newL = 0;

    if (mode === 'tailwind') {
      // Light end: high L, slightly desaturated | Dark end: low L, slightly more saturated
      newL = Math.round(97 - t * 90);
      newS = Math.round(Math.max(10, Math.min(100, s - (t < 0.5 ? (0.5 - t) * 20 : (t - 0.5) * 10))));
      newH = h + (t < 0.5 ? (0.5 - t) * 4 : 0); // slight hue shift toward warmer at light end
    } else if (mode === 'pastel') {
      newL = Math.round(97 - t * 70);
      newS = Math.round(Math.min(60, s * 0.6));
    } else if (mode === 'vivid') {
      newL = Math.round(97 - t * 88);
      newS = Math.min(100, Math.round(s * 1.15));
    } else {
      // neutral: desaturate heavily
      newL = Math.round(97 - t * 90);
      newS = Math.round(s * 0.25);
    }

    newH = ((newH % 360) + 360) % 360;
    newS = Math.max(0, Math.min(100, newS));
    newL = Math.max(2, Math.min(98, newL));

    return { step, hex: hslToHex(newH, newS, newL) };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PaletteRow {
  id: string;
  name: string;
  base: string;
  mode: ScaleMode;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

const INITIAL_PALETTES: PaletteRow[] = [
  { id: uid(), name: 'Primary', base: '#6366f1', mode: 'tailwind' },
  { id: uid(), name: 'Accent', base: '#ec4899', mode: 'vivid' },
];

type CopyFormat = 'hex' | 'hsl' | 'rgb' | 'tailwind';

const FORMAT_LABELS: Record<CopyFormat, string> = {
  hex: 'HEX',
  hsl: 'HSL',
  rgb: 'RGB',
  tailwind: 'Tailwind',
};

function colorToFormat(hex: string, format: CopyFormat, name: string, step: number): string {
  const [h, s, l] = hexToHsl(hex);
  const [r, g, b] = hslToRgb(h, s, l);
  switch (format) {
    case 'hex': return hex;
    case 'hsl': return `hsl(${h}, ${s}%, ${l}%)`;
    case 'rgb': return `rgb(${r}, ${g}, ${b})`;
    case 'tailwind': return `'${name.toLowerCase()}-${step}': '${hex}'`;
  }
}

function exportCss(palettes: PaletteRow[]): string {
  const lines: string[] = [':root {'];
  palettes.forEach((pal) => {
    const scale = generateScale(pal.base, SCALE_STEPS, pal.mode);
    scale.forEach(({ step, hex }) => {
      const [h, s, l] = hexToHsl(hex);
      lines.push(`  --color-${pal.name.toLowerCase()}-${step}: ${h} ${s}% ${l}%;`);
    });
  });
  lines.push('}');
  return lines.join('\n');
}

export default function ColorScaleGeneratorPage() {
  const [palettes, setPalettes] = useState<PaletteRow[]>(INITIAL_PALETTES);
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('hex');
  const [steps] = useState(SCALE_STEPS);

  const addPalette = () => {
    setPalettes((prev) => [
      ...prev,
      { id: uid(), name: `Color ${prev.length + 1}`, base: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'), mode: 'tailwind' },
    ]);
  };

  const removePalette = (id: string) => {
    if (palettes.length <= 1) { toast.error('Necesitas al menos una paleta.'); return; }
    setPalettes((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePalette = (id: string, patch: Partial<Omit<PaletteRow, 'id'>>) => {
    setPalettes((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  };

  const handleCopyCell = async (hex: string, name: string, step: number) => {
    const value = colorToFormat(hex, copyFormat, name, step);
    await navigator.clipboard.writeText(value);
    toast.success(`Copiado: ${value}`);
  };

  const handleExportCss = async () => {
    const css = exportCss(palettes);
    await navigator.clipboard.writeText(css);
    toast.success('Variables CSS copiadas al portapapeles.');
  };

  return (
    <ToolPageShell toolId="color-scale-generator">
      <div className="space-y-6">
        {/* Top toolbar */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Label className="text-sm font-medium">Formato al copiar:</Label>
            {(Object.keys(FORMAT_LABELS) as CopyFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setCopyFormat(f)}
                className={cn(
                  'px-3 py-1 rounded-md border text-xs font-mono font-semibold transition-all',
                  copyFormat === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted',
                )}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCss}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Exportar CSS vars
            </Button>
            <Button size="sm" onClick={addPalette}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva paleta
            </Button>
          </div>
        </div>

        {/* Palette configs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {palettes.map((pal) => (
            <div key={pal.id} className="p-3 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={pal.base}
                  onChange={(e) => updatePalette(pal.id, { base: e.target.value })}
                  className="w-8 h-8 rounded-md border cursor-pointer bg-transparent shrink-0"
                />
                <Input
                  value={pal.name}
                  onChange={(e) => updatePalette(pal.id, { name: e.target.value })}
                  className="h-8 text-sm font-medium"
                  placeholder="Nombre"
                />
                <Input
                  value={pal.base}
                  onChange={(e) => updatePalette(pal.id, { base: e.target.value })}
                  className="h-8 font-mono text-xs w-28"
                  placeholder="#6366f1"
                />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removePalette(pal.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(MODE_CONFIG) as ScaleMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => updatePalette(pal.id, { mode: m })}
                    className={cn(
                      'px-2 py-0.5 rounded border text-xs font-medium transition-all',
                      pal.mode === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted',
                    )}
                    title={MODE_CONFIG[m].description}
                  >
                    {MODE_CONFIG[m].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Scale grids */}
        {palettes.map((pal) => {
          const scale = generateScale(pal.base, steps, pal.mode);
          return (
            <div key={pal.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{pal.name}</h3>
                <Badge variant="outline" className="font-mono text-xs">{pal.base}</Badge>
                <Badge variant="outline" className="text-xs">{MODE_CONFIG[pal.mode].label}</Badge>
              </div>
              <div className="grid grid-cols-11 gap-0 rounded-xl overflow-hidden border">
                {scale.map(({ step, hex }) => {
                  const contrastColor = getContrastColor(hex);
                  return (
                    <button
                      key={step}
                      onClick={() => handleCopyCell(hex, pal.name, step)}
                      className="group flex flex-col items-center justify-end pb-2 pt-8 relative transition-all hover:scale-105 hover:z-10 hover:shadow-lg"
                      style={{ background: hex }}
                      title={`${pal.name}-${step}: ${hex} — clic para copiar`}
                    >
                      <span className="text-[10px] font-bold font-mono opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: contrastColor }}>
                        {step}
                      </span>
                      <span className="text-[9px] font-mono opacity-0 group-hover:opacity-80 transition-opacity absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap" style={{ color: contrastColor }}>
                        {hex}
                      </span>
                      <Copy className="w-2.5 h-2.5 absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: contrastColor }} />
                    </button>
                  );
                })}
              </div>
              {/* Step labels */}
              <div className="grid grid-cols-11 gap-0">
                {scale.map(({ step }) => (
                  <div key={step} className="text-center text-[10px] font-mono text-muted-foreground py-0.5">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center">
          Haz clic en cualquier color para copiarlo en el formato seleccionado. Las escalas se generan algorítmicamente en el espacio de color HSL.
        </p>
      </div>
    </ToolPageShell>
  );
}
