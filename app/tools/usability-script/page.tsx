"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy, Check, Download, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  scenario: string;
  successCriteria: string;
}

interface Section {
  id: string;
  title: string;
  questions: string[];
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

const DEFAULT_SECTIONS: Section[] = [
  {
    id: uid(),
    title: "Warm-up",
    questions: [
      "¿Puedes contarme un poco sobre tu rol y cómo usas [producto] día a día?",
      "¿Cuánto tiempo llevas usando este tipo de producto/servicio?",
    ],
  },
  {
    id: uid(),
    title: "Cierre",
    questions: [
      "¿Hay algo más que quieras compartir sobre tu experiencia de hoy?",
      "Si pudieras cambiar una cosa de lo que probaste hoy, ¿qué sería?",
      "¿Tienes alguna pregunta para mí?",
    ],
  },
];

// ─── Generator ───────────────────────────────────────────────────────────────

function generateScript(data: {
  product: string;
  goal: string;
  duration: string;
  participantProfile: string;
  moderator: string;
  tasks: Task[];
  sections: Section[];
}): string {
  const date = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const intro = `# Guión de Test de Usabilidad
**Producto/Feature:** ${data.product || "—"}
**Objetivo de la sesión:** ${data.goal || "—"}
**Duración estimada:** ${data.duration || "—"}
**Perfil del participante:** ${data.participantProfile || "—"}
**Moderador:** ${data.moderator || "—"}
**Fecha:** ${date}

---

## Introducción (5 min)

Hola, [nombre del participante]. Muchas gracias por dedicar tu tiempo hoy.

Mi nombre es ${data.moderator || "[nombre]"} y estoy aquí para hacer algunas preguntas y pedirte que realices algunas tareas con un producto. El objetivo es aprender de tu experiencia, no evaluar tus habilidades — no hay respuestas correctas o incorrectas.

**Puntos importantes:**
- Esta sesión dura aproximadamente ${data.duration || "[duración]"}.
- Mientras realizas las tareas, te pido que **pienses en voz alta** — cuéntame qué estás pensando, qué esperas que pase, qué te confunde.
- Puedes detenerte en cualquier momento.
- Con tu permiso, grabaremos la sesión para análisis interno. ¿Estás de acuerdo?

¿Tienes alguna pregunta antes de comenzar?

---`;

  const warmup = data.sections
    .filter((s) => s.title === "Warm-up")
    .map(
      (s) =>
        `## ${s.title}\n\n${s.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    )
    .join("\n\n");

  const tasks = data.tasks
    .map(
      (t, i) => `## Tarea ${i + 1}: ${t.title || `Tarea ${i + 1}`}

**Escenario:**
> ${t.scenario || "—"}

**Probes durante la tarea:**
- ¿Qué estás pensando en este momento?
- ¿Qué esperabas que pasara?
- ¿Qué harías a continuación normalmente?

**Criterio de éxito:** ${t.successCriteria || "—"}

---`
    )
    .join("\n\n");

  const closing = data.sections
    .filter((s) => s.title !== "Warm-up")
    .map(
      (s) =>
        `## ${s.title}\n\n${s.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    )
    .join("\n\n");

  return [intro, warmup, "---", tasks, closing].filter(Boolean).join("\n\n");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsabilityScriptPage() {
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("60 minutos");
  const [participantProfile, setParticipantProfile] = useState("");
  const [moderator, setModerator] = useState("");
  const [tasks, setTasks] = useState<Task[]>([
    { id: uid(), title: "", scenario: "", successCriteria: "" },
  ]);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [copied, setCopied] = useState(false);

  const script = generateScript({ product, goal, duration, participantProfile, moderator, tasks, sections });

  function addTask() {
    setTasks((prev) => [...prev, { id: uid(), title: "", scenario: "", successCriteria: "" }]);
  }

  function updateTask(id: string, field: keyof Task, value: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function addSection() {
    setSections((prev) => [...prev, { id: uid(), title: "Nueva sección", questions: [""] }]);
  }

  function updateSectionTitle(id: string, title: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }

  function addQuestion(sectionId: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, questions: [...s.questions, ""] } : s))
    );
  }

