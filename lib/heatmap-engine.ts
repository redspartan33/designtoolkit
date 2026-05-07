/**
 * Motor de heatmap 100% cliente. No requiere microservicio.
 *
 * Combina cuatro señales de atención visual sobre la imagen original:
 *   - Bordes (Sobel): presencia/densidad de elementos.
 *   - Contraste de luminancia: |L - blur(L)|.
 *   - Saturación: colores vivos llaman la atención.
 *   - Sesgo central: F/Z reading pattern, ligeramente arriba del centro.
 *
 * Las señales se precalculan una vez al cargar la imagen.
 * `render()` combina con pesos del usuario, aplica umbral, blur final,
 * colormap JET y compone sobre el original. Suficientemente rápido para
 * sliders en vivo (~50-150ms en 800px).
 */

const JET_LUT = new Uint8ClampedArray(256 * 3);
{
  const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    JET_LUT[i * 3] = clamp(1.5 - Math.abs(4 * v - 3)) * 255;
    JET_LUT[i * 3 + 1] = clamp(1.5 - Math.abs(4 * v - 2)) * 255;
    JET_LUT[i * 3 + 2] = clamp(1.5 - Math.abs(4 * v - 1)) * 255;
  }
}

export interface HeatmapOptions {
  /** Peso de bordes (0..1) — densidad de elementos visuales. */
  edgeWeight: number;
  /** Peso de contraste de luminancia (0..1). */
  contrastWeight: number;
  /** Peso de saturación de color (0..1). */
  colorWeight: number;
  /** Peso del sesgo central / patrón F-Z (0..1). */
  centerWeight: number;
  /** Si false, ignora completamente el sesgo central (los picos compiten por mérito propio). */
  enableCenterBias: boolean;
  /** Umbral de "puntos calientes" (0..1). Más alto = menos puntos, más selectivo. */
  threshold: number;
  /** Tamaño del foco — sigma del blur final, fracción del lado mayor (0.01..0.15). */
  spread: number;
  /** Intensidad / opacidad máxima del overlay (0..1). */
  intensity: number;
}

export const DEFAULT_HEATMAP_OPTIONS: HeatmapOptions = {
  edgeWeight: 0.55,
  contrastWeight: 0.45,
  colorWeight: 0.35,
  centerWeight: 0.15,
  enableCenterBias: true,
  threshold: 0.25,
  spread: 0.025,
  intensity: 0.78,
};

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Pone un canal Uint8 (0..255) en un canvas como gris RGBA. */
function channelToCanvas(
  channel: Uint8ClampedArray,
  w: number,
  h: number,
): HTMLCanvasElement {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const id = ctx.createImageData(w, h);
  for (let i = 0, j = 0; i < channel.length; i++, j += 4) {
    const v = channel[i];
    id.data[j] = v;
    id.data[j + 1] = v;
    id.data[j + 2] = v;
    id.data[j + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

/** Blur Gaussiano vía filtro nativo de canvas (acelerado por GPU). */
function blurChannel(
  channel: Uint8ClampedArray,
  w: number,
  h: number,
  sigmaPx: number,
): Uint8ClampedArray {
  if (sigmaPx < 0.5) return channel.slice();
  const src = channelToCanvas(channel, w, h);
  const dst = makeCanvas(w, h);
  const ctx = dst.getContext("2d")!;
  ctx.filter = `blur(${sigmaPx}px)`;
  ctx.drawImage(src, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  const out = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) out[i] = data[j];
  return out;
}

function normalize(arr: Float32Array): Uint8ClampedArray {
  let mn = Infinity;
  let mx = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  const out = new Uint8ClampedArray(arr.length);
  if (mx - mn < 1e-6) return out;
  const inv = 255 / (mx - mn);
  for (let i = 0; i < arr.length; i++) out[i] = (arr[i] - mn) * inv;
  return out;
}

function computeLuminance(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) {
    out[i] = (0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2]) | 0;
  }
  return out;
}

function computeSaturation(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) {
    const r = rgba[j];
    const g = rgba[j + 1];
    const b = rgba[j + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    out[i] = max === 0 ? 0 : ((max - min) * 255) / max;
  }
  return out;
}

function computeSobel(
  lum: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = lum[i - w - 1];
      const tc = lum[i - w];
      const tr = lum[i - w + 1];
      const ml = lum[i - 1];
      const mr = lum[i + 1];
      const bl = lum[i + w - 1];
      const bc = lum[i + w];
      const br = lum[i + w + 1];
      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const m = Math.sqrt(gx * gx + gy * gy);
      out[i] = m > 255 ? 255 : m;
    }
  }
  return out;
}

