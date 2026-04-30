"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Download,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BriefData {
  // Step 1 — Overview
  projectName: string;
  projectType: string;
  description: string;

  // Step 2 — Problem
  problemStatement: string;
  currentSituation: string;
  whyNow: string;

  // Step 3 — Audience
  primaryPersona: string;
  primaryNeeds: string;
  secondaryPersona: string;

  // Step 4 — Goals
  businessGoals: string;
  userGoals: string;

  // Step 5 — Constraints
  timeline: string;
  technicalConstraints: string;
  brandConstraints: string;

  // Step 6 — Success
  successMetrics: string;
  outOfScope: string;
}

const EMPTY: BriefData = {
  projectName: "",
  projectType: "",
  description: "",
  problemStatement: "",
  currentSituation: "",
  whyNow: "",
  primaryPersona: "",
  primaryNeeds: "",
  secondaryPersona: "",
  businessGoals: "",
  userGoals: "",
  timeline: "",
  technicalConstraints: "",
  brandConstraints: "",
  successMetrics: "",
  outOfScope: "",
};

const PROJECT_TYPES = [
  "Aplicación móvil",
  "Sitio web",
  "Dashboard",
  "Feature nueva",
  "Rediseño",
  "Sistema de diseño",
  "Producto interno",
  "Otro",
];

const STEPS = [
  { id: 1, label: "Proyecto" },
  { id: 2, label: "Problema" },
  { id: 3, label: "Audiencia" },
  { id: 4, label: "Objetivos" },
  { id: 5, label: "Restricciones" },
  { id: 6, label: "Éxito" },
];

// ─── Brief generation ─────────────────────────────────────────────────────────

