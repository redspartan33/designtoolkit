"use client";

import {
  Download,
  Flame,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageDropZone } from "@/components/tools/image-drop-zone";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_HEATMAP_OPTIONS,
  HeatmapEngine,
  type HeatmapOptions,
} from "@/lib/heatmap-engine";

export default function HeatmapAnalyzerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [opts, setOpts] = useState<HeatmapOptions>(DEFAULT_HEATMAP_OPTIONS);

  const engineRef = useRef<HeatmapEngine | null>(null);
  const renderTimerRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    return () => {
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    };
  }, [originalImageUrl]);

  const reset = useCallback(() => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    engineRef.current = null;
    setImageFile(null);
    setOriginalImageUrl(null);
    setPreviewUrl(null);
    setOpts(DEFAULT_HEATMAP_OPTIONS);
  }, [originalImageUrl]);

  const handleImageSelected = useCallback(
    async (file: File, url: string) => {
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
      setImageFile(file);
      setOriginalImageUrl(url);
      setPreviewUrl(null);
      setIsPreparing(true);

      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
          img.src = url;
        });
        const engine = new HeatmapEngine();
        await engine.load(img);
        engineRef.current = engine;
        setPreviewUrl(engine.renderPreviewDataURL(optsRef.current));
      } catch (err) {
        console.error(err);
        toast.error("No se pudo procesar la imagen.");
      } finally {
        setIsPreparing(false);
      }
    },
    [originalImageUrl],
  );

  // Re-render con debounce cuando cambian las opciones
  useEffect(() => {
    if (!engineRef.current) return;
    if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    renderTimerRef.current = window.setTimeout(() => {
      if (!engineRef.current) return;
      try {
        setPreviewUrl(engineRef.current.renderPreviewDataURL(opts));
      } catch (err) {
        console.error(err);
      }
    }, 60);
    return () => {
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    };
  }, [opts]);

  const downloadResult = async () => {
    if (!engineRef.current) return;
    setIsExporting(true);
    try {
      const blob = await engineRef.current.renderFullBlob(opts);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heatmap-${imageFile?.name?.replace(/\.[^.]+$/, "") ?? "result"}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Heatmap exportado.");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo exportar el heatmap.");
    } finally {
      setIsExporting(false);
    }
  };

  const set = useCallback(
    <K extends keyof HeatmapOptions>(key: K) =>
      (v: number | number[] | readonly number[]) => {
        const val = Array.isArray(v) ? v[0] : (v as number);
        setOpts((prev) => ({ ...prev, [key]: val }));
      },
    [],
  );

  return (
    <ToolPageShell toolId="heatmap-analyzer">
      <div className="space-y-6 max-w-6xl mx-auto">
        {!originalImageUrl ? (
          <ImageDropZone
            onImageSelected={handleImageSelected}
            hint="Sube un diseño o captura de pantalla para analizar su mapa de atención visual."
          />
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Lado izquierdo: imágenes */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border">
                <ImagePanel
                  title="Diseño original"
                  icon={<ImageIcon className="w-4 h-4" />}
                  url={originalImageUrl}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reset}
                      disabled={isPreparing || isExporting}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Cambiar
                    </Button>
                  }
                />
                <ImagePanel
                  title="Mapa de atención"
                  icon={<Flame className="w-4 h-4 text-orange-500" />}
                  url={previewUrl}
                  isLoading={isPreparing}
                />
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setOpts(DEFAULT_HEATMAP_OPTIONS)}
                  disabled={isPreparing}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Restablecer controles
                </Button>
                <Button
                  onClick={downloadResult}
                  disabled={!previewUrl || isPreparing || isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Descargar Heatmap
                </Button>
              </div>
            </div>

            {/* Lado derecho: controles */}
            <ControlsPanel opts={opts} onChange={set} />
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}

function ImagePanel({
  title,
  icon,
  url,
  action,
  isLoading,
}: {
  title: string;
  icon: React.ReactNode;
  url: string | null;
  action?: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-background p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon} {title}
        </span>
        {action}
      </div>
      <div className="bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden min-h-[300px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={title}
            className="max-w-full max-h-[400px] object-contain"
          />
        ) : (
          !isLoading && (
            <p className="text-xs text-muted-foreground p-8 text-center">
              Procesando…
            </p>
          )
        )}
      </div>
    </div>
  );
}

function ControlsPanel({
  opts,
  onChange,
}: {
  opts: HeatmapOptions;
  onChange: <K extends keyof HeatmapOptions>(
    key: K,
  ) => (v: number | number[] | readonly number[]) => void;
}) {
  const controls = useMemo(
    () => [
      {
        key: "threshold" as const,
        label: "Cantidad de puntos",
        hint: "Umbral de calor: más alto = menos puntos, más selectivos.",
        min: 0,
        max: 0.9,
        step: 0.01,
        format: (v: number) => `${Math.round((1 - v) * 100)}%`,
      },
      {
        key: "spread" as const,
        label: "Tamaño del foco",
        hint: "Radio de las manchas de calor (sigma del blur final).",
        min: 0.01,
        max: 0.12,
        step: 0.005,
        format: (v: number) => `${(v * 100).toFixed(1)}%`,
      },
      {
        key: "intensity" as const,
        label: "Intensidad",
        hint: "Opacidad máxima del overlay sobre el original.",
        min: 0,
        max: 1,
        step: 0.02,
        format: (v: number) => `${Math.round(v * 100)}%`,
      },
      {
        key: "centerWeight" as const,
        label: "Sesgo central (F-Z)",
        hint: "Peso del patrón de lectura: la mirada va al centro-superior.",
        min: 0,
        max: 1,
        step: 0.02,
        format: (v: number) => `${Math.round(v * 100)}%`,
      },
      {
        key: "edgeWeight" as const,
        label: "Detalle / Bordes",
        hint: "Peso de zonas con mucho detalle o presencia de elementos.",
        min: 0,
        max: 1,
        step: 0.02,
        format: (v: number) => `${Math.round(v * 100)}%`,
      },
      {
        key: "contrastWeight" as const,
        label: "Contraste",
        hint: "Peso del contraste local de luminancia.",
        min: 0,
        max: 1,
        step: 0.02,
        format: (v: number) => `${Math.round(v * 100)}%`,
      },
      {
        key: "colorWeight" as const,
        label: "Color / Saturación",
        hint: "Peso de los colores vivos.",
        min: 0,
        max: 1,
        step: 0.02,
        format: (v: number) => `${Math.round(v * 100)}%`,
      },
    ],
    [],
  );

  return (
    <div className="rounded-xl border bg-card p-5 space-y-5 h-fit lg:sticky lg:top-4">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" /> Controles
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ajusta los pesos en vivo. El preview se actualiza al instante.
        </p>
      </div>
      <div className="space-y-5">
        {controls.map((c) => (
          <div key={c.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">{c.label}</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {c.format(opts[c.key])}
              </span>
            </div>
            <Slider
              value={[opts[c.key]]}
              min={c.min}
              max={c.max}
              step={c.step}
              onValueChange={onChange(c.key)}
            />
            <p className="text-[10px] leading-snug text-muted-foreground/80">
              {c.hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
