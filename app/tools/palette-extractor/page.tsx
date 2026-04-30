"use client"

import { useState, useRef, useEffect } from "react";
import { getColor, getPalette } from "colorthief";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

export default function PaletteExtractorPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<number[][]>([]);
  const [dominantColor, setDominantColor] = useState<number[] | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setPalette([]);
        setDominantColor(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractColors = async () => {
    if (imgRef.current && imgRef.current.complete) {
      try {
        const dominantResult = await getColor(imgRef.current);
        const paletteResult = await getPalette(imgRef.current, { colorCount: 6 });
        
        if (dominantResult) {
          setDominantColor(dominantResult.array());
        }
        if (paletteResult) {
          setPalette(paletteResult.map((c: any) => c.array()));
        }
      } catch (error) {
        console.error("Error extracting colors:", error);
      }
    }
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Color ${hex} copiado al portapapeles`);
  };

  return (
    <ToolPageShell toolId="palette-extractor">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Sube una imagen</Label>
            <Input id="picture" type="file" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Uploaded"
                className="max-h-full max-w-full object-contain"
                onLoad={extractColors}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Ninguna imagen seleccionada</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <h3 className="text-lg font-medium">Paleta Extraída</h3>
          
          {dominantColor && palette.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Color Dominante</Label>
                <ColorCard 
                  color={dominantColor} 
                  hex={rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2])} 
                  onCopy={copyToClipboard} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Paleta Sugerida</Label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {palette.map((color, i) => (
                    <ColorCard 
                      key={i} 
                      color={color} 
                      hex={rgbToHex(color[0], color[1], color[2])} 
                      onCopy={copyToClipboard} 
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border bg-muted/10 p-8 text-center text-muted-foreground">
              <Upload className="mb-4 h-8 w-8 opacity-20" />
              <p>Sube una imagen para extraer su paleta de colores</p>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}

function ColorCard({ color, hex, onCopy }: { color: number[], hex: string, onCopy: (hex: string) => void }) {
  // Determine if text should be light or dark based on background luminance
  const luminance = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
  const textColor = luminance > 0.5 ? "text-black" : "text-white";

  return (
    <div 
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-sm transition-all hover:scale-105"
      onClick={() => onCopy(hex)}
    >
      <div 
        className="h-24 w-full" 
        style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
      />
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100 ${textColor}`}>
        <Copy className="mb-1 h-5 w-5" />
        <span className="font-mono text-sm font-medium">{hex}</span>
      </div>
      <div className="flex items-center justify-between border-t bg-card p-2 text-xs">
        <span className="font-mono text-muted-foreground">{hex}</span>
      </div>
    </div>
  );
}
