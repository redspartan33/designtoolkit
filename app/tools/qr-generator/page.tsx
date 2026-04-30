"use client"

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function QRGeneratorPage() {
  const [value, setValue] = useState("https://designkit.local");
  const svgRef = useRef<SVGSVGElement>(null);

  const downloadQR = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size (adding padding)
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "qr-code.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <ToolPageShell toolId="qr-generator">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-content">Contenido del QR</Label>
            <Input
              id="qr-content"
              placeholder="Ingresa una URL, texto, o datos..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            El código se actualizará en tiempo real. Soporta URLs, texto plano,
            información de contacto (vCard) o configuraciones WiFi.
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border bg-muted/20 p-8">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <QRCodeSVG
              value={value || " "}
              size={200}
              level="H"
              includeMargin={false}
              ref={svgRef}
            />
          </div>
          
          <Button onClick={downloadQR} disabled={!value} className="w-full max-w-[200px]">
            <Download className="mr-2 h-4 w-4" />
            Descargar PNG
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
}
