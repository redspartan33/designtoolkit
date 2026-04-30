'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ImageDropZone } from '@/components/tools/image-drop-zone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Download, RefreshCw, ArrowUpToLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SCALE_OPTIONS = [2, 3, 4];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Upscale an image using canvas with imageSmoothingQuality='high' (bilinear). */
async function upscaleImage(
  file: File,
  scale: number,
  sharpness: number,
): Promise<{ url: string; width: number; height: number; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const originalUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(originalUrl);
      const newW = Math.round(img.naturalWidth * scale);
      const newH = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newW, newH);

      // Optional unsharp-mask style sharpening via pixel manipulation
      if (sharpness > 0) {
        const imageData = ctx.getImageData(0, 0, newW, newH);
        const data = imageData.data;
        const strength = sharpness * 0.6; // scale to reasonable range
        // Simple 3x3 sharpen kernel approximation
        const kernel = [
          0, -strength, 0,
          -strength, 1 + 4 * strength, -strength,
          0, -strength, 0,
        ];
        const copy = new Uint8ClampedArray(data);
        for (let y = 1; y < newH - 1; y++) {
          for (let x = 1; x < newW - 1; x++) {
            const idx = (y * newW + x) * 4;
            for (let c = 0; c < 3; c++) {
              let val = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const ni = ((y + ky) * newW + (x + kx)) * 4 + c;
                  val += copy[ni] * kernel[(ky + 1) * 3 + (kx + 1)];
                }
              }
              data[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          resolve({
            url: URL.createObjectURL(blob),
            width: newW,
            height: newH,
            size: blob.size,
          });
        },
        'image/png',
      );
    };
    img.onerror = reject;
    img.src = originalUrl;
  });
}

export default function ImageUpscalerPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<{ width: number; height: number; size: number } | null>(null);
  const [scale, setScale] = useState(2);
  const [sharpness, setSharpness] = useState(0.3);
  const [isProcessing, setIsProcessing] = useState(false);
  const resultUrlRef = useRef<string | null>(null);

  const handleImageSelected = useCallback((file: File, url: string) => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    setOriginalFile(file);
    setOriginalUrl(url);
    setResultUrl(null);
    setResultMeta(null);
    // get dims
    const img = new Image();
    img.onload = () => setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, []);

  const handleUpscale = async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    toast.info('Escalando imagen…', { id: 'upscale' });
    try {
      const result = await upscaleImage(originalFile, scale, sharpness);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = result.url;
      setResultUrl(result.url);
      setResultMeta({ width: result.width, height: result.height, size: result.size });
      toast.success(`¡Imagen escalada a ${result.width}×${result.height}!`, { id: 'upscale' });
    } catch (e) {
      console.error(e);
      toast.error('Error al escalar la imagen.', { id: 'upscale' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !originalFile) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const base = originalFile.name.replace(/\.[^.]+$/, '');
    a.download = `${base}-${scale}x-upscaled.png`;
    a.click();
  };

  const handleReset = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    setOriginalFile(null);
    setOriginalUrl(null);
    setOriginalDims(null);
    setResultUrl(null);
    setResultMeta(null);
  };

  return (
    <ToolPageShell toolId="image-upscaler">
      <div className="space-y-6 max-w-4xl mx-auto">
        {!originalFile ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube una imagen para aumentar su resolución. El proceso ocurre 100% en tu navegador."
          />
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-muted/20 items-end">
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Factor de escala</Label>
                  <div className="flex gap-2">
                    {SCALE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setScale(s)}
                        className={`px-4 py-1.5 rounded-lg border text-sm font-mono font-semibold transition-all ${
                          scale === s
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <Label>Nitidez</Label>
                    <span className="font-mono text-muted-foreground">{Math.round(sharpness * 100)}%</span>
                  </div>
                  <Slider
                    value={[sharpness]}
                    min={0} max={1} step={0.05}
                    onValueChange={(v) => setSharpness(Array.isArray(v) ? v[0] : v)}
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleReset} disabled={isProcessing}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Nueva imagen
                </Button>
                <Button size="sm" onClick={handleUpscale} disabled={isProcessing}>
                  {isProcessing ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Procesando…</>
                  ) : (
                    <><ArrowUpToLine className="w-3.5 h-3.5 mr-1" /> Escalar {scale}×</>
                  )}
                </Button>
                {resultUrl && (
                  <Button size="sm" variant="secondary" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Descargar PNG
                  </Button>
                )}
              </div>
            </div>

            {/* Preview grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Original</h3>
                  {originalDims && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {originalDims.w}×{originalDims.h} · {formatBytes(originalFile.size)}
                    </Badge>
                  )}
                </div>
                <div className="aspect-video rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl!} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              {/* Result */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Resultado {scale}×</h3>
                  {resultMeta && (
                    <Badge className="font-mono text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                      {resultMeta.width}×{resultMeta.height} · {formatBytes(resultMeta.size)}
                    </Badge>
                  )}
                </div>
                <div className="aspect-video rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs">Escalando imagen…</span>
                    </div>
                  ) : resultUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultUrl} alt="Escalada" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-6">
                      <ArrowUpToLine className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Configura los parámetros y presiona <strong>Escalar</strong></p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info footer */}
            <p className="text-xs text-muted-foreground text-center">
              El upscaler usa interpolación bilineal de alta calidad del navegador con post-procesado de nitidez. Para mejores resultados usa imágenes nítidas como punto de partida.
            </p>
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
