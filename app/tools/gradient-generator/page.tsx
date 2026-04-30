'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Copy, Download, Plus, Trash2, RefreshCw, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type GradientType = 'linear' | 'radial' | 'conic';

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function buildGradientCss(
  type: GradientType,
  angle: number,
  stops: ColorStop[],
): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopStr = sorted.map((s) => `${s.color} ${s.position}%`).join(', ');
  if (type === 'linear') return `linear-gradient(${angle}deg, ${stopStr})`;
  if (type === 'radial') return `radial-gradient(circle, ${stopStr})`;
  return `conic-gradient(from ${angle}deg, ${stopStr})`;
}

const DEFAULT_STOPS: ColorStop[] = [
  { id: uid(), color: '#6366f1', position: 0 },
  { id: uid(), color: '#ec4899', position: 100 },
];

const TYPE_LABELS: Record<GradientType, string> = {
  linear: 'Lineal',
  radial: 'Radial',
  conic: 'Cónico',
};

const PRESETS: { label: string; type: GradientType; angle: number; stops: Omit<ColorStop, 'id'>[] }[] = [
  { label: 'Purpura', type: 'linear', angle: 135, stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }] },
  { label: 'Ocaso', type: 'linear', angle: 90, stops: [{ color: '#f093fb', position: 0 }, { color: '#f5576c', position: 100 }] },
  { label: 'Océano', type: 'linear', angle: 45, stops: [{ color: '#4facfe', position: 0 }, { color: '#00f2fe', position: 100 }] },
  { label: 'Selva', type: 'linear', angle: 45, stops: [{ color: '#43e97b', position: 0 }, { color: '#38f9d7', position: 100 }] },
  { label: 'Fuego', type: 'linear', angle: 90, stops: [{ color: '#fa709a', position: 0 }, { color: '#fee140', position: 100 }] },
  { label: 'Cósmico', type: 'radial', angle: 0, stops: [{ color: '#0f0c29', position: 0 }, { color: '#302b63', position: 50 }, { color: '#24243e', position: 100 }] },
  { label: 'Aurora', type: 'conic', angle: 0, stops: [{ color: '#6ee7b7', position: 0 }, { color: '#3b82f6', position: 33 }, { color: '#9333ea', position: 66 }, { color: '#6ee7b7', position: 100 }] },
  { label: 'Noir', type: 'linear', angle: 135, stops: [{ color: '#1a1a2e', position: 0 }, { color: '#16213e', position: 50 }, { color: '#0f3460', position: 100 }] },
];

export default function GradientGeneratorPage() {
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>(DEFAULT_STOPS);
  const [selectedStop, setSelectedStop] = useState<string>(DEFAULT_STOPS[0].id);

  const css = buildGradientCss(type, angle, stops);
  const fullCss = `background: ${css};`;

  const addStop = () => {
    const mid = stops.length > 0 ? Math.round(stops.reduce((a, s) => a + s.position, 0) / stops.length) : 50;
    setStops((prev) => [...prev, { id: uid(), color: '#ffffff', position: mid }]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) { toast.error('Necesitas al menos 2 paradas.'); return; }
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, patch: Partial<Omit<ColorStop, 'id'>>) => {
    setStops((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setType(preset.type);
    setAngle(preset.angle);
    const newStops = preset.stops.map((s) => ({ ...s, id: uid() }));
    setStops(newStops);
    setSelectedStop(newStops[0].id);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullCss);
    toast.success('CSS copiado al portapapeles.');
  };

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d')!;
    const sorted = [...stops].sort((a, b) => a.position - b.position);

    if (type === 'linear') {
      const rad = (angle * Math.PI) / 180;
      const x1 = canvas.width / 2 - Math.cos(rad) * canvas.width;
      const y1 = canvas.height / 2 - Math.sin(rad) * canvas.height;
      const x2 = canvas.width / 2 + Math.cos(rad) * canvas.width;
      const y2 = canvas.height / 2 + Math.sin(rad) * canvas.height;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      sorted.forEach((s) => grad.addColorStop(s.position / 100, s.color));
      ctx.fillStyle = grad;
    } else if (type === 'radial') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.max(canvas.width, canvas.height) / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      sorted.forEach((s) => grad.addColorStop(s.position / 100, s.color));
      ctx.fillStyle = grad;
    } else {
      // Conic: fill with solid first color as fallback
      ctx.fillStyle = sorted[0].color;
    }

    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gradient.png';
      a.click();
    }, 'image/png');
  };

  return (
    <ToolPageShell toolId="gradient-generator">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Preview */}
        <div
          className="w-full rounded-2xl border overflow-hidden transition-all duration-500"
          style={{ background: css, minHeight: '220px' }}
        />

        {/* CSS output */}
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-muted/40 border rounded-lg px-4 py-2.5 overflow-x-auto whitespace-nowrap">
            {fullCss}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar CSS
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> PNG
          </Button>
        </div>

        {/* Controls row */}
        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Left: type + angle */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de gradiente</Label>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(TYPE_LABELS) as GradientType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium text-left transition-all',
                      type === t
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {type !== 'radial' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <Label>Ángulo</Label>
                  <span className="font-mono text-muted-foreground">{angle}°</span>
                </div>
                <Slider value={[angle]} min={0} max={360} step={1} onValueChange={(v) => setAngle(Array.isArray(v) ? v[0] : v)} />
              </div>
            )}
          </div>

          {/* Right: color stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Paradas de color</Label>
              <Button variant="outline" size="sm" onClick={addStop}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
              </Button>
            </div>
            <div className="space-y-2">
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStop(stop.id)}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer',
                    selectedStop === stop.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30',
                  )}
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                    className="w-8 h-8 rounded-md border cursor-pointer bg-transparent"
                    title="Color"
                  />
                  <Input
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                    className="font-mono text-xs h-8 w-28"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Posición</span>
                      <span className="font-mono">{stop.position}%</span>
                    </div>
                    <Slider
                      value={[stop.position]}
                      min={0} max={100} step={1}
                      onValueChange={(v) => updateStop(stop.id, { position: Array.isArray(v) ? v[0] : v })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); removeStop(stop.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Presets</Label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className="group flex flex-col items-center gap-1.5"
                title={preset.label}
              >
                <div
                  className="w-full h-10 rounded-lg border transition-all group-hover:scale-105 group-hover:shadow-md"
                  style={{ background: buildGradientCss(preset.type, preset.angle, preset.stops.map((s) => ({ ...s, id: '' }))) }}
                />
                <span className="text-xs text-muted-foreground">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
