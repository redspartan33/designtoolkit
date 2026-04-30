"use client"

import { useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// WCAG Contrast calculation functions
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export default function ContrastCheckerPage() {
  const [foreground, setForeground] = useState("#FFFFFF");
  const [background, setBackground] = useState("#000000");

  const ratio = getContrastRatio(foreground, background);
  
  // WCAG levels
  const AA_Normal = ratio >= 4.5;
  const AA_Large = ratio >= 3.0;
  const AAA_Normal = ratio >= 7.0;
  const AAA_Large = ratio >= 4.5;

  return (
    <ToolPageShell toolId="contrast-checker">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Colores</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="foreground">Color de Texto (Foreground)</Label>
                <div className="flex gap-2">
                  <Input
                    id="foreground-color"
                    type="color"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    className="h-10 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    id="foreground"
                    type="text"
                    value={foreground.toUpperCase()}
                    onChange={(e) => setForeground(e.target.value)}
                    className="flex-1 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">Color de Fondo (Background)</Label>
                <div className="flex gap-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="h-10 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    id="background"
                    type="text"
                    value={background.toUpperCase()}
                    onChange={(e) => setBackground(e.target.value)}
                    className="flex-1 uppercase font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Accesibilidad WCAG</h3>
            <div className="grid grid-cols-2 gap-4">
              <WCAGCard title="AA Texto Normal" pass={AA_Normal} />
              <WCAGCard title="AA Texto Grande" pass={AA_Large} />
              <WCAGCard title="AAA Texto Normal" pass={AAA_Normal} />
              <WCAGCard title="AAA Texto Grande" pass={AAA_Large} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Texto grande se considera 18pt (24px) normal o 14pt (18.66px) negrita.
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-medium">Previsualización</h3>
          <div 
            className="flex-1 min-h-[300px] rounded-xl border flex flex-col p-8 transition-colors duration-200"
            style={{ backgroundColor: background, color: foreground }}
          >
            <div className="flex justify-between items-center mb-10">
              <span className="font-bold text-2xl tracking-tight">DesignKit</span>
              <div className="flex gap-4 font-medium">
                <span className="opacity-80 hover:opacity-100 cursor-pointer">Inicio</span>
                <span className="opacity-80 hover:opacity-100 cursor-pointer">Proyectos</span>
                <span className="opacity-80 hover:opacity-100 cursor-pointer">Acerca</span>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto text-center space-y-6">
              <h1 className="text-5xl font-bold tracking-tight">Texto Grande</h1>
              <p className="text-lg opacity-90 leading-relaxed">
                Este es un ejemplo de texto normal. El contraste entre el texto y el fondo 
                debe ser suficiente para que todas las personas puedan leerlo cómodamente.
              </p>
              <div className="pt-4 flex justify-center">
                <button 
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: foreground, color: background }}
                >
                  Botón de Acción
                </button>
              </div>
            </div>
            
            <div className="mt-auto text-center font-mono font-bold text-6xl opacity-20">
              {ratio.toFixed(2)}:1
            </div>
          </div>
          
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-medium text-muted-foreground">Ratio de Contraste</span>
            <Badge variant={ratio >= 4.5 ? "default" : ratio >= 3.0 ? "secondary" : "destructive"} className="text-lg px-3 py-1">
              {ratio.toFixed(2)}:1
            </Badge>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

function WCAGCard({ title, pass }: { title: string; pass: boolean }) {
  return (
    <div className={`p-4 rounded-lg border ${pass ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className={`font-bold ${pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {pass ? 'Aprobado' : 'Fallido'}
      </div>
    </div>
  );
}
