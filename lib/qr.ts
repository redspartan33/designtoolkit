// Builders de string para cada tipo de QR. Un código QR es solo un string con
// un formato estándar reconocido por los lectores de móvil, así que cada tipo
// se reduce a construir ese string (con el escape que su estándar requiere).

export type QRType =
  | "text"
  | "wifi"
  | "geo"
  | "email"
  | "phone"
  | "sms"
  | "vcard";

export interface WifiFields {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}
export interface GeoFields {
  lat: string;
  lng: string;
}
export interface EmailFields {
  to: string;
  subject: string;
  body: string;
}
export interface SmsFields {
  number: string;
  message: string;
}
export interface VcardFields {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  org: string;
  title: string;
  url: string;
}

// Escapa los caracteres especiales del formato WIFI (\ ; , : ").
export function escapeWifi(input: string): string {
  return input.replace(/([\\;,:"])/g, "\\$1");
}

// Escapa los caracteres especiales de vCard (\ ; ,) y saltos de línea.
export function escapeVcard(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function buildWifi(f: WifiFields): string {
  if (!f.ssid.trim()) return "";
  const parts = [`T:${f.encryption}`, `S:${escapeWifi(f.ssid)}`];
  if (f.encryption !== "nopass") parts.push(`P:${escapeWifi(f.password)}`);
  if (f.hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}

export function buildGeo(f: GeoFields): string {
  if (!f.lat.trim() || !f.lng.trim()) return "";
  return `geo:${f.lat.trim()},${f.lng.trim()}`;
}

export function buildEmail(f: EmailFields): string {
  if (!f.to.trim()) return "";
  const params = new URLSearchParams();
  if (f.subject.trim()) params.set("subject", f.subject);
  if (f.body.trim()) params.set("body", f.body);
  const query = params.toString();
  return `mailto:${f.to.trim()}${query ? `?${query}` : ""}`;
}

export function buildPhone(number: string): string {
  return number.trim() ? `tel:${number.trim()}` : "";
}

export function buildSms(f: SmsFields): string {
  if (!f.number.trim()) return "";
  return `SMSTO:${f.number.trim()}:${f.message}`;
}

export function buildVcard(f: VcardFields): string {
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
