'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ImageDropZone } from '@/components/tools/image-drop-zone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Download, RefreshCw, Smartphone, Monitor, Laptop, Globe, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DeviceType = 'iphone' | 'macbook' | 'browser' | 'none';

interface DeviceConfig {
  id: DeviceType;
  name: string;
  icon: React.ElementType;
  aspectRatio: string;
  frameClass: string;
}

const DEVICES: DeviceConfig[] = [
  { id: 'iphone', name: 'iPhone 15', icon: Smartphone, aspectRatio: 'aspect-[9/19.5]', frameClass: 'rounded-[3rem] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden' },
  { id: 'macbook', name: 'MacBook Pro', icon: Laptop, aspectRatio: 'aspect-[16/10]', frameClass: 'rounded-lg border-[12px] border-slate-900 shadow-2xl relative overflow-hidden' },
  { id: 'browser', name: 'Browser View', icon: Globe, aspectRatio: 'aspect-[4/3]', frameClass: 'rounded-xl border border-slate-200 shadow-xl relative overflow-hidden' },
  { id: 'none', name: 'Sin Marco', icon: Monitor, aspectRatio: 'aspect-auto', frameClass: 'rounded-lg shadow-lg relative overflow-hidden border border-slate-100' },
];

export default function MockupGeneratorPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('iphone');
  const [isExporting, setIsExporting] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  const handleImageSelected = useCallback((file: File, url: string) => {
    setImageFile(file);
    setImageUrl(url);
  }, []);

  const handleExport = async () => {
    if (!mockupRef.current) return;
    setIsExporting(true);
    toast.info('Generando mockup de alta calidad...');

    try {
      // Usamos html-to-image para exportar el mockup
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(mockupRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: 'transparent',
      });

      const link = document.createElement('a');
      link.download = `mockup-${selectedDevice}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('¡Mockup exportado con éxito!');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar el mockup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
  };

  const currentDevice = DEVICES.find(d => d.id === selectedDevice) || DEVICES[0];

  return (
    <ToolPageShell toolId="mockup-generator">
      <div className="space-y-8 max-w-5xl mx-auto">
        {!imageUrl ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube una captura de pantalla para aplicarle un mockup profesional."
          />
        ) : (
          <>
            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border bg-muted/10">
              <div className="flex items-center gap-2">
                {DEVICES.map((device) => (
                  <Button
                    key={device.id}
                    variant={selectedDevice === device.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDevice(device.id)}
                    className="flex items-center gap-2"
                  >
                    <device.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{device.name}</span>
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Nueva Imagen
                </Button>
                <Button size="sm" onClick={handleExport} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" /> Exportar PNG
                </Button>
              </div>
            </div>

            {/* Preview Stage */}
            <div className="flex justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 relative overflow-hidden min-h-[600px] items-center">
              {/* Background Decoration */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] blur-3xl" />
              </div>

              {/* The Mockup itself */}
              <div 
                ref={mockupRef}
                className={cn(
                  "bg-transparent flex items-center justify-center p-8",
                  selectedDevice === 'none' ? "max-w-4xl" : "max-w-2xl"
                )}
              >
                <div className={cn(currentDevice.frameClass, currentDevice.aspectRatio, "w-full bg-slate-100 dark:bg-slate-800")}>
                  {/* Browser Toolbar Decoration */}
                  {selectedDevice === 'browser' && (
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-1.5 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <div className="mx-4 flex-1 h-5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600" />
                    </div>
                  )}

                  {/* Device Notch for iPhone */}
                  {selectedDevice === 'iphone' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20" />
                  )}

                  {/* The actual image */}
                  <div className="w-full h-full relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imageUrl} 
                      alt="Mockup Content" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border bg-card space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Alta Resolución</h3>
                <p className="text-sm text-muted-foreground text-balance">Exporta mockups en alta calidad (2x pixel ratio) listos para tus presentaciones.</p>
              </div>
              <div className="p-6 rounded-2xl border bg-card space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Diseño Premium</h3>
                <p className="text-sm text-muted-foreground text-balance">Marcos minimalistas y elegantes que resaltan tu producto sin distracciones.</p>
              </div>
              <div className="p-6 rounded-2xl border bg-card space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Local & Privado</h3>
                <p className="text-sm text-muted-foreground text-balance">Todo el procesamiento ocurre en tu navegador. Tus imágenes nunca tocan nuestros servidores.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
