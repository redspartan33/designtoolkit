'use client';

import { useState, useEffect, useRef } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, RefreshCw, Image as ImageIcon, Type } from 'lucide-react';
import { toast } from 'sonner';

export default function PlaceholderGeneratorPage() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState('#e2e8f0');
  const [textColor, setTextColor] = useState('#64748b');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawPlaceholder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

    const displayText = text || `${width} × ${height}`;
    ctx.fillText(displayText, width / 2, height / 2);
  };

  useEffect(() => {
    drawPlaceholder();
  }, [width, height, bgColor, textColor, text, fontSize]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `placeholder-${width}x${height}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Imagen descargada');
  };

  const handleCopyUrl = async () => {
    const url = `https://placehold.co/${width}x${height}/${bgColor.replace('#', '')}/${textColor.replace('#', '')}.png?text=${encodeURIComponent(text || `${width}x${height}`)}`;
    await navigator.clipboard.writeText(url);
    toast.success('URL de placehold.co copiada al portapapeles');
  };

  return (
    <ToolPageShell toolId="placeholder-generator">
      <div className="grid lg:grid-cols-[400px_1fr] gap-8 max-w-6xl mx-auto">
        {/* Controls */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border bg-card space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ancho (px)</Label>
                <Input 
                  type="number" 
                  value={width} 
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={1} max={4000}
                />
              </div>
              <div className="space-y-2">
                <Label>Alto (px)</Label>
                <Input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={1} max={4000}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Texto (Opcional)</Label>
              <Input 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder={`${width} × ${height}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fondo</Label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-md border cursor-pointer bg-transparent"
                  />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texto</Label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded-md border cursor-pointer bg-transparent"
                  />
                  <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <Label>Tamaño de Fuente</Label>
                <span className="text-muted-foreground font-mono">{fontSize}px</span>
              </div>
              <Slider 
                value={[fontSize]} 
                min={8} max={200} step={1}
                onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
              />
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Button onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" /> Descargar PNG
              </Button>
              <Button variant="outline" onClick={handleCopyUrl} className="w-full">
                <Copy className="w-4 h-4 mr-2" /> Copiar URL Externa
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">💡 Tip:</p>
            <p>Puedes usar los placeholders para maquetar layouts rápidamente antes de tener los assets finales.</p>
            <p>La opción de "Copiar URL" genera un link compatible con servicios como placehold.co.</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" /> Previsualización
            </h3>
            <Badge variant="outline" className="font-mono">{width} × {height}</Badge>
          </div>
          
          <div className="flex-1 min-h-[500px] rounded-2xl border bg-slate-50 dark:bg-slate-950/50 overflow-auto flex items-center justify-center p-8 pattern-dots">
            <div className="shadow-2xl max-w-full">
              <canvas 
                ref={canvasRef} 
                className="max-w-full h-auto bg-white rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
