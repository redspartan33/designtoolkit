// Motor de simulación de daltonismo. Usa las matrices de simulación estándar
// (HCIRN / aproximación clásica usada por la mayoría de librerías) para
// transformar colores RGB a como los percibiría cada tipo de deficiencia.

import { colorDistance, hexToRgb, type RGB } from "./color";

export type CBType =
  | "protanopia"
  | "protanomaly"
  | "deuteranopia"
  | "deuteranomaly"
  | "tritanopia"
  | "tritanomaly"
  | "achromatopsia"
  | "achromatomaly";

type Matrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

// Matriz identidad (percepción normal), útil como referencia y en tests.
export const IDENTITY: Matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export const CB_MATRICES: Record<CBType, Matrix> = {
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  protanomaly: [0.817, 0.183, 0, 0.333, 0.667, 0, 0, 0.125, 0.875],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  deuteranomaly: [0.8, 0.2, 0, 0.258, 0.742, 0, 0, 0.142, 0.858],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  tritanomaly: [0.967, 0.033, 0, 0, 0.733, 0.267, 0, 0.183, 0.817],
  achromatopsia: [
    0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114,
  ],
  achromatomaly: [0.618, 0.32, 0.062, 0.163, 0.775, 0.062, 0.163, 0.32, 0.516],
};

export const CB_TYPES: { id: CBType; label: string; short: string }[] = [
  { id: "protanopia", label: "Protanopía", short: "Sin rojo" },
  { id: "protanomaly", label: "Protanomalía", short: "Rojo débil" },
  { id: "deuteranopia", label: "Deuteranopía", short: "Sin verde" },
  { id: "deuteranomaly", label: "Deuteranomalía", short: "Verde débil" },
  { id: "tritanopia", label: "Tritanopía", short: "Sin azul" },
  { id: "tritanomaly", label: "Tritanomalía", short: "Azul débil" },
  { id: "achromatopsia", label: "Acromatopsia", short: "Monocromático" },
  { id: "achromatomaly", label: "Acromatomalía", short: "Color débil" },
];

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

function applyMatrix({ r, g, b }: RGB, m: Matrix): RGB {
  return {
    r: clamp(r * m[0] + g * m[1] + b * m[2]),
    g: clamp(r * m[3] + g * m[4] + b * m[5]),
    b: clamp(r * m[6] + g * m[7] + b * m[8]),
  };
}

export function simulateRgb(rgb: RGB, type: CBType | "normal"): RGB {
  if (type === "normal") return { ...rgb };
  return applyMatrix(rgb, CB_MATRICES[type]);
}

// Aplica la simulación in-place sobre los datos de un canvas.
export function simulateImageData(data: Uint8ClampedArray, type: CBType): void {
  const m = CB_MATRICES[type];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = clamp(r * m[0] + g * m[1] + b * m[2]);
    data[i + 1] = clamp(r * m[3] + g * m[4] + b * m[5]);
    data[i + 2] = clamp(r * m[6] + g * m[7] + b * m[8]);
    // alfa (i + 3) intacto
  }
}

export interface ConfusablePair {
  a: string;
  b: string;
  distance: number;
}

// Encuentra pares de colores que eran distinguibles en visión normal pero que
// se vuelven indistinguibles bajo cierto tipo de daltonismo.
export function findIndistinguishablePairs(
  hexes: string[],
  type: CBType,
  threshold = 60,
): ConfusablePair[] {
  const parsed = hexes
    .map((hex) => ({ hex, rgb: hexToRgb(hex) }))
    .filter((c): c is { hex: string; rgb: RGB } => c.rgb !== null);

  const pairs: ConfusablePair[] = [];
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const origDist = colorDistance(parsed[i].rgb, parsed[j].rgb);
      if (origDist < threshold) continue; // ya eran casi iguales
      const simDist = colorDistance(
        simulateRgb(parsed[i].rgb, type),
        simulateRgb(parsed[j].rgb, type),
      );
      if (simDist < threshold) {
        pairs.push({ a: parsed[i].hex, b: parsed[j].hex, distance: simDist });
      }
    }
  }
  return pairs.sort((x, y) => x.distance - y.distance);
}