  function updateQuestion(sectionId: string, qi: number, value: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.map((q, i) => (i === qi ? value : q)) }
          : s
      )
    );
  }

  function removeQuestion(sectionId: string, qi: number) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((_, i) => i !== qi) }
          : s
      )
    );
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function handleCopy() {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([script], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guion-usabilidad-${(product || "test").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPageShell toolId="usability-script">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass-panel rounded-xl border border-border/40 w-fit">
        {(["editor", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "editor" ? "Editor" : "Preview"}
          </button>
        ))}
      </div>

      {tab === "editor" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Session info */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-4">
              <h3 className="font-bold">Información de la sesión</h3>
              <Field label="Producto / Feature">
                <Input placeholder="Ej. Flujo de onboarding mobile" value={product} onChange={(e) => setProduct(e.target.value)} />
              </Field>
              <Field label="Objetivo de la sesión">
                <Textarea rows={2} placeholder="¿Qué quieres aprender en esta sesión?" value={goal} onChange={(e) => setGoal(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duración">
                  <Input placeholder="60 minutos" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </Field>
                <Field label="Moderador">
                  <Input placeholder="Tu nombre" value={moderator} onChange={(e) => setModerator(e.target.value)} />
                </Field>
              </div>
              <Field label="Perfil del participante">
                <Textarea rows={2} placeholder="Ej. Usuarios nuevos, 25-40 años, que han completado el registro pero no han hecho su primera transacción." value={participantProfile} onChange={(e) => setParticipantProfile(e.target.value)} />
              </Field>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Secciones de preguntas</h3>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="h-4 w-4" /> Sección
                </Button>
              </div>
              {sections.map((section) => (
                <div key={section.id} className="glass-panel rounded-xl p-4 border border-border/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      className="font-semibold"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  {section.questions.map((q, qi) => (
                    <div key={qi} className="flex gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-2.5 shrink-0" />
                      <Input
                        value={q}
                        onChange={(e) => updateQuestion(section.id, qi, e.target.value)}
                        placeholder={`Pregunta ${qi + 1}`}
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeQuestion(section.id, qi)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addQuestion(section.id)} className="text-muted-foreground">
                    <Plus className="h-3.5 w-3.5" /> Pregunta
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Tareas</h3>
              <Button variant="outline" size="sm" onClick={addTask}>
                <Plus className="h-4 w-4" /> Tarea
              </Button>
            </div>
            {tasks.map((task, i) => (
              <div key={task.id} className="glass-panel rounded-2xl p-5 border border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Tarea {i + 1}</span>
                  {tasks.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <Field label="Título de la tarea">
                  <Input placeholder="Ej. Completar el proceso de alta" value={task.title} onChange={(e) => updateTask(task.id, "title", e.target.value)} />
                </Field>
                <Field label="Escenario" hint="Escribe en segunda persona. Da contexto sin revelar cómo hacerlo.">
                  <Textarea
                    rows={3}
                    placeholder="Imagina que eres un nuevo usuario y acabas de descargar la app. Quieres crear tu primera cuenta y hacer un depósito inicial."
                    value={task.scenario}
                    onChange={(e) => updateTask(task.id, "scenario", e.target.value)}
                  />
                </Field>
                <Field label="Criterio de éxito">
                  <Input placeholder="Ej. El usuario llega a la pantalla de confirmación sin ayuda." value={task.successCriteria} onChange={(e) => updateTask(task.id, "successCriteria", e.target.value)} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Guión generado</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" /> .md
              </Button>
            </div>
          </div>
          <pre className="glass-panel rounded-2xl p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-[70vh] border border-border/40">
            {script}
          </pre>
        </div>
      )}
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