function generateBrief(d: BriefData): string {
  const date = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `# Design Brief — ${d.projectName || "Proyecto sin nombre"}

**Tipo:** ${d.projectType || "—"}
**Fecha:** ${date}

---

## Descripción del Proyecto
${d.description || "—"}

---

## El Problema

**Declaración del problema:**
${d.problemStatement || "—"}

**Situación actual:**
${d.currentSituation || "—"}

**¿Por qué ahora?**
${d.whyNow || "—"}

---

## Audiencia

**Persona primaria:**
${d.primaryPersona || "—"}

**Necesidades clave:**
${d.primaryNeeds || "—"}

**Persona secundaria:**
${d.secondaryPersona || "—"}

---

## Objetivos

**Objetivos de negocio:**
${d.businessGoals || "—"}

**Objetivos de usuario:**
${d.userGoals || "—"}

---

## Restricciones

**Timeline:**
${d.timeline || "—"}

**Restricciones técnicas:**
${d.technicalConstraints || "—"}

**Restricciones de marca:**
${d.brandConstraints || "—"}

---

## Criterios de Éxito

**Métricas de éxito:**
${d.successMetrics || "—"}

**Fuera de alcance:**
${d.outOfScope || "—"}

---

*Generado con DesignKit — Brief Builder*`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BriefBuilderPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BriefData>(EMPTY);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field: keyof BriefData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setData((prev) => ({ ...prev, [field]: e.target.value }));

  const brief = generateBrief(data);

  function handleCopy() {
    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brief-${(data.projectName || "proyecto")
      .toLowerCase()
      .replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setData(EMPTY);
    setStep(1);
    setDone(false);
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <ToolPageShell toolId="brief-builder">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Tu Brief</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  .md
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Nuevo
                </Button>
              </div>
            </div>
            <pre className="glass-panel rounded-xl p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-[70vh] border border-border/40">
              {brief}
            </pre>
          </div>

          {/* Summary cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Resumen</h2>
            <div className="grid grid-cols-1 gap-3">
              <SummaryCard label="Proyecto" value={data.projectName} sub={data.projectType} />
              <SummaryCard label="Problema" value={data.problemStatement} />
              <SummaryCard label="Persona primaria" value={data.primaryPersona} />
              <SummaryCard label="Objetivos de negocio" value={data.businessGoals} />
              <SummaryCard label="Timeline" value={data.timeline} />
              <SummaryCard label="Métricas de éxito" value={data.successMetrics} />
            </div>
          </div>
        </div>
      </ToolPageShell>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────
  return (
    <ToolPageShell toolId="brief-builder">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Stepper */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "flex flex-col items-center gap-1 group",
                  s.id < step && "cursor-pointer"
                )}
              >
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                    step === s.id &&
                      "bg-primary border-primary text-primary-foreground",
                    step > s.id &&
                      "bg-primary/20 border-primary/40 text-primary",
                    step < s.id &&
                      "bg-muted/40 border-border text-muted-foreground"
                  )}
                >
                  {s.id}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium hidden sm:block",
                    step === s.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2 mb-4",
                    step > s.id ? "bg-primary/40" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="glass-panel rounded-2xl p-8 border border-border/40 space-y-6">
          {step === 1 && (
            <StepSection title="Proyecto" description="¿Qué vamos a diseñar?">
              <Field label="Nombre del proyecto *">
                <Input
                  placeholder="Ej. App de onboarding para Fintech XYZ"
                  value={data.projectName}
                  onChange={set("projectName")}
                />
              </Field>
              <Field label="Tipo de proyecto">
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setData((p) => ({ ...p, projectType: t }))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        data.projectType === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Descripción general">
                <Textarea
                  rows={3}
                  placeholder="Describe brevemente el proyecto, su contexto y alcance general."
                  value={data.description}
                  onChange={set("description")}
                />
              </Field>
            </StepSection>
          )}

          {step === 2 && (
            <StepSection
              title="El Problema"
              description="Define claramente qué estás resolviendo."
            >
              <Field label="Declaración del problema *" hint="Intenta el formato: [Persona] necesita [necesidad] porque [insight]">
                <Textarea
                  rows={3}
                  placeholder="Ej. Los nuevos usuarios de la app abandonan el proceso de alta porque es demasiado largo y confuso."
                  value={data.problemStatement}
                  onChange={set("problemStatement")}
                />
              </Field>
              <Field label="Situación actual">
                <Textarea
                  rows={3}
                  placeholder="¿Cómo resuelve el usuario este problema hoy? ¿Qué existe actualmente?"
                  value={data.currentSituation}
                  onChange={set("currentSituation")}
                />
              </Field>
              <Field label="¿Por qué ahora?">
                <Textarea
                  rows={2}
                  placeholder="¿Qué cambia en el negocio, mercado o usuario que hace este problema urgente?"
                  value={data.whyNow}
                  onChange={set("whyNow")}
                />
              </Field>
            </StepSection>
          )}

          {step === 3 && (
            <StepSection
              title="Audiencia"
              description="¿Para quién estamos diseñando?"
            >
              <Field
                label="Persona primaria *"
                hint="Nombre, rol, contexto relevante"
              >
                <Textarea
                  rows={3}
                  placeholder="Ej. Ana, 28 años, emprendedora sin conocimientos financieros. Usa el móvil como herramienta principal de trabajo."
                  value={data.primaryPersona}
                  onChange={set("primaryPersona")}
                />
              </Field>
              <Field label="Necesidades clave de la persona primaria">
                <Textarea
                  rows={3}
                  placeholder="¿Qué necesita lograr? ¿Qué la frustra actualmente? ¿Qué espera de la experiencia?"
                  value={data.primaryNeeds}
                  onChange={set("primaryNeeds")}
                />
              </Field>
              <Field label="Persona secundaria (opcional)">
                <Textarea
                  rows={2}
                  placeholder="Ej. Carlos, administrador de empresa. Accede esporádicamente para revisar reportes."
                  value={data.secondaryPersona}
                  onChange={set("secondaryPersona")}
                />
              </Field>
            </StepSection>
          )}

          {step === 4 && (
            <StepSection
              title="Objetivos"
              description="¿Qué quiere lograr el negocio y qué quiere lograr el usuario?"
            >
              <Field
                label="Objetivos de negocio"
                hint="Cada objetivo en una línea. Sé específico y medible."
              >
                <Textarea
                  rows={4}
                  placeholder={`- Reducir tasa de abandono en onboarding de 60% a 30%\n- Aumentar activaciones en los primeros 7 días\n- Reducir tickets de soporte sobre el proceso de alta`}
                  value={data.businessGoals}
                  onChange={set("businessGoals")}
                />
              </Field>
              <Field
                label="Objetivos de usuario"
                hint="¿Qué necesita poder hacer, sentir o entender el usuario?"
              >
                <Textarea
                  rows={4}
                  placeholder={`- Completar el registro en menos de 5 minutos\n- Entender qué está haciendo y por qué\n- Sentir confianza en el proceso`}
                  value={data.userGoals}
                  onChange={set("userGoals")}
                />
              </Field>
            </StepSection>
          )}

          {step === 5 && (
            <StepSection
              title="Restricciones"
              description="¿Qué no podemos cambiar o que limita nuestra solución?"
            >
              <Field label="Timeline">
                <Input
                  placeholder="Ej. 6 semanas — entrega a ingeniería el 15 de junio"
                  value={data.timeline}
                  onChange={set("timeline")}
                />
              </Field>
              <Field label="Restricciones técnicas">
                <Textarea
                  rows={3}
                  placeholder={`- La app es React Native, no podemos cambiar el stack\n- El backend no soporta autenticación biométrica aún\n- Debe funcionar offline`}
                  value={data.technicalConstraints}
                  onChange={set("technicalConstraints")}
                />
              </Field>
              <Field label="Restricciones de marca / producto">
                <Textarea
                  rows={3}
                  placeholder={`- Debe seguir el design system existente\n- No podemos cambiar el logo ni los colores primarios\n- El tono de voz es formal pero cercano`}
                  value={data.brandConstraints}
                  onChange={set("brandConstraints")}
                />
              </Field>
            </StepSection>
          )}

          {step === 6 && (
            <StepSection
              title="Criterios de Éxito"
              description="¿Cómo sabremos que el diseño funcionó?"
            >
              <Field
                label="Métricas de éxito"
                hint="Define KPIs concretos que medirás post-lanzamiento"
              >
                <Textarea
                  rows={4}
                  placeholder={`- Tasa de completitud del onboarding > 70%\n- NPS de la experiencia de alta ≥ 40\n- Reducción de 30% en tickets de soporte relacionados\n- Tiempo promedio de alta < 4 minutos`}
                  value={data.successMetrics}
                  onChange={set("successMetrics")}
                />
              </Field>
              <Field
                label="Fuera de alcance"
                hint="Explicitar qué NO haremos evita scope creep"
              >
                <Textarea
                  rows={3}
                  placeholder={`- No rediseñaremos el dashboard principal\n- No incluiremos onboarding para cuentas corporativas\n- No trabajaremos en la versión web en esta fase`}
                  value={data.outOfScope}
                  onChange={set("outOfScope")}
                />
              </Field>
            </StepSection>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            {step} / {STEPS.length}
          </span>

          {step < STEPS.length ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setDone(true)}
              disabled={!data.projectName.trim()}
            >
              Generar Brief
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 border border-border/30">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      <p className="text-sm font-medium leading-snug line-clamp-2">
        {value || <span className="text-muted-foreground italic">Sin completar</span>}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
