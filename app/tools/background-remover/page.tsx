'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { ImageDropZone } from '@/components/tools/image-drop-zone';
import { Download, Eraser, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function BackgroundRemoverPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Limpiar URLs al desmontar
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
    setProgress(0);
  }, [originalImageUrl, resultImageUrl]);

  const removeBackground = async () => {
    if (!imageFile || !originalImageUrl) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Importamos dinámicamente para no engordar el bundle inicial
      const imglyRemoveBackground = (await import('@imgly/background-removal')).removeBackground;
      
      toast.info('Procesando imagen, esto puede tomar unos segundos...', {
        id: 'bg-removal',
      });

      const blob = await imglyRemoveBackground(originalImageUrl, {
        publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
        progress: (key, current, total) => {
          // El progreso no siempre es lineal y key indica diferentes etapas (fetch, compute)
          // Aproximamos un progreso general
          if (key.includes('fetch')) {
             setProgress(prev => Math.max(prev, Math.round((current / total) * 30)));
          } else if (key.includes('compute')) {
             setProgress(prev => Math.max(prev, 30 + Math.round((current / total) * 70)));
          }
        }
      });

      const resultUrl = URL.createObjectURL(blob);
      setResultImageUrl(resultUrl);
      toast.success('¡Fondo eliminado con éxito!', { id: 'bg-removal' });
      setProgress(100);
    } catch (error) {
      console.error('Error al remover el fondo:', error);
      toast.error('Ocurrió un error al procesar la imagen.', { id: 'bg-removal' });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImageUrl) return;
    const a = document.createElement('a');
    a.href = resultImageUrl;
    a.download = `removed-bg-${imageFile?.name || 'image.png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ToolPageShell toolId="background-remover">
      <div className="space-y-6 max-w-4xl mx-auto">
        {!originalImageUrl ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube una imagen para remover el fondo 100% en el navegador. Sin subir nada a servidores."
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border">
              {/* Original */}
              <div className="bg-background p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Original
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { setImageFile(null); setOriginalImageUrl(null); setResultImageUrl(null); }} disabled={isProcessing}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Cambiar
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalImageUrl} alt="Original" className="max-w-full max-h-[400px] object-contain" />
                </div>
              </div>

              {/* Resultado */}
              <div className="bg-background p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eraser className="w-4 h-4" /> Sin fondo
                  </span>
                </div>
                <div
                  className="rounded-lg flex items-center justify-center min-h-[300px] relative overflow-hidden"
                  style={{
                    backgroundImage: 'conic-gradient(#e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), conic-gradient(#e5e5e5 25%, white 25%, white 75%, #e5e5e5 75%, #e5e5e5)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px',
                  }}
                >
                  {!resultImageUrl && !isProcessing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Eraser className="w-7 h-7 text-primary" />
                      </div>
                      <Button onClick={removeBackground} size="lg">
                        <Eraser className="w-4 h-4 mr-2" /> Remover Fondo
                      </Button>
                      <p className="text-xs text-muted-foreground max-w-[200px]">
                        La primera vez descarga el modelo de IA (~80 MB), después es instantáneo.
                      </p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <h4 className="font-medium">Procesando...</h4>
                      <div className="w-48 bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${Math.max(5, progress)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{progress}%</p>
                    </div>
                  )}

                  {resultImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultImageUrl} alt="Sin fondo" className="max-w-full max-h-[400px] object-contain relative z-10" />
                  )}
                </div>
              </div>
            </div>

            {resultImageUrl && !isProcessing && (
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={removeBackground}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Volver a procesar
                </Button>
                <Button onClick={downloadResult}>
                  <Download className="w-4 h-4 mr-2" /> Descargar PNG
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
