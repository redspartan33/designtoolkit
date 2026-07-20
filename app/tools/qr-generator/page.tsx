"use client";

import { Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useRef, useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Tipos de QR y builders de string (cada QR es solo un string con un formato
// estándar reconocido por los lectores de móvil).
// ---------------------------------------------------------------------------

type QRType = "text" | "wifi" | "geo" | "email" | "phone" | "sms" | "vcard";

const QR_TYPES: { id: QRType; label: string }[] = [
  { id: "text", label: "URL / Texto" },
  { id: "wifi", label: "WiFi" },
  { id: "geo", label: "Ubicación" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Teléfono" },
  { id: "sms", label: "SMS" },
  { id: "vcard", label: "Contacto (vCard)" },
];

const TYPE_HELP: Record<QRType, string> = {
  text: "URL, texto plano o cualquier dato. Se codifica tal cual.",
  wifi: "Al escanear, el móvil ofrece conectarse a la red automáticamente.",
  geo: "Abre la ubicación en la app de mapas del dispositivo.",
  email: "Abre el cliente de correo con destinatario, asunto y mensaje listos.",
  phone: "Al escanear, el móvil propone llamar al número.",
  sms: "Abre la app de mensajes con el número y el texto precargados.",
  vcard: "Guarda un contacto completo en la agenda del dispositivo.",
};

// Escapa los caracteres especiales del formato WIFI (\ ; , : ").
function escapeWifi(input: string): string {
  return input.replace(/([\\;,:"])/g, "\\$1");
}

// Escapa los caracteres especiales de vCard (\ ; ,) y saltos de línea.
function escapeVcard(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

interface WifiFields {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}
interface GeoFields {
  lat: string;
  lng: string;
}
interface EmailFields {
  to: string;
  subject: string;
  body: string;
}
interface SmsFields {
  number: string;
  message: string;
}
interface VcardFields {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  org: string;
  title: string;
  url: string;
}

function buildWifi(f: WifiFields): string {
  if (!f.ssid.trim()) return "";
  const parts = [`T:${f.encryption}`, `S:${escapeWifi(f.ssid)}`];
  if (f.encryption !== "nopass") parts.push(`P:${escapeWifi(f.password)}`);
  if (f.hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}

function buildGeo(f: GeoFields): string {
  if (!f.lat.trim() || !f.lng.trim()) return "";
  return `geo:${f.lat.trim()},${f.lng.trim()}`;
}

function buildEmail(f: EmailFields): string {
  if (!f.to.trim()) return "";
  const params = new URLSearchParams();
  if (f.subject.trim()) params.set("subject", f.subject);
  if (f.body.trim()) params.set("body", f.body);
  const query = params.toString();
  return `mailto:${f.to.trim()}${query ? `?${query}` : ""}`;
}

function buildSms(f: SmsFields): string {
  if (!f.number.trim()) return "";
  return `SMSTO:${f.number.trim()}:${f.message}`;
}

function buildVcard(f: VcardFields): string {
  if (!f.firstName.trim() && !f.lastName.trim() && !f.phone.trim()) return "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVcard(f.lastName)};${escapeVcard(f.firstName)};;;`,
    `FN:${escapeVcard(`${f.firstName} ${f.lastName}`.trim())}`,
  ];
  if (f.org.trim()) lines.push(`ORG:${escapeVcard(f.org)}`);
  if (f.title.trim()) lines.push(`TITLE:${escapeVcard(f.title)}`);
  if (f.phone.trim()) lines.push(`TEL;TYPE=CELL:${f.phone.trim()}`);
  if (f.email.trim()) lines.push(`EMAIL:${f.email.trim()}`);
  if (f.url.trim()) lines.push(`URL:${f.url.trim()}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export default function QRGeneratorPage() {
  const [type, setType] = useState<QRType>("text");
  const svgRef = useRef<SVGSVGElement>(null);

  // Estado separado por tipo para no perder datos al cambiar de tipo.
  const [text, setText] = useState("https://designkit.local");
  const [wifi, setWifi] = useState<WifiFields>({
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  });
  const [geo, setGeo] = useState<GeoFields>({ lat: "", lng: "" });
  const [email, setEmail] = useState<EmailFields>({
    to: "",
    subject: "",
    body: "",
  });
  const [phone, setPhone] = useState("");
  const [sms, setSms] = useState<SmsFields>({ number: "", message: "" });
  const [vcard, setVcard] = useState<VcardFields>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    org: "",
    title: "",
    url: "",
  });

  const value = useMemo(() => {
    switch (type) {
      case "text":
        return text;
      case "wifi":
        return buildWifi(wifi);
      case "geo":
        return buildGeo(geo);
      case "email":
        return buildEmail(email);
      case "phone":
        return phone.trim() ? `tel:${phone.trim()}` : "";
      case "sms":
        return buildSms(sms);
      case "vcard":
        return buildVcard(vcard);
      default:
        return "";
    }
  }, [type, text, wifi, geo, email, phone, sms, vcard]);

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

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <ToolPageShell toolId="qr-generator">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-type">Tipo de QR</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as QRType)}
            >
              <SelectTrigger id="qr-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_TYPES.map((qt) => (
                  <SelectItem key={qt.id} value={qt.id}>
                    {qt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formulario por tipo */}
          {type === "text" && (
            <div className="space-y-2">
              <Label htmlFor="qr-content">Contenido del QR</Label>
              <Input
                id="qr-content"
                placeholder="Ingresa una URL, texto, o datos..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}

          {type === "wifi" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wifi-ssid">Nombre de la red (SSID)</Label>
                <Input
                  id="wifi-ssid"
                  placeholder="MiRed"
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifi-enc">Seguridad</Label>
                <Select
                  value={wifi.encryption}
                  onValueChange={(v) =>
                    v &&
                    setWifi({
                      ...wifi,
                      encryption: v as WifiFields["encryption"],
                    })
                  }
                >
                  <SelectTrigger id="wifi-enc" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">Sin contraseña</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {wifi.encryption !== "nopass" && (
                <div className="space-y-2">
                  <Label htmlFor="wifi-pass">Contraseña</Label>
                  <Input
                    id="wifi-pass"
                    placeholder="Contraseña de la red"
                    value={wifi.password}
                    onChange={(e) =>
                      setWifi({ ...wifi, password: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Switch
                  id="wifi-hidden"
                  checked={wifi.hidden}
                  onCheckedChange={(c) => setWifi({ ...wifi, hidden: c })}
                />
                <Label htmlFor="wifi-hidden">Red oculta</Label>
              </div>
            </div>
          )}

          {type === "geo" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="geo-lat">Latitud</Label>
                <Input
                  id="geo-lat"
                  placeholder="19.4326"
                  value={geo.lat}
                  onChange={(e) => setGeo({ ...geo, lat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="geo-lng">Longitud</Label>
                <Input
                  id="geo-lng"
                  placeholder="-99.1332"
                  value={geo.lng}
                  onChange={(e) => setGeo({ ...geo, lng: e.target.value })}
                />
              </div>
            </div>
          )}

          {type === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-to">Destinatario</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="hola@ejemplo.com"
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Asunto</Label>
                <Input
                  id="email-subject"
                  placeholder="Asunto del correo"
                  value={email.subject}
                  onChange={(e) =>
                    setEmail({ ...email, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Mensaje</Label>
                <Textarea
                  id="email-body"
                  placeholder="Cuerpo del mensaje..."
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                />
              </div>
            </div>
          )}

          {type === "phone" && (
            <div className="space-y-2">
              <Label htmlFor="phone-number">Número de teléfono</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+52 55 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          {type === "sms" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-number">Número de teléfono</Label>
                <Input
                  id="sms-number"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={sms.number}
                  onChange={(e) => setSms({ ...sms, number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-message">Mensaje</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Texto del mensaje..."
                  value={sms.message}
                  onChange={(e) => setSms({ ...sms, message: e.target.value })}
                />
              </div>
            </div>
          )}

          {type === "vcard" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vc-first">Nombre</Label>
                  <Input
                    id="vc-first"
                    placeholder="Juan"
                    value={vcard.firstName}
                    onChange={(e) =>
                      setVcard({ ...vcard, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vc-last">Apellido</Label>
                  <Input
                    id="vc-last"
                    placeholder="Pérez"
                    value={vcard.lastName}
                    onChange={(e) =>
                      setVcard({ ...vcard, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vc-phone">Teléfono</Label>
                <Input
                  id="vc-phone"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={vcard.phone}
                  onChange={(e) =>
                    setVcard({ ...vcard, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vc-email">Email</Label>
                <Input
                  id="vc-email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={vcard.email}
                  onChange={(e) =>
                    setVcard({ ...vcard, email: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vc-org">Organización</Label>
                  <Input
                    id="vc-org"
                    placeholder="Empresa S.A."
                    value={vcard.org}
                    onChange={(e) =>
                      setVcard({ ...vcard, org: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vc-title">Cargo</Label>
                  <Input
                    id="vc-title"
                    placeholder="Diseñador"
                    value={vcard.title}
                    onChange={(e) =>
                      setVcard({ ...vcard, title: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vc-url">Sitio web</Label>
                <Input
                  id="vc-url"
                  placeholder="https://ejemplo.com"
                  value={vcard.url}
                  onChange={(e) => setVcard({ ...vcard, url: e.target.value })}
                />
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">{TYPE_HELP[type]}</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border bg-muted/20 p-8">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <QRCodeSVG
              value={value || " "}
              size={200}
              level="H"
              marginSize={0}
              ref={svgRef}
            />
          </div>

          <Button
            onClick={downloadQR}
            disabled={!value}
            className="w-full max-w-[200px]"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PNG
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
}
