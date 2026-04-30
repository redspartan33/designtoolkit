'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ImageDropZone } from '@/components/tools/image-drop-zone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Format = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

const FORMATS: { label: string; mime: Format; ext: string; lossy: boolean }[] = [
  { label: 'PNG', mime: 'image/png', ext: 'png', lossy: false },
  { label: 'JPG', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  { label: 'WEBP', mime: 'image/webp', ext: 'webp', lossy: true },
  { label: 'AVIF', mime: 'image/avif', ext: 'avif', lossy: true },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

async function convertImage(file: File, targetFormat: Format, quality: number) {
  return new Promise<{ url: string; size: number }>((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Conversion failed'));
          resolve({ url: URL.createObjectURL(blob), size: blob.size });
        },
        targetFormat,
        quality,
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}

export default function FormatConverterPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<Format>('image/webp');
  const [quality, setQuality] = useState(0.85);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleImageSelected = useCallback((file: File, url: string) => {
    setOriginalFile(file);
    setOriginalUrl(url);
    setResultUrl(null);
    setResultSize(null);
  }, []);

  const handleConvert = async () => {
    if (!originalFile) return;
    setIsConverting(true);
    toast.info('Convirtiendo…', { id: 'convert' });
    try {
      const { url, size } = await convertImage(originalFile, targetFormat, quality);
      setResultUrl(url);
      setResultSize(size);
      const fmt = FORMATS.find((f) => f.mime === targetFormat)!;
      const saving = Math.round((1 - size / originalFile.size) * 100);
      toast.success(
        saving > 0 ? `Convertido a ${fmt.label}! Ahorro: ${saving}%` : `Convertido a ${fmt.label}!`,
        { id: 'convert' },
      );
    } catch (e) {
      console.error(e);
      toast.error('Error al convertir. Tu navegador puede no soportar este formato.', { id: 'convert' });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !originalFile) return;
    const fmt = FORMATS.find((f) => f.mime === targetFormat)!;
    const base = originalFile.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${base}.${fmt.ext}`;
    a.click();
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setResultSize(null);
  };

  const selectedFmt = FORMATS.find((f) => f.mime === targetFormat)!;
  const saving = originalFile && resultSize ? Math.round((1 - resultSize / originalFile.size) * 100) : null;

  return (
    <ToolPageShell toolId="format-converter">
      <div className="space-y-6 max-w-4xl mx-auto">
        {!originalFile ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube una imagen para convertir su formato. Soporta PNG, JPG, WEBP y AVIF."
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-muted/20 items-end">
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Formato destino</Label>
                  <div className="flex gap-2 flex-wrap">
                    {FORMATS.map((f) => (
                      <button
                        key={f.mime}
                        onClick={() => { setTargetFormat(f.mime); setResultUrl(null); setResultSize(null); }}
                        className={`px-4 py-1.5 rounded-lg border text-sm font-mono font-semibold transition-all ${
                          targetFormat === f.mime
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedFmt.lossy && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <Label>Calidad</Label>
                      <span className="font-mono text-muted-foreground">{Math.round(quality * 100)}%</span>
                    </div>
                    <Slider
                      value={[quality]}
                      min={0.1} max={1} step={0.05}
                      onValueChange={(v) => { const val = Array.isArray(v) ? v[0] : v; setQuality(val); setResultUrl(null); setResultSize(null); }}
                      disabled={isConverting}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleReset} disabled={isConverting}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Nueva imagen
                </Button>
                <Button size="sm" onClick={handleConvert} disabled={isConverting}>
                  {isConverting ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Convirtiendo…</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Convertir</>
                  )}
                </Button>
                {resultUrl && (
                  <Button size="sm" variant="secondary" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Descargar
                  </Button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Original</h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {originalFile.name.split('.').pop()?.toUpperCase()} · {formatBytes(originalFile.size)}
                  </Badge>
                </div>
                <div className="aspect-video rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl!} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Resultado · {selectedFmt.label}</h3>
                  {resultSize !== null && (
                    <div className="flex items-center gap-2">
                      {saving !== null && saving > 0 && (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">-{saving}%</span>
                      )}
                      <Badge className="font-mono text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        {formatBytes(resultSize)}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="aspect-video rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {isConverting ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs">Convirtiendo…</span>
                    </div>
                  ) : resultUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultUrl} alt="Convertida" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-6">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Selecciona el formato y presiona <strong>Convertir</strong></p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Conversión 100% local via Canvas API. AVIF puede no estar disponible en todos los navegadores.
            </p>
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
