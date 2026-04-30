'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageDropZone } from '@/components/tools/image-drop-zone';
import { Flame, Loader2, Image as ImageIcon, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function HeatmapAnalyzerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
      if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);
    };
  }, [originalImageUrl, resultImageUrl]);

  const handleImageSelected = useCallback((file: File, url: string) => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);
    setImageFile(file);
    setOriginalImageUrl(url);
    setResultImageUrl(null);
  }, [originalImageUrl, resultImageUrl]);

  const analyzeHeatmap = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/heatmap', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Error en el servidor');

      const blob = await response.blob();
      if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);
      setResultImageUrl(URL.createObjectURL(blob));
      toast.success('¡Análisis completado!');
    } catch {
      toast.error('No se pudo conectar con el microservicio. ¿Está corriendo en el puerto 8000?');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImageUrl) return;
    const a = document.createElement('a');
    a.href = resultImageUrl;
    a.download = `heatmap-${imageFile?.name ?? 'result.jpg'}`;
    a.click();
  };

  return (
    <ToolPageShell toolId="heatmap-analyzer">
      <div className="space-y-6 max-w-4xl mx-auto">
        {!originalImageUrl ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube un diseño o captura de pantalla para analizar su mapa de atención visual."
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border">
              {/* Original */}
              <div className="bg-background p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Diseño original
                  </span>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => {
                      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
                      if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);
                      setImageFile(null); setOriginalImageUrl(null); setResultImageUrl(null);
                    }}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Cambiar
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalImageUrl} alt="Original" className="max-w-full max-h-[400px] object-contain" />
                </div>
              </div>

              {/* Heatmap result */}
              <div className="bg-background p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" /> Mapa de atención
                  </span>
                  {resultImageUrl && !isProcessing && (
                    <Button variant="ghost" size="sm" onClick={downloadResult}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Descargar
                    </Button>
                  )}
                </div>
                <div className="bg-muted/10 rounded-lg flex items-center justify-center min-h-[300px] relative overflow-hidden">
                  {!resultImageUrl && !isProcessing && (
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                      <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Flame className="w-7 h-7 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Listo para analizar</p>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                          El análisis detecta bordes, contraste de color y frecuencia espacial para predecir la atención visual.
                        </p>
                      </div>
                      <Button onClick={analyzeHeatmap} size="lg">
                        <Flame className="w-4 h-4 mr-2" /> Generar Heatmap
                      </Button>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="flex flex-col items-center gap-3 p-8 text-center">
                      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                      <p className="font-medium">Analizando imagen...</p>
                      <p className="text-xs text-muted-foreground">Calculando mapa de saliency con OpenCV</p>
                    </div>
                  )}

                  {resultImageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={resultImageUrl} alt="Heatmap" className="max-w-full max-h-[400px] object-contain" />
                  )}
                </div>
              </div>
            </div>

            {resultImageUrl && !isProcessing && (
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={analyzeHeatmap}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Analizar de nuevo
                </Button>
                <Button onClick={downloadResult}>
                  <Download className="w-4 h-4 mr-2" /> Descargar Heatmap
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
