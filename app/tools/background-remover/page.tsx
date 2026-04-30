'use client';

import { useState, useRef, useEffect } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Download, Eraser, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function BackgroundRemoverPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
  };

  const removeBackground = async () => {
    if (!imageFile || !originalImageUrl) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Importamos dinámicamente para no engordar el bundle inicial
      const imglyRemoveBackground = (await import('@imgly/background-removal')).default;
      
      toast.info('Procesando imagen, esto puede tomar unos segundos...', {
        id: 'bg-removal',
      });

      const blob = await imglyRemoveBackground(originalImageUrl, {
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
      <div className="space-y-8 max-w-4xl mx-auto">
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
                <h3 className="text-xl font-medium mb-2">Sube una imagen</h3>
                <p className="text-muted-foreground max-w-sm">
                  Haz clic para seleccionar una imagen desde tu dispositivo. El procesamiento se hará 100% en tu navegador.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-px bg-border">
                {/* Original */}
                <div className="bg-background p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Original
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
                      <Eraser className="w-4 h-4" /> Resultado
                    </span>
                  </div>
                  <div className="flex-1 rounded-lg flex items-center justify-center min-h-[300px] relative overflow-hidden"
                       style={{
                         backgroundImage: 'conic-gradient(#ececec 25%, transparent 25%, transparent 75%, #ececec 75%, #ececec)',
                         backgroundSize: '20px 20px',
                         backgroundPosition: '0 0, 10px 10px'
                       }}>
                    
                    {!resultImageUrl && !isProcessing && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                        <Button onClick={removeBackground} size="lg" className="shadow-lg">
                          <Eraser className="w-5 h-5 mr-2" />
                          Remover Fondo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4 max-w-[200px]">
                          La primera vez que uses esta herramienta puede tardar unos segundos en descargar el modelo de IA.
                        </p>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <h4 className="font-medium mb-2">Procesando imagen...</h4>
                        <div className="w-full max-w-[200px] bg-secondary rounded-full h-2 overflow-hidden mb-2">
                          <div 
                            className="bg-primary h-full transition-all duration-300 ease-out" 
                            style={{ width: `${Math.max(5, progress)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{progress}%</p>
                      </div>
                    )}

                    {resultImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resultImageUrl} alt="Resultado" className="max-w-full max-h-[400px] object-contain relative z-10" />
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

        {resultImageUrl && !isProcessing && (
          <div className="flex justify-center">
            <Button onClick={downloadResult} size="lg" className="w-full md:w-auto min-w-[250px]">
              <Download className="w-5 h-5 mr-2" />
              Descargar Imagen (PNG)
            </Button>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
