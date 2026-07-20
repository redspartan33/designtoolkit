import { describe, expect, it } from "vitest";
import {
  buildEmail,
  buildGeo,
  buildPhone,
  buildSms,
  buildVcard,
  buildWifi,
  escapeVcard,
  escapeWifi,
} from "./qr";

describe("escapeWifi", () => {
  it("escapa \\ ; , : y comillas", () => {
    expect(escapeWifi('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f');
  });
});

describe("buildWifi", () => {
  it("devuelve vacío sin SSID", () => {
    expect(
      buildWifi({
        ssid: "  ",
        password: "x",
        encryption: "WPA",
        hidden: false,
      }),
    ).toBe("");
  });

  it("construye el string estándar y escapa el SSID", () => {
    expect(
      buildWifi({
        ssid: "Mi Red;Casa",
        password: "clave123",
        encryption: "WPA",
        hidden: false,
      }),
    ).toBe("WIFI:T:WPA;S:Mi Red\\;Casa;P:clave123;;");
  });

  it("omite la contraseña cuando es red abierta", () => {
    expect(
      buildWifi({
        ssid: "Libre",
        password: "x",
        encryption: "nopass",
        hidden: false,
      }),
    ).toBe("WIFI:T:nopass;S:Libre;;");
  });

  it("agrega H:true para redes ocultas", () => {
    expect(
      buildWifi({
        ssid: "Red",
        password: "p",
        encryption: "WEP",
        hidden: true,
      }),
    ).toBe("WIFI:T:WEP;S:Red;P:p;H:true;;");
  });
});

describe("buildGeo", () => {
  it("requiere ambas coordenadas", () => {
    expect(buildGeo({ lat: "19.4", lng: "" })).toBe("");
  });
  it("construye geo: y recorta espacios", () => {
    expect(buildGeo({ lat: " 19.4326 ", lng: " -99.1332 " })).toBe(
      "geo:19.4326,-99.1332",
    );
  });
});

describe("buildEmail", () => {
  it("requiere destinatario", () => {
    expect(buildEmail({ to: "", subject: "x", body: "y" })).toBe("");
  });
  it("codifica asunto y cuerpo como query params", () => {
    expect(
      buildEmail({
        to: "a@b.com",
        subject: "Hola mundo",
        body: "línea 1\nlínea 2",
      }),
    ).toBe(
      "mailto:a@b.com?subject=Hola+mundo&body=l%C3%ADnea+1%0Al%C3%ADnea+2",
    );
  });
  it("sin params no agrega ?", () => {
    expect(buildEmail({ to: "a@b.com", subject: "", body: "" })).toBe(
      "mailto:a@b.com",
    );
  });
});

describe("buildPhone", () => {
  it("prefija tel: o vacío", () => {
    expect(buildPhone(" +52 55 ")).toBe("tel:+52 55");
    expect(buildPhone("  ")).toBe("");
  });
});

describe("buildSms", () => {
  it("construye SMSTO con número y mensaje", () => {
    expect(buildSms({ number: "+5255", message: "Hola" })).toBe(
      "SMSTO:+5255:Hola",
    );
  });
});

describe("escapeVcard / buildVcard", () => {
  it("escapa ; , y \\ en vCard", () => {
    expect(escapeVcard("ACME; Inc, S.A.\\x")).toBe("ACME\\; Inc\\, S.A.\\\\x");
  });

  it("devuelve vacío sin nombre/apellido/teléfono", () => {
    expect(
      buildVcard({
        firstName: "",
        lastName: "",
        phone: "",
        email: "a@b.com",
        org: "",
        title: "",
        url: "",
      }),
    ).toBe("");
  });

  it("genera un bloque vCard 3.0 válido con campos escapados", () => {
    const out = buildVcard({
      firstName: "Juan",
      lastName: "Pérez, Jr",
      phone: "+525512345678",
      email: "j@e.com",
      org: "ACME; Inc",
      title: "Diseñador",
      url: "https://e.com",
    });
    expect(out.startsWith("BEGIN:VCARD\nVERSION:3.0")).toBe(true);
    expect(out).toContain("N:Pérez\\, Jr;Juan;;;");
    expect(out).toContain("FN:Juan Pérez\\, Jr");
    expect(out).toContain("ORG:ACME\\; Inc");
    expect(out).toContain("TEL;TYPE=CELL:+525512345678");
    expect(out.endsWith("END:VCARD")).toBe(true);
  });
});
