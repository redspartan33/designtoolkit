'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Upload, Zap, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OptimizeResult {
  output: string;
  originalSize: number;
  optimizedSize: number;
}

interface SvgoPlugin {
  name: string;
  label: string;
  description: string;
  default: boolean;
}

const PLUGINS: SvgoPlugin[] = [
  { name: 'removeDoctype', label: 'DOCTYPE', description: 'Eliminar DOCTYPE', default: true },
  { name: 'removeXMLProcInst', label: 'XML PI', description: 'Eliminar instrucciones XML', default: true },
  { name: 'removeComments', label: 'Comentarios', description: 'Eliminar comentarios', default: true },
  { name: 'removeMetadata', label: 'Metadata', description: 'Eliminar <metadata>', default: true },
  { name: 'removeUselessDefs', label: 'Defs vacíos', description: 'Eliminar <defs> sin uso', default: true },
  { name: 'cleanupIds', label: 'IDs', description: 'Limpiar y minimizar IDs', default: true },
  { name: 'removeUselessStrokeAndFill', label: 'Stroke/Fill', description: 'Eliminar stroke/fill redundantes', default: true },
  { name: 'removeEmptyAttrs', label: 'Attrs vacíos', description: 'Eliminar atributos vacíos', default: true },
  { name: 'removeEmptyContainers', label: 'Contenedores vacíos', description: 'Eliminar elementos vacíos', default: true },
  { name: 'collapseGroups', label: 'Grupos', description: 'Colapsar grupos innecesarios', default: true },
  { name: 'convertPathData', label: 'Path data', description: 'Optimizar datos de paths', default: true },
  { name: 'mergePaths', label: 'Merge paths', description: 'Fusionar paths compatibles', default: false },
  { name: 'removeHiddenElems', label: 'Ocultos', description: 'Eliminar elementos ocultos', default: false },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

async function runSvgo(svgString: string, enabledPlugins: string[]): Promise<OptimizeResult> {
  const { optimize } = await import('svgo/browser');
  // svgo v4: plugins must be CustomPlugin or built-in name strings.
  // We use preset-default with overrides for the named built-ins.
  // For plugins not in preset-default (like mergePaths, removeHiddenElems) we append them.
  const PRESET_DEFAULT_PLUGINS = [
    'removeDoctype', 'removeXMLProcInst', 'removeComments', 'removeMetadata',
    'removeUselessDefs', 'cleanupIds', 'removeUselessStrokeAndFill',
    'removeEmptyAttrs', 'removeEmptyContainers', 'collapseGroups', 'convertPathData',
  ];
  const extra = enabledPlugins.filter((n) => !PRESET_DEFAULT_PLUGINS.includes(n));
  const overrides: Record<string, false> = {};
  PRESET_DEFAULT_PLUGINS.forEach((name) => {
    if (!enabledPlugins.includes(name)) overrides[name] = false;
  });

  const result = optimize(svgString, {
    multipass: true,
    plugins: [
      { name: 'preset-default', params: { overrides } },
      ...extra.map((name) => name as 'mergePaths' | 'removeHiddenElems'),
    ],
  });
  return {
    output: result.data,
    originalSize: new Blob([svgString]).size,
    optimizedSize: new Blob([result.data]).size,
  };
}

export default function SvgOptimizerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [enabledPlugins, setEnabledPlugins] = useState<Set<string>>(
    new Set(PLUGINS.filter((p) => p.default).map((p) => p.name)),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      toast.error('Por favor selecciona un archivo SVG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInput(ev.target?.result as string ?? '');
      setResult(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOptimize = async () => {
    const trimmed = input.trim();
    if (!trimmed) { toast.error('Pega o sube un SVG primero.'); return; }
    if (!trimmed.includes('<svg')) { toast.error('El contenido no parece un SVG válido.'); return; }
    setIsOptimizing(true);
    try {
      const r = await runSvgo(trimmed, Array.from(enabledPlugins));
      setResult(r);
      const saving = Math.round((1 - r.optimizedSize / r.originalSize) * 100);
      toast.success(`SVG optimizado. Ahorro: ${saving}%`);
    } catch (err) {
      console.error(err);
      toast.error('Error al optimizar. Verifica que el SVG sea válido.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.output);
    toast.success('Copiado al portapapeles.');
  }, [result]);

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.output], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'optimized.svg';
    a.click();
  };

  const togglePlugin = (name: string) => {
    setEnabledPlugins((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
    setResult(null);
  };

  const saving = result ? Math.round((1 - result.optimizedSize / result.originalSize) * 100) : 0;

  return (
    <ToolPageShell toolId="svg-optimizer">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top actions */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir SVG
            </Button>
            <Button size="sm" onClick={handleOptimize} disabled={isOptimizing || !input.trim()}>
              {isOptimizing ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Optimizando…</>
              ) : (
                <><Zap className="w-3.5 h-3.5 mr-1.5" /> Optimizar</>
              )}
            </Button>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono">
                -{saving}% · {formatBytes(result.originalSize)} → {formatBytes(result.optimizedSize)}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar
              </Button>
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar
              </Button>
            </div>
          )}
        </div>

        {/* Plugins config */}
        <div className="p-4 rounded-xl border bg-muted/20">
          <h3 className="text-sm font-semibold mb-3">Plugins de optimización</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PLUGINS.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <Switch
                  id={`plugin-${p.name}`}
                  checked={enabledPlugins.has(p.name)}
                  onCheckedChange={() => togglePlugin(p.name)}
                />
                <Label htmlFor={`plugin-${p.name}`} className="text-xs cursor-pointer leading-tight">
                  <span className="font-medium">{p.label}</span>
                  <br />
                  <span className="text-muted-foreground">{p.description}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Editors */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">SVG Original</Label>
              <div className="flex gap-2 items-center">
                {input && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatBytes(new Blob([input]).size)}
                  </Badge>
                )}
                {input && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setInput(''); setResult(null); }}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Limpiar
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setResult(null); }}
              placeholder={'<svg xmlns="http://www.w3.org/2000/svg" ...>\n  <!-- Pega tu SVG aquí -->\n</svg>'}
              className="font-mono text-xs min-h-[340px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">SVG Optimizado</Label>
              {result && (
                <Badge className="font-mono text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  {formatBytes(result.optimizedSize)}
                </Badge>
              )}
            </div>
            <Textarea
              value={result?.output ?? ''}
              readOnly
              placeholder="El resultado aparecerá aquí después de optimizar…"
              className="font-mono text-xs min-h-[340px] resize-none bg-muted/10"
            />
          </div>
        </div>

        {/* Preview */}
        {(input || result) && (
          <div className="grid md:grid-cols-2 gap-4">
            {input.includes('<svg') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vista previa original</Label>
                <div
                  className="min-h-[160px] rounded-xl border bg-muted/10 flex items-center justify-center p-4"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: input }}
                />
              </div>
            )}
            {result && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vista previa optimizada</Label>
                <div
                  className="min-h-[160px] rounded-xl border bg-muted/10 flex items-center justify-center p-4"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: result.output }}
                />
              </div>
            )}
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" accept=".svg,image/svg+xml" onChange={handleFileUpload} />
      </div>
    </ToolPageShell>
  );
}
