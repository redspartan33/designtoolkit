'use client';

import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ImageDropZone } from '@/components/tools/image-drop-zone';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export default function ImageCompressorPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [quality, setQuality] = useState(0.8);

  const compressImage = useCallback(async (file: File, q: number) => {
    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: file.size / 1024 / 1024,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: q,
      };
      const blob = await imageCompression(file, options);
      const cFile = new File([blob], file.name, { type: file.type });
      setCompressedFile(cFile);
      setCompressedUrl(URL.createObjectURL(cFile));
    } catch (e) {
      console.error('Error compressing:', e);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const handleImageSelected = useCallback((file: File, url: string) => {
    setOriginalFile(file);
    setOriginalUrl(url);
    setCompressedFile(null);
    setCompressedUrl(null);
    compressImage(file, quality);
  }, [quality, compressImage]);

  const handleQualityChange = async (value: number | readonly number[]) => {
    const q = Array.isArray(value) ? (value as readonly number[])[0] : value as number;
    setQuality(q);
    if (originalFile) compressImage(originalFile, q);
  };

  const downloadCompressed = () => {
    if (!compressedUrl || !compressedFile) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    const dot = compressedFile.name.lastIndexOf('.');
    a.download = `${compressedFile.name.slice(0, dot)}-comprimida${compressedFile.name.slice(dot)}`;
    a.click();
  };

  const saving = originalFile && compressedFile
    ? Math.round((1 - compressedFile.size / originalFile.size) * 100)
    : 0;

  return (
    <ToolPageShell toolId="image-compressor">
      <div className="space-y-8 max-w-4xl mx-auto">
        {!originalFile ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Arrastra tu imagen, haz clic para seleccionarla, o pega desde el portapapeles. PNG, JPG y WEBP son soportados."
          />
        ) : (
          <>
            {/* Controls */}
            <div className="flex items-center gap-6 p-4 rounded-xl border bg-muted/20">
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Calidad de compresión</Label>
                  <span className="font-mono text-muted-foreground">{Math.round(quality * 100)}%</span>
                </div>
                <Slider
                  value={[quality]}
                  min={0.1} max={1} step={0.05}
                  onValueChange={handleQualityChange}
                  disabled={isCompressing}
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline" size="sm"
                  onClick={() => { setOriginalFile(null); setOriginalUrl(null); setCompressedFile(null); setCompressedUrl(null); }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Nueva imagen
                </Button>
                <Button onClick={downloadCompressed} disabled={!compressedFile || isCompressing} size="sm">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  {isCompressing ? 'Comprimiendo...' : 'Descargar'}
                </Button>
              </div>
            </div>

            {/* Before / After */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_48px_1fr] gap-4 items-center">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Original</h3>
                  <Badge variant="outline" className="font-mono text-xs">{formatBytes(originalFile.size)}</Badge>
                </div>
                <div className="aspect-video rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl!} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden lg:flex justify-center">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>

              {/* Compressed */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Comprimida</h3>
                  {compressedFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">-{saving}%</span>
                      <Badge className="font-mono text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        {formatBytes(compressedFile.size)}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="aspect-video rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <span className="text-xs">Procesando...</span>
                    </div>
                  ) : compressedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={compressedUrl} alt="Comprimida" className="max-h-full max-w-full object-contain" />
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
