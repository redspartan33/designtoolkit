"use client";

import { useState, useMemo } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Stats helpers ────────────────────────────────────────────────────────────

// Normal distribution CDF approximation (Abramowitz & Stegun)
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

function zScore(p: number, q: number, pa: number, qa: number, na: number, nb: number): number {
  const pooled = (p * na + pa * nb) / (na + nb);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / na + 1 / nb));
  if (se === 0) return 0;
  return (pa - p) / se;
}

function pValue(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function requiredSampleSize(baseRate: number, mde: number, alpha: number, power: number): number {
  // Two-tailed z for alpha
  const zAlpha: Record<number, number> = { 0.1: 1.645, 0.05: 1.96, 0.01: 2.576 };
  // z for power
  const zPower: Record<number, number> = { 0.8: 0.842, 0.9: 1.282, 0.95: 1.645 };

  const za = zAlpha[alpha] ?? 1.96;
  const zp = zPower[power] ?? 0.842;
  const p1 = baseRate;
  const p2 = baseRate * (1 + mde / 100);

  const n =
    ((za * Math.sqrt(2 * p1 * (1 - p1)) + zp * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) /
    (p2 - p1) ** 2;

  return Math.ceil(n);
}

// ─── Component ────────────────────────────────────────────────────────────────

const SIGNIFICANCE_LEVELS = [
  { label: "90%", value: 0.1 },
  { label: "95%", value: 0.05 },
  { label: "99%", value: 0.01 },
];

const POWER_LEVELS = [
  { label: "80%", value: 0.8 },
  { label: "90%", value: 0.9 },
  { label: "95%", value: 0.95 },
];

export default function ABTestCalculatorPage() {
  // Result calculator
  const [visitorsA, setVisitorsA] = useState<string>("1000");
  const [conversionsA, setConversionsA] = useState<string>("50");
  const [visitorsB, setVisitorsB] = useState<string>("1000");
  const [conversionsB, setConversionsB] = useState<string>("65");
  const [alpha, setAlpha] = useState(0.05);

  // Sample size calculator
  const [baseRate, setBaseRate] = useState<string>("5");
  const [mde, setMde] = useState<string>("20");
  const [powerLevel, setPowerLevel] = useState(0.8);
  const [alphaSS, setAlphaSS] = useState(0.05);

  // ── Result calculation
  const result = useMemo(() => {
    const na = Number(visitorsA);
    const ca = Number(conversionsA);
    const nb = Number(visitorsB);
    const cb = Number(conversionsB);

    if (!na || !nb || ca > na || cb > nb || na <= 0 || nb <= 0) return null;

    const pa = ca / na;
    const pb = cb / nb;
    const z = zScore(pa, 1 - pa, pb, 1 - pb, na, nb);
    const pv = pValue(z);
    const significant = pv < alpha;
    const relLift = pa > 0 ? ((pb - pa) / pa) * 100 : 0;
    const ciMargin = 1.96 * Math.sqrt(pb * (1 - pb) / nb);

    return { pa, pb, z, pv, significant, relLift, ciMargin };
  }, [visitorsA, conversionsA, visitorsB, conversionsB, alpha]);

  // ── Sample size calculation
  const sampleSize = useMemo(() => {
    const br = Number(baseRate) / 100;
    const m = Number(mde);
    if (!br || !m || br <= 0 || br >= 1 || m <= 0) return null;
    return requiredSampleSize(br, m, alphaSS, powerLevel);
  }, [baseRate, mde, alphaSS, powerLevel]);

  return (
    <ToolPageShell toolId="ab-test-calculator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Result calculator ──────────────────────────────────── */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold">¿Es significativo mi test?</h2>
          <p className="text-sm text-muted-foreground">Ingresa los resultados de tu experimento para calcular significancia estadística.</p>

          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-5">
            {/* Variants */}
            <div className="grid grid-cols-2 gap-6">
              {/* Control */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm font-bold">Control (A)</span>
                </div>
                <Field label="Visitantes">
                  <Input type="number" min={1} value={visitorsA} onChange={(e) => setVisitorsA(e.target.value)} className="font-mono" />
                </Field>
                <Field label="Conversiones">
                  <Input type="number" min={0} value={conversionsA} onChange={(e) => setConversionsA(e.target.value)} className="font-mono" />
                </Field>
                {result && (
                  <div className="text-center py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                      {(result.pa * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">tasa de conversión</div>
                  </div>
                )}
              </div>

              {/* Variant */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-primary" />
                  <span className="text-sm font-bold">Variante (B)</span>
                </div>
                <Field label="Visitantes">
                  <Input type="number" min={1} value={visitorsB} onChange={(e) => setVisitorsB(e.target.value)} className="font-mono" />
                </Field>
                <Field label="Conversiones">
                  <Input type="number" min={0} value={conversionsB} onChange={(e) => setConversionsB(e.target.value)} className="font-mono" />
                </Field>
                {result && (
                  <div className="text-center py-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="text-2xl font-bold font-mono text-primary">
                      {(result.pb * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">tasa de conversión</div>
                  </div>
                )}
              </div>
            </div>

            {/* Significance level */}
            <div className="space-y-2">
              <Label>Nivel de significancia</Label>
              <div className="flex gap-2">
                {SIGNIFICANCE_LEVELS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setAlpha(s.value)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-sm border font-medium transition-colors",
                      alpha === s.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Confianza requerida para declarar un ganador. 95% es el estándar de la industria.
              </p>
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div className={cn(
              "rounded-2xl p-6 border space-y-4 transition-colors",
              result.significant
                ? "bg-green-500/8 border-green-500/20"
                : "bg-amber-500/8 border-amber-500/20"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("text-lg font-black", result.significant ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                    {result.significant ? "Resultado significativo ✓" : "No significativo aún"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {result.significant
                      ? `Puedes declarar a B como ganador con ${Math.round((1 - alpha) * 100)}% de confianza.`
                      : "Necesitas más datos o el efecto es demasiado pequeño."}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Lift relativo" value={`${result.relLift > 0 ? "+" : ""}${round2(result.relLift)}%`} highlight={result.relLift > 0} />
                <StatBox label="p-value" value={result.pv < 0.001 ? "<0.001" : result.pv.toFixed(4)} />
                <StatBox label="z-score" value={round2(result.z).toString()} />
              </div>

              <div className="text-xs text-muted-foreground bg-background/40 rounded-xl p-3">
                <strong>IC 95% variante B:</strong> {((result.pb - result.ciMargin) * 100).toFixed(2)}% – {((result.pb + result.ciMargin) * 100).toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Sample size ───────────────────────────────────────── */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold">¿Cuántos usuarios necesito?</h2>
          <p className="text-sm text-muted-foreground">Calcula el tamaño mínimo de muestra antes de lanzar tu experimento.</p>

          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-5">
            <Field label="Tasa de conversión base (%)" hint="La tasa actual antes del cambio. Ej: si convierte el 5%, escribe 5.">
              <Input type="number" min={0.1} max={99} step={0.1} value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className="font-mono" />
            </Field>

            <Field label="Mínimo efecto detectable — MDE (%)" hint="¿Cuál es la mejora mínima que te importaría detectar? Ej: 20 = esperas al menos +20% relativo.">
              <div className="flex items-center gap-3">
                <input
                  type="range" min={5} max={100} step={5}
                  value={mde}
                  onChange={(e) => setMde(e.target.value)}
                  className="flex-1 accent-primary"
                />
                <span className="font-mono text-sm w-12 text-right">{mde}%</span>
              </div>
              <Input type="number" min={1} max={200} value={mde} onChange={(e) => setMde(e.target.value)} className="font-mono mt-2" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Significancia</Label>
                <div className="flex flex-col gap-1">
                  {SIGNIFICANCE_LEVELS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setAlphaSS(s.value)}
                      className={cn(
                        "py-1.5 rounded-lg text-sm border transition-colors",
                        alphaSS === s.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {s.label} confianza
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Potencia estadística</Label>
                <div className="flex flex-col gap-1">
                  {POWER_LEVELS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPowerLevel(p.value)}
                      className={cn(
                        "py-1.5 rounded-lg text-sm border transition-colors",
                        powerLevel === p.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {p.label} potencia
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sample size result */}
          {sampleSize && (
            <div className="glass-panel rounded-2xl p-6 border border-primary/20 bg-primary/5 space-y-4">
              <div className="text-center space-y-1">
                <div className="text-5xl font-black font-mono text-primary">
                  {sampleSize.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">usuarios por variante</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <StatBox label="Total (A+B)" value={(sampleSize * 2).toLocaleString()} />
                <StatBox label="Efecto mínimo" value={`${mde}% relativo`} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Con {(Number(baseRate)).toFixed(1)}% de tasa base, necesitas detectar un cambio a{" "}
                {(Number(baseRate) * (1 + Number(mde) / 100)).toFixed(2)}%.
              </p>
            </div>
          )}

          {/* Glossary */}
          <div className="glass-panel rounded-2xl p-5 border border-border/40 space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Glosario rápido</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p><strong className="text-foreground">p-value</strong> — Probabilidad de ver este resultado por azar si no hubiera diferencia real. Menor = más evidencia.</p>
              <p><strong className="text-foreground">MDE</strong> — Minimum Detectable Effect. El cambio más pequeño que quieres poder detectar con tu experimento.</p>
              <p><strong className="text-foreground">Potencia</strong> — Probabilidad de detectar un efecto real si existe. 80% es el mínimo aceptable.</p>
              <p><strong className="text-foreground">IC 95%</strong> — Intervalo de confianza. Si repitieras el experimento 100 veces, en ~95 la tasa real caería en ese rango.</p>
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-background/50 rounded-xl p-3 text-center border border-border/30">
      <div className={cn("text-lg font-bold font-mono", highlight && "text-green-600 dark:text-green-400")}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