function computeCenterBias(w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h);
  const cx = w * 0.5;
  const cy = h * 0.42; // ligeramente arriba del centro (F-Z pattern)
  const sx = w * 0.4;
  const sy = h * 0.35;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / sx;
      const dy = (y - cy) / sy;
      const v = Math.exp(-(dx * dx + dy * dy) * 0.5);
      out[y * w + x] = (v * 255) | 0;
    }
  }
  return out;
}

function absDiff(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.abs(a[i] - b[i]);
  return out;
}

export interface Peak {
  /** Coordenada X en el espacio de trabajo (imagen downscaleada, lado mayor 800). */
  x: number;
  /** Coordenada Y en el espacio de trabajo. */
  y: number;
  /** Intensidad 0..255 en el mapa post-blur. */
  value: number;
  /** Ranking 1..N (1 = más caliente). */
  rank: number;
}

interface DetectPeaksOptions {
  /** Radio de NMS en píxeles. Picos a menos distancia se fusionan. */
  radius: number;
  /** Umbral mínimo (0..255). Valores por debajo no se consideran picos. */
  threshold: number;
  /** Top N picos a retornar. */
  maxPeaks: number;
}

/**
 * Non-Maximum Suppression: encuentra máximos locales discretos en `smoothed`.
 * - Recorre cada píxel y verifica si supera todos los vecinos en una ventana de radio `radius`.
 * - Marca la ventana como visitada para evitar re-disparar en empates planos.
 * - Ordena por valor descendente y trunca a `maxPeaks`.
 *
 * Complejidad: O(w·h·r²) en el peor caso, pero el filtro por threshold descarta
 * la mayoría de píxeles antes de la inspección de ventana.
 */
function detectPeaks(
  smoothed: Uint8ClampedArray,
  w: number,
  h: number,
  opts: DetectPeaksOptions,
): Peak[] {
  const { radius: r, threshold: thr, maxPeaks } = opts;
  const candidates: Peak[] = [];
  const visited = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx]) continue;
      const v = smoothed[idx];
      if (v < thr) continue;

      const y0 = y - r < 0 ? 0 : y - r;
      const y1 = y + r > h - 1 ? h - 1 : y + r;
      const x0 = x - r < 0 ? 0 : x - r;
      const x1 = x + r > w - 1 ? w - 1 : x + r;

      let isMax = true;
      for (let ny = y0; ny <= y1 && isMax; ny++) {
        const rowOff = ny * w;
        for (let nx = x0; nx <= x1; nx++) {
          if (smoothed[rowOff + nx] > v) {
            isMax = false;
            break;
          }
        }
      }
      if (!isMax) continue;

      candidates.push({ x, y, value: v, rank: 0 });
      for (let ny = y0; ny <= y1; ny++) {
        const rowOff = ny * w;
        for (let nx = x0; nx <= x1; nx++) {
          visited[rowOff + nx] = 1;
        }
      }
    }
  }

  candidates.sort((a, b) => b.value - a.value);
  return candidates.slice(0, maxPeaks).map((p, i) => ({ ...p, rank: i + 1 }));
}

interface PrecomputedSignals {
  width: number;
  height: number;
  originalCanvas: HTMLCanvasElement;
  edges: Uint8ClampedArray;
  contrast: Uint8ClampedArray;
  saturation: Uint8ClampedArray;
  center: Uint8ClampedArray;
  /** Tamaños originales para reescalar el resultado al export. */
  originalWidth: number;
  originalHeight: number;
}

export class HeatmapEngine {
  private signals: PrecomputedSignals | null = null;
  /** Picos detectados en el último composite(). Coordenadas en espacio de trabajo. */
  lastPeaks: Peak[] = [];

