"use client";

import { Copy, Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageDropZone } from "@/components/tools/image-drop-zone";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { pngsToIco } from "@/lib/ico";

interface IconOptions {
  bgColor: string;
  transparent: boolean;
  padding: number; // %
  radius: number; // %
}

const SIZES: { size: number; label: string; filename: string }[] = [
  { size: 16, label: "Favicon 16", filename: "favicon-16x16.png" },
  { size: 32, label: "Favicon 32", filename: "favicon-32x32.png" },
  { size: 48, label: "Favicon 48", filename: "favicon-48x48.png" },
  { size: 180, label: "Apple Touch", filename: "apple-touch-icon.png" },
  { size: 192, label: "Android", filename: "android-chrome-192x192.png" },
  {
    size: 512,
    label: "PWA / Maskable",
    filename: "android-chrome-512x512.png",
  },
];

const HTML_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

const MANIFEST_SNIPPET = `{
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}`;

// Dibuja el ícono (fondo + esquinas redondeadas + imagen con padding) en un
// canvas del tamaño pedido. Se reutiliza tanto para los previews como para las
// descargas (PNG e ICO).
function renderIcon(
  img: HTMLImageElement,
  size: number,
  opts: IconOptions,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const radius = Math.min(size / 2, (size * opts.radius) / 100);
  if (radius > 0) {
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.arcTo(size, 0, size, size, radius);
    ctx.arcTo(size, size, 0, size, radius);
    ctx.arcTo(0, size, 0, 0, radius);
    ctx.arcTo(0, 0, size, 0, radius);
    ctx.closePath();
    ctx.clip();
  }

  if (!opts.transparent) {
    ctx.fillStyle = opts.bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  const inset = (size * opts.padding) / 100;
  const drawSize = size - inset * 2;
  ctx.drawImage(img, inset, inset, drawSize, drawSize);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar el PNG"));
    }, "image/png");
  });
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function PreviewCell({
  img,
  size,
  label,
  opts,
  onDownload,
}: {
  img: HTMLImageElement;
  size: number;
  label: string;
  opts: IconOptions;
  onDownload: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const display = Math.min(size, 96);

  useEffect(() => {
    const target = canvasRef.current;
    if (!target) return;
    const rendered = renderIcon(img, size, opts);
    target.width = size;
    target.height = size;
    const ctx = target.getContext("2d");
    ctx?.drawImage(rendered, 0, 0);
  }, [img, size, opts]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/10 p-4">
      <div
        className="flex items-center justify-center rounded-md bg-[repeating-conic-gradient(#8882_0_25%,transparent_0_50%)] bg-[length:16px_16px]"
        style={{ width: display, height: display }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: display,
            height: display,
            imageRendering: size <= 48 ? "pixelated" : "auto",
          }}
        />
      </div>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[10px] text-muted-foreground">
        {size}×{size}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={onDownload}
      >
        <Download className="mr-1 h-3 w-3" />
        PNG
      </Button>
    </div>
  );
}

export default function FaviconGeneratorPage() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [opts, setOpts] = useState<IconOptions>({
    bgColor: "#ffffff",
    transparent: true,
    padding: 0,
    radius: 0,
  });

  const handleImageSelected = useCallback((_file: File, objectUrl: string) => {
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => toast.error("No se pudo cargar la imagen.");
    image.src = objectUrl;
  }, []);

  const downloadPng = async (size: number, filename: string) => {
    if (!img) return;
    const blob = await canvasToBlob(renderIcon(img, size, opts));
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
  };

  const downloadIco = async () => {
    if (!img) return;
    try {
      const entries = await Promise.all(
        [16, 32, 48].map(async (size) => {
          const blob = await canvasToBlob(renderIcon(img, size, opts));
          const png = new Uint8Array(await blob.arrayBuffer());
          return { width: size, height: size, png };
        }),
      );
      const ico = pngsToIco(entries);
      const url = URL.createObjectURL(
        new Blob([ico as unknown as BlobPart], { type: "image/x-icon" }),
      );
      triggerDownload(url, "favicon.ico");
      URL.revokeObjectURL(url);
      toast.success("favicon.ico generado (16, 32 y 48 px).");
    } catch {
      toast.error("No se pudo generar el .ico");
    }
  };

  const copy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(msg));
  };

  return (
    <ToolPageShell toolId="favicon-generator">
      {!img ? (
        <div className="max-w-3xl mx-auto">
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube un logo o imagen (idealmente cuadrada y de alta resolución). Todo se procesa en tu navegador."
          />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Controles */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Fondo transparente</Label>
              <Switch
                checked={opts.transparent}
                onCheckedChange={(c) => setOpts({ ...opts, transparent: c })}
              />
            </div>

            {!opts.transparent && (
              <div className="space-y-2">
                <Label htmlFor="bg">Color de fondo</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="bg"
                    type="color"
                    value={opts.bgColor}
                    onChange={(e) =>
                      setOpts({ ...opts, bgColor: e.target.value })
                    }
                    className="h-9 w-14 cursor-pointer rounded-md border bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground">
                    {opts.bgColor}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Padding</Label>
                <span className="text-xs text-muted-foreground">
                  {opts.padding}%
                </span>
              </div>
              <Slider
                value={[opts.padding]}
                min={0}
                max={40}
                step={1}
                onValueChange={(v) =>
                  setOpts({ ...opts, padding: Array.isArray(v) ? v[0] : v })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Esquinas redondeadas</Label>
                <span className="text-xs text-muted-foreground">
                  {opts.radius}%
                </span>
              </div>
              <Slider
                value={[opts.radius]}
                min={0}
                max={50}
                step={1}
                onValueChange={(v) =>
                  setOpts({ ...opts, radius: Array.isArray(v) ? v[0] : v })
                }
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={downloadIco}>
                <Download className="mr-2 h-4 w-4" />
                Descargar favicon.ico
              </Button>
              <Button variant="outline" onClick={() => setImg(null)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Cambiar imagen
              </Button>
            </div>
          </div>

          {/* Previews + snippets */}
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {SIZES.map((s) => (
                <PreviewCell
                  key={s.size}
                  img={img}
                  size={s.size}
                  label={s.label}
                  opts={opts}
                  onDownload={() => downloadPng(s.size, s.filename)}
                />
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>HTML para el {"<head>"}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => copy(HTML_SNIPPET, "HTML copiado")}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border bg-muted/20 p-4 text-xs">
                <code>{HTML_SNIPPET}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>site.webmanifest</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => copy(MANIFEST_SNIPPET, "Manifest copiado")}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border bg-muted/20 p-4 text-xs">
                <code>{MANIFEST_SNIPPET}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
