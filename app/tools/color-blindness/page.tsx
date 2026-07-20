"use client";

import { Download, Plus, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageDropZone } from "@/components/tools/image-drop-zone";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hexToRgb, rgbToHex } from "@/lib/color";
import {
  CB_TYPES,
  type CBType,
  findIndistinguishablePairs,
  simulateImageData,
  simulateRgb,
} from "@/lib/color-blindness";

const MAX_PREVIEW = 260;

// ── Modo imagen ────────────────────────────────────────────────────────────

function SimImageCell({
  img,
  type,
  label,
}: {
  img: HTMLImageElement;
  type: CBType | "normal";
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(
      MAX_PREVIEW / img.width,
      MAX_PREVIEW / img.height,
      1,
    );
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    if (type !== "normal") {
      const data = ctx.getImageData(0, 0, w, h);
      simulateImageData(data.data, type);
      ctx.putImageData(data, 0, 0);
    }
  }, [img, type]);

  const download = () => {
    // Render a resolución natural para la descarga.
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    if (type !== "normal") {
      const data = ctx.getImageData(0, 0, img.width, img.height);
      simulateImageData(data.data, type);
      ctx.putImageData(data, 0, 0);
    }
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daltonismo-${type}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/10 p-3">
      <canvas ref={canvasRef} className="max-w-full rounded-md" />
      <span className="text-xs font-semibold">{label}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px]"
        onClick={download}
      >
        <Download className="mr-1 h-3 w-3" />
        PNG
      </Button>
    </div>
  );
}

function ImageMode() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const handleImageSelected = useCallback((_file: File, objectUrl: string) => {
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => toast.error("No se pudo cargar la imagen.");
    image.src = objectUrl;
  }, []);

  if (!img) {
    return (
      <div className="max-w-3xl mx-auto">
        <ImageDropZone
          onImageSelected={handleImageSelected}
          hint="Sube un diseño o imagen para ver cómo la percibe alguien con daltonismo. 100% local."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setImg(null)}>
          Cambiar imagen
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SimImageCell img={img} type="normal" label="Original" />
        {CB_TYPES.map((t) => (
          <SimImageCell key={t.id} img={img} type={t.id} label={t.label} />
        ))}
      </div>
    </div>
  );
}

// ── Modo paleta ──────────────────────────────────────────────────────────

const DEFAULT_PALETTE = ["#e5484d", "#30a46c", "#f5a623", "#8e4ec6", "#0091ff"];

function Swatch({ hex, size = 32 }: { hex: string; size?: number }) {
  return (
    <div
      className="rounded-md border border-white/10"
      style={{ width: size, height: size, backgroundColor: hex }}
      title={hex}
    />
  );
}

function PaletteMode() {
  const [colors, setColors] = useState<string[]>(DEFAULT_PALETTE);

  const update = (i: number, value: string) =>
    setColors(colors.map((c, idx) => (idx === i ? value : c)));
  const remove = (i: number) => setColors(colors.filter((_, idx) => idx !== i));
  const add = () => setColors([...colors, "#888888"]);

  const valid = colors.filter((c) => hexToRgb(c) !== null);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Editor de colores */}
      <div className="space-y-3">
        <span className="text-sm font-semibold">Colores de la paleta</span>
        {colors.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: la lista es editable por posición
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={hexToRgb(c) ? c : "#888888"}
              onChange={(e) => update(i, e.target.value)}
              className="h-9 w-10 shrink-0 cursor-pointer rounded-md border bg-transparent"
            />
            <Input
              value={c}
              onChange={(e) => update(i, e.target.value)}
              className="h-9 font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => remove(i)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={add}>
          <Plus className="mr-1 h-4 w-4" />
          Agregar color
        </Button>
      </div>

      {/* Simulación + avisos */}
      <div className="space-y-8">
        <div className="space-y-3">
          <span className="text-sm font-semibold">Cómo se perciben</span>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-2 text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium">Normal</th>
                  {CB_TYPES.map((t) => (
                    <th key={t.id} className="text-left font-medium">
                      {t.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {valid.map((c) => {
                  const rgb = hexToRgb(c);
                  return (
                    <tr key={c}>
                      <td>
                        <Swatch hex={c} />
                      </td>
                      {CB_TYPES.map((t) => (
                        <td key={t.id}>
                          <Swatch
                            hex={rgb ? rgbToHex(simulateRgb(rgb, t.id)) : c}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-sm font-semibold">
            Colores que se confunden
          </span>
          <div className="space-y-2">
            {CB_TYPES.map((t) => {
              const pairs = findIndistinguishablePairs(valid, t.id);
              if (pairs.length === 0) return null;
              return (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {t.label}
                  </span>
                  {pairs.map((p) => (
                    <span
                      key={`${p.a}-${p.b}`}
                      className="flex items-center gap-1"
                    >
                      <Swatch hex={p.a} size={20} />
                      <span className="text-muted-foreground">≈</span>
                      <Swatch hex={p.b} size={20} />
                    </span>
                  ))}
                </div>
              );
            })}
            {CB_TYPES.every(
              (t) => findIndistinguishablePairs(valid, t.id).length === 0,
            ) && (
              <p className="text-sm text-muted-foreground">
                Ningún par de colores se confunde en los tipos simulados. 🎉
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ColorBlindnessPage() {
  return (
    <ToolPageShell toolId="color-blindness">
      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-[280px] grid-cols-2">
          <TabsTrigger value="image">Imagen</TabsTrigger>
          <TabsTrigger value="palette">Paleta</TabsTrigger>
        </TabsList>
        <TabsContent value="image" className="mt-6">
          <ImageMode />
        </TabsContent>
        <TabsContent value="palette" className="mt-6">
          <PaletteMode />
        </TabsContent>
      </Tabs>
    </ToolPageShell>
  );
}