  /** Precalcula señales (una sola vez por imagen). */
  async load(image: HTMLImageElement): Promise<void> {
    const ow = image.naturalWidth || image.width;
    const oh = image.naturalHeight || image.height;
    const maxDim = 800;
    const scale = Math.min(1, maxDim / Math.max(ow, oh));
    const w = Math.max(1, Math.floor(ow * scale));
    const h = Math.max(1, Math.floor(oh * scale));

    const work = makeCanvas(w, h);
    const ctx = work.getContext("2d")!;
    ctx.drawImage(image, 0, 0, w, h);
    const rgba = ctx.getImageData(0, 0, w, h).data;

    const lum = computeLuminance(rgba);
    const lumBlurred = blurChannel(lum, w, h, w * 0.05);
    const contrastRaw = absDiff(lum, lumBlurred);
    const contrast = blurChannel(contrastRaw, w, h, w * 0.025);

    const sobel = computeSobel(lum, w, h);
    const edges = blurChannel(sobel, w, h, w * 0.04);

    const saturation = blurChannel(computeSaturation(rgba), w, h, w * 0.03);
    const center = computeCenterBias(w, h);

    this.signals = {
      width: w,
      height: h,
      originalWidth: ow,
      originalHeight: oh,
      originalCanvas: work,
      edges,
      contrast,
      saturation,
      center,
    };
  }

  ready(): boolean {
    return this.signals !== null;
  }

  /** Combina señales con los pesos dados y produce un canvas RGBA con el resultado. */
  private composite(opts: HeatmapOptions): HTMLCanvasElement {
    const s = this.signals;
    if (!s) throw new Error("HeatmapEngine: load() must be called first");

    const { width: w, height: h } = s;
    const cWeight = opts.enableCenterBias ? opts.centerWeight : 0;
    const totalW =
      opts.edgeWeight + opts.contrastWeight + opts.colorWeight + cWeight || 1;
    const wE = opts.edgeWeight / totalW;
    const wC = opts.contrastWeight / totalW;
    const wS = opts.colorWeight / totalW;
    const wB = cWeight / totalW;

    const combined = new Float32Array(w * h);
    for (let i = 0; i < combined.length; i++) {
      combined[i] =
        wE * s.edges[i] +
        wC * s.contrast[i] +
        wS * s.saturation[i] +
        wB * s.center[i];
    }
    const normalized = normalize(combined);

    const sigma = Math.max(w, h) * Math.max(0.005, opts.spread);
    const smoothed = blurChannel(normalized, w, h, sigma);

    // umbral suave: por debajo del umbral, alpha = 0; por encima, curva 1.5
    const thr = Math.max(0, Math.min(0.99, opts.threshold));
    const alphaScale = Math.max(0, Math.min(1, opts.intensity));

    // Detección de picos discretos sobre el mapa post-blur.
    // Radio = sigma * 1.2 (un poco mayor que el lóbulo del Gaussiano) con piso de 8px
    // para que con spreads chicos no se dispare con ruido de alta frecuencia.
    const peakRadius = Math.max(8, Math.round(sigma * 1.2));
    this.lastPeaks = detectPeaks(smoothed, w, h, {
      radius: peakRadius,
      threshold: Math.round(thr * 255),
      maxPeaks: 8,
    });

    const result = makeCanvas(w, h);
    const ctx = result.getContext("2d")!;
    ctx.drawImage(s.originalCanvas, 0, 0);
    const baseImage = ctx.getImageData(0, 0, w, h);
    const data = baseImage.data;

    for (let i = 0, j = 0; i < smoothed.length; i++, j += 4) {
      const v = smoothed[i] / 255;
      if (v <= thr) continue;
      // re-mapeo: (v - thr) / (1 - thr), curva 1.5 para amplificar las zonas calientes
      const t = (v - thr) / (1 - thr);
      const a = t ** 1.5 * alphaScale;
      // colormap JET indexado por t (no por v) para que el rango siempre alcance el rojo
      const idx = (t * 255) | 0;
      const r = JET_LUT[idx * 3];
      const g = JET_LUT[idx * 3 + 1];
      const b = JET_LUT[idx * 3 + 2];
      data[j] = data[j] * (1 - a) + r * a;
      data[j + 1] = data[j + 1] * (1 - a) + g * a;
      data[j + 2] = data[j + 2] * (1 - a) + b * a;
    }
    ctx.putImageData(baseImage, 0, 0);
    return result;
  }

  /** Renderiza a un dataURL en escala de trabajo (rápido, para preview en vivo). */
  renderPreviewDataURL(opts: HeatmapOptions): string {
    return this.composite(opts).toDataURL("image/jpeg", 0.9);
  }

  /** Exporta a Blob en la resolución original de la imagen. */
  async renderFullBlob(opts: HeatmapOptions): Promise<Blob> {
    const small = this.composite(opts);
    const s = this.signals!;
    const out = makeCanvas(s.originalWidth, s.originalHeight);
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(small, 0, 0, s.originalWidth, s.originalHeight);
    return await new Promise<Blob>((resolve, reject) => {
      out.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.94,
      );
    });
  }
}
