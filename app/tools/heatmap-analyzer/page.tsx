'use client';

import { useState, useRef, useEffect } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Flame, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HeatmapAnalyzerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar URLs al desmontar
  useEffect(() => {
    return () => {
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
      if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);
    };
  }, [originalImageUrl, resultImageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);

    setImageFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setResultImageUrl(null);
  };

  const analyzeHeatmap = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      // Enviamos la imagen a nuestro endpoint de Next.js que se comunicará con el microservicio FastAPI
      const response = await fetch('/api/heatmap', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error en el servidor al procesar la imagen');
      }

      // Esperamos que el servidor devuelva la imagen generada como blob
      const blob = await response.blob();
      const resultUrl = URL.createObjectURL(blob);
      setResultImageUrl(resultUrl);
      toast.success('¡Análisis completado!', { id: 'heatmap' });
    } catch (error) {
      console.error('Error al analizar heatmap:', error);
      toast.error('Ocurrió un error al procesar la imagen o el microservicio no está activo.', { id: 'heatmap' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolPageShell toolId="heatmap-analyzer">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3 text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Esta herramienta requiere el microservicio local</p>
            <p>
              A diferencia de otras herramientas, el Heatmap Analyzer utiliza un modelo de IA pesado (Hugging Face SUM) que corre en un microservicio de Python (FastAPI). Asegúrate de tenerlo corriendo en el puerto correspondiente.
            </p>
          </div>
        </div>

        <Card className="border-dashed border-2 shadow-sm overflow-hidden bg-muted/20">
          <CardContent className="p-0">
            {!originalImageUrl ? (
              <div 
                className="flex flex-col items-center justify-center py-24 px-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Sube un diseño</h3>
                <p className="text-muted-foreground max-w-sm">
                  Haz clic para seleccionar una interfaz o diseño. Prediremos dónde se centrará la atención visual.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-px bg-border">
                {/* Original */}
                <div className="bg-background p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Diseño Original
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                      Cambiar
                    </Button>
                  </div>
                  <div className="flex-1 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden min-h-[300px] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={originalImageUrl} alt="Original" className="max-w-full max-h-[400px] object-contain" />
                  </div>
                </div>

                {/* Resultado */}
                <div className="bg-background p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" /> Heatmap Predictivo
                    </span>
                  </div>
                  <div className="flex-1 bg-muted/10 rounded-lg flex items-center justify-center min-h-[300px] relative overflow-hidden">
                    
                    {!resultImageUrl && !isProcessing && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                        <Button onClick={analyzeHeatmap} size="lg" className="shadow-lg">
                          <Flame className="w-5 h-5 mr-2 text-orange-500" />
                          Generar Heatmap
                        </Button>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <h4 className="font-medium mb-2">Analizando con el modelo IA...</h4>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                          Esto puede tomar unos segundos dependiendo de la potencia de tu equipo.
                        </p>
                      </div>
                    )}

                    {resultImageUrl && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={originalImageUrl} alt="Original de fondo" className="max-w-full max-h-[400px] object-contain absolute opacity-50" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resultImageUrl} alt="Heatmap" className="max-w-full max-h-[400px] object-contain relative mix-blend-multiply dark:mix-blend-screen" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  );
}
