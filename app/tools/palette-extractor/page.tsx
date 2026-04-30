'use client';

import { useState, useRef, useCallback } from 'react';
import { getColor, getPalette } from 'colorthief';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ImageDropZone } from '@/components/tools/image-drop-zone';
import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaletteExtractorPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<number[][]>([]);
  const [dominantColor, setDominantColor] = useState<number[] | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageSelected = useCallback((_file: File, url: string) => {
    setImageSrc(url);
    setPalette([]);
    setDominantColor(null);
  }, []);

  const extractColors = async () => {
    if (!imgRef.current?.complete) return;
    try {
      const [dominant, pal] = await Promise.all([
        getColor(imgRef.current),
        getPalette(imgRef.current, { colorCount: 8 }),
      ]);
      if (dominant) setDominantColor(dominant.array());
      if (pal) setPalette(pal.map((c: any) => c.array()));
    } catch (e) {
      console.error('Error extracting colors:', e);
    }
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast.success(`${hex} copiado al portapapeles`);
  };

  return (
    <ToolPageShell toolId="palette-extractor">
      <div className="space-y-8 max-w-4xl mx-auto">
        {!imageSrc ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube cualquier imagen para extraer automáticamente sus colores dominantes."
          />
        ) : (
          <>
            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
              {/* Image preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Imagen cargada</h3>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setImageSrc(null); setPalette([]); setDominantColor(null); }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Cambiar
                  </Button>
                </div>
                <div className="rounded-xl border bg-muted/20 overflow-hidden flex items-center justify-center min-h-[220px] max-h-[360px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Imagen para análisis"
                    className="max-h-[360px] max-w-full object-contain"
                    onLoad={extractColors}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            </div>

            {/* Color palette */}
            {dominantColor && palette.length > 0 && (
              <div className="space-y-6">
                {/* Dominant */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Color dominante</h3>
                  <ColorSwatch
                    color={dominantColor}
                    hex={rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2])}
                    onCopy={copyToClipboard}
                    large
                  />
                </div>

                {/* Palette */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Paleta completa</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {palette.map((color, i) => (
                      <ColorSwatch
                        key={i}
                        color={color}
                        hex={rgbToHex(color[0], color[1], color[2])}
                        onCopy={copyToClipboard}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ToolPageShell>
  );
}

function ColorSwatch({
  color, hex, onCopy, large = false
}: { color: number[]; hex: string; onCopy: (h: string) => void; large?: boolean }) {
  const luminance = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
  const textClass = luminance > 0.5 ? 'text-black/70' : 'text-white/80';

  return (
    <div
      className="group relative cursor-pointer rounded-xl overflow-hidden border border-black/5 shadow-sm transition-all hover:scale-105 hover:shadow-md"
      onClick={() => onCopy(hex)}
      title={`Copiar ${hex}`}
    >
      <div
        className={large ? 'h-20' : 'h-12'}
        style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
      />
      <div className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 ${textClass}`}>
        <Copy className="w-3.5 h-3.5" />
        {large && <span className="font-mono text-xs font-semibold">{hex}</span>}
      </div>
      <div className="bg-card px-1.5 py-1 text-center">
        <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
      </div>
    </div>
  );
}
