import { describe, expect, it } from "vitest";
import { colorDistance } from "./color";
import {
  CB_MATRICES,
  CB_TYPES,
  findIndistinguishablePairs,
  simulateRgb,
} from "./color-blindness";

describe("simulateRgb", () => {
  it("es identidad para 'normal'", () => {
    const rgb = { r: 123, g: 45, b: 200 };
    expect(simulateRgb(rgb, "normal")).toEqual(rgb);
  });

  it("mantiene el blanco y el negro en todos los tipos", () => {
    for (const { id } of CB_TYPES) {
      expect(simulateRgb({ r: 255, g: 255, b: 255 }, id)).toEqual({
        r: 255,
        g: 255,
        b: 255,
      });
      expect(simulateRgb({ r: 0, g: 0, b: 0 }, id)).toEqual({
        r: 0,
        g: 0,
        b: 0,
      });
    }
  });

  it("acromatopsia produce un gris (r=g=b)", () => {
    const out = simulateRgb({ r: 255, g: 0, b: 0 }, "achromatopsia");
    expect(out.r).toBe(out.g);
    expect(out.g).toBe(out.b);
  });

  it("clampa dentro de 0-255", () => {
    const out = simulateRgb({ r: 255, g: 255, b: 0 }, "protanopia");
    for (const c of [out.r, out.g, out.b]) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(255);
    }
  });
});

describe("CB_MATRICES", () => {
  it("cubre los 8 tipos", () => {
    expect(Object.keys(CB_MATRICES)).toHaveLength(8);
    expect(CB_TYPES).toHaveLength(8);
  });
});

describe("findIndistinguishablePairs", () => {
  it("marca verde y púrpura como confundibles en protanopía", () => {
    // Para daltonismo rojo-verde, un verde y un púrpura de luminancia similar
    // colapsan al mismo tono (distancia simulada ~52).
    const pairs = findIndistinguishablePairs(
      ["#30a46c", "#8e4ec6", "#0091ff"],
      "protanopia",
    );
    const hasGreenPurple = pairs.some(
      (p) =>
        (p.a === "#30a46c" && p.b === "#8e4ec6") ||
        (p.a === "#8e4ec6" && p.b === "#30a46c"),
    );
    expect(hasGreenPurple).toBe(true);
  });

  it("reduce la separación de un par verde-púrpura bajo deuteranopía", () => {
    const green = { r: 0x30, g: 0xa4, b: 0x6c };
    const purple = { r: 0x8e, g: 0x4e, b: 0xc6 };
    const origDist = colorDistance(green, purple);
    const simDist = colorDistance(
      simulateRgb(green, "deuteranopia"),
      simulateRgb(purple, "deuteranopia"),
    );
    expect(simDist).toBeLessThan(origDist);
  });

  it("no marca colores ya idénticos y descarta hex inválidos", () => {
    const pairs = findIndistinguishablePairs(
      ["#ff0000", "#ff0000", "no-hex"],
      "protanopia",
    );
    expect(pairs).toHaveLength(0);
  });
});
