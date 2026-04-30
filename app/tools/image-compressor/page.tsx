"use client"

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, ArrowRight, Loader2 } from "lucide-react";

export default function ImageCompressorPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [quality, setQuality] = useState(0.8);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setCompressedFile(null);
      setCompressedUrl(null);
      
      // Auto compress on upload
      await compressImage(file, quality);
    }
  };

  const handleQualityChange = async (value: number | readonly number[]) => {
    const newQuality = Array.isArray(value) || (value as readonly number[])?.length !== undefined ? (value as readonly number[])[0] : value as number;
    setQuality(newQuality);
    
    if (originalFile) {
      await compressImage(originalFile, newQuality);
    }
  };

  const compressImage = async (file: File, q: number) => {
    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: file.size / 1024 / 1024, // Original size
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: q,
      };
      
      const compressedBlob = await imageCompression(file, options);
      const cFile = new File([compressedBlob], file.name, { type: file.type });
      
      setCompressedFile(cFile);
      setCompressedUrl(URL.createObjectURL(cFile));
    } catch (error) {
      console.error("Error compressing image:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressed = () => {
    if (compressedUrl && compressedFile) {
      const link = document.createElement("a");
      link.href = compressedUrl;
      const fileName = compressedFile.name;
      const dotIndex = fileName.lastIndexOf(".");
      link.download = `${fileName.substring(0, dotIndex)}-comprimida${fileName.substring(dotIndex)}`;
      link.click();
    }
  };

  return (
    <ToolPageShell toolId="image-compressor">
      <div className="flex flex-col space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-4">
            <Label htmlFor="picture">Sube una imagen para comprimir</Label>
            <div className="flex w-full items-center justify-center">
              <label
                htmlFor="dropzone-file"
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 transition-colors hover:bg-muted/20"
              >
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                </div>
                <Input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col space-y-6 justify-center">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Calidad de compresión</Label>
                <span className="text-sm text-muted-foreground">{Math.round(quality * 100)}%</span>
              </div>
              <Slider
                value={[quality]}
                min={0.1}
                max={1}
                step={0.05}
                onValueChange={handleQualityChange}
                disabled={!originalFile || isCompressing}
              />
              <p className="text-xs text-muted-foreground">
                Menor calidad = Menor peso (puede perder detalles).
              </p>
            </div>

            <Button 
              onClick={downloadCompressed} 
              disabled={!compressedFile || isCompressing}
              className="w-full"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comprimiendo...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Imagen Comprimida
                </>
              )}
            </Button>
          </div>
        </div>

        {originalFile && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center pt-8 border-t">
            {/* Original Image */}
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Original</h3>
                <Badge variant="outline" className="font-mono">{formatBytes(originalFile.size)}</Badge>
              </div>
              <div className="relative aspect-video rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl!} alt="Original" className="max-h-full max-w-full object-contain" />
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex justify-center text-muted-foreground">
              <ArrowRight className="h-8 w-8" />
            </div>

            {/* Compressed Image */}
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Comprimida</h3>
                {compressedFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-medium">
                      -{Math.round((1 - compressedFile.size / originalFile.size) * 100)}%
                    </span>
                    <Badge variant="default" className="bg-green-500 font-mono">{formatBytes(compressedFile.size)}</Badge>
                  </div>
                )}
              </div>
              <div className="relative aspect-video rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
                {isCompressing ? (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <span className="text-sm">Procesando...</span>
                  </div>
                ) : compressedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={compressedUrl} alt="Compressed" className="max-h-full max-w-full object-contain" />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
